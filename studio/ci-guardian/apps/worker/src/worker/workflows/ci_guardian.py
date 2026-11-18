"""ci-guardian: periodieke CI-watchdog voor de weekmenu-app repo.

Checkt open Dependabot-PR's en de laatste CI-run op main. Bij falende checks
post hij een comment op de PR (eenmalig, via marker); bij een gefaalde run op
main maakt hij een issue aan (eveneens eenmalig). Met dry_run=True rapporteert
hij alleen, zonder naar GitHub te schrijven.

Authenticatie: de activity leest de GitHub PAT uit de workspace secret die als
omgevingsvariabele WEEKMENU_GITHUB_TOKEN aan de deployment is gebonden.
"""

import json
import os
import urllib.parse
import urllib.request
from datetime import timedelta
from typing import Any

import mistralai.workflows as workflows
from mistralai.workflows import workflow
from pydantic import BaseModel, Field

with workflow.unsafe.imports_passed_through():
    import httpx

GITHUB_API = "https://api.github.com"
TOKEN_ENV_VAR = "WEEKMENU_GITHUB_TOKEN"
COMMENT_MARKER = "<!-- ci-guardian -->"
ISSUE_TITLE_PREFIX = "[ci-guardian] CI failure on main"
FAILED_CONCLUSIONS = {"failure", "timed_out", "cancelled"}


class CiGuardianInput(BaseModel):
    repo: str = Field(default="MMasician/weekmenu-app")
    dry_run: bool = Field(default=False)


class FailedCheck(BaseModel):
    name: str
    conclusion: str | None
    url: str | None = None


class PrReport(BaseModel):
    number: int
    title: str
    head_sha: str
    failed_checks: list[FailedCheck]
    comment_posted: bool


class MainReport(BaseModel):
    run_id: int | None = None
    workflow_name: str | None = None
    conclusion: str | None = None
    url: str | None = None
    issue_created: bool = False
    issue_number: int | None = None


class CiGuardianOutput(BaseModel):
    repo: str
    dry_run: bool
    dependabot_prs: list[PrReport]
    main: MainReport


def _workspace_secret(name: str) -> str:
    """Leest een workspace secret via de Mistral API (service-account key van de deployment)."""
    api_key = os.environ.get("MISTRAL_API_KEY", "").strip()
    if not api_key:
        return ""
    base = (os.environ.get("MISTRAL_BASE_URL") or "https://api.mistral.ai").rstrip("/")

    def _get(path: str, query: dict[str, str] | None = None) -> Any:
        url = (
            base
            + path
            + (f"?{urllib.parse.urlencode(query, safe=':,')}" if query else "")
        )
        req = urllib.request.Request(
            url,
            headers={
                "Authorization": f"Bearer {api_key}",
                "Accept": "application/json",
            },
        )
        with urllib.request.urlopen(req, timeout=10) as resp:
            return json.load(resp)

    workspace_id = _get("/v1/users/me")["workspace"]["id"]
    page = _get(
        f"/v1/secrets/workspaces/{urllib.parse.quote(workspace_id, safe='')}",
        {"limit": "100"},
    )
    names = {item["name"].lower() for item in page.get("items", [])}
    if name.lower() not in names:
        return ""
    ref = f"secret:workspace:{name.lower()}"
    for secret in _get("/v1/secrets/values", {"names": ref}):
        if secret["name"].lower() == ref:
            return str(secret["value"])
    return ""


def _github_token() -> str:
    token = os.environ.get(TOKEN_ENV_VAR, "").strip()
    if not token:
        token = _workspace_secret(TOKEN_ENV_VAR.lower())
    if not token:
        raise RuntimeError(
            f"geen GitHub PAT gevonden: zet env-var {TOKEN_ENV_VAR} of maak workspace secret '{TOKEN_ENV_VAR.lower()}' aan"
        )
    return token


async def _gh(method: str, path: str, body: dict[str, Any] | None = None) -> Any:
    headers = {
        "Authorization": f"Bearer {_github_token()}",
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "User-Agent": "ci-guardian-workflow",
    }
    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.request(
            method, f"{GITHUB_API}{path}", headers=headers, json=body
        )
        response.raise_for_status()
        if response.content:
            return response.json()
        return None


@workflows.activity(start_to_close_timeout=timedelta(seconds=60))
async def list_open_dependabot_prs(repo: str) -> list[dict[str, Any]]:
    pulls = await _gh("GET", f"/repos/{repo}/pulls?state=open&per_page=100")
    return [p for p in pulls if (p.get("user") or {}).get("login") == "dependabot[bot]"]


@workflows.activity(start_to_close_timeout=timedelta(seconds=60))
async def failed_checks_for_sha(repo: str, sha: str) -> list[FailedCheck]:
    data = await _gh("GET", f"/repos/{repo}/commits/{sha}/check-runs?per_page=100")
    checks = data.get("check_runs") or []
    return [
        FailedCheck(
            name=str(c.get("name")),
            conclusion=c.get("conclusion"),
            url=c.get("html_url"),
        )
        for c in checks
        if c.get("conclusion") in FAILED_CONCLUSIONS
    ]


@workflows.activity(start_to_close_timeout=timedelta(seconds=60))
async def pr_has_guardian_comment(repo: str, number: int) -> bool:
    comments = await _gh("GET", f"/repos/{repo}/issues/{number}/comments?per_page=100")
    return any(COMMENT_MARKER in (c.get("body") or "") for c in comments)


@workflows.activity(
    start_to_close_timeout=timedelta(seconds=60), retry_policy_max_attempts=1
)
async def post_pr_comment(repo: str, number: int, body: str) -> None:
    await _gh("POST", f"/repos/{repo}/issues/{number}/comments", {"body": body})


@workflows.activity(start_to_close_timeout=timedelta(seconds=60))
async def latest_main_run(repo: str) -> dict[str, Any] | None:
    data = await _gh("GET", f"/repos/{repo}/actions/runs?branch=main&per_page=10")
    runs = data.get("workflow_runs") or []
    if not runs:
        return None
    latest = max(runs, key=lambda r: r.get("created_at") or "")
    return {
        "run_id": latest.get("id"),
        "workflow_name": latest.get("name"),
        "conclusion": latest.get("conclusion"),
        "url": latest.get("html_url"),
        "head_sha": latest.get("head_sha"),
    }


@workflows.activity(start_to_close_timeout=timedelta(seconds=60))
async def find_open_guardian_issue(repo: str) -> dict[str, Any] | None:
    issues = await _gh("GET", f"/repos/{repo}/issues?state=open&per_page=100")
    for issue in issues:
        if "pull_request" not in issue and (issue.get("title") or "").startswith(
            ISSUE_TITLE_PREFIX
        ):
            return issue
    return None


@workflows.activity(
    start_to_close_timeout=timedelta(seconds=60), retry_policy_max_attempts=1
)
async def create_guardian_issue(repo: str, title: str, body: str) -> int:
    data = await _gh("POST", f"/repos/{repo}/issues", {"title": title, "body": body})
    return int(data.get("number"))


def _pr_comment_body(pr_number: int, failed: list[FailedCheck]) -> str:
    lines = [
        COMMENT_MARKER,
        f"ci-guardian: op PR #{pr_number} zijn {len(failed)} CI-check(s) gefaald:",
        "",
    ]
    for check in failed:
        line = f"- **{check.name}** — `{check.conclusion}`"
        if check.url:
            line += f" {check.url}"
        lines.append(line)
    lines += [
        "",
        "Zie de check-runs op deze PR voor de logs. Deze comment wordt per PR één keer geplaatst.",
    ]
    return "\n".join(lines)


def _issue_body(main: dict[str, Any]) -> str:
    return "\n".join(
        [
            COMMENT_MARKER,
            "ci-guardian: de laatste CI-run op `main` is gefaald.",
            "",
            f"- workflow: **{main.get('workflow_name')}** (run {main.get('run_id')})",
            f"- conclusion: `{main.get('conclusion')}`",
            f"- logs: {main.get('url')}",
            f"- commit: `{main.get('head_sha')}`",
        ]
    )


@workflows.workflow.define(
    name="ci_guardian",
    workflow_description="Watchdog: checkt open Dependabot-PR's en de CI van main; comment/issue bij failures",
)
class CiGuardianWorkflow:
    @workflows.workflow.entrypoint
    async def run(self, data: CiGuardianInput) -> CiGuardianOutput:
        reports: list[PrReport] = []
        for pr in await list_open_dependabot_prs(data.repo):
            number = int(pr["number"])
            sha = str((pr.get("head") or {}).get("sha") or "")
            failed = await failed_checks_for_sha(data.repo, sha) if sha else []
            posted = False
            if (
                failed
                and not data.dry_run
                and not await pr_has_guardian_comment(data.repo, number)
            ):
                await post_pr_comment(
                    data.repo, number, _pr_comment_body(number, failed)
                )
                posted = True
            reports.append(
                PrReport(
                    number=number,
                    title=str(pr.get("title") or ""),
                    head_sha=sha,
                    failed_checks=failed,
                    comment_posted=posted,
                )
            )

        main_run = await latest_main_run(data.repo)
        main_report = MainReport()
        if main_run:
            main_report = MainReport(
                run_id=main_run.get("run_id"),
                workflow_name=main_run.get("workflow_name"),
                conclusion=main_run.get("conclusion"),
                url=main_run.get("url"),
            )
            if (
                main_run.get("conclusion") == "failure"
                and not data.dry_run
                and await find_open_guardian_issue(data.repo) is None
            ):
                number = await create_guardian_issue(
                    data.repo,
                    f"{ISSUE_TITLE_PREFIX} — run {main_run.get('run_id')}",
                    _issue_body(main_run),
                )
                main_report.issue_created = True
                main_report.issue_number = number

        return CiGuardianOutput(
            repo=data.repo,
            dry_run=data.dry_run,
            dependabot_prs=reports,
            main=main_report,
        )
