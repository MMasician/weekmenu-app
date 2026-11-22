"""issue-runner: per-issue agent-runs voor de weekmenu-app repo.

Twee workflows:

- ``issue_dispatcher`` (te schedulen): zoekt open issues met label ``ready`` of
  ``needs-rework`` zónder runner-marker-comment en start per issue een child-run van
  ``issue_agent_run`` (max. ``max_concurrent`` tegelijk, zie docs/domeinproces.md:
  maximaal 2-3 open code-branches).
- ``issue_agent_run``: pakt 1 issue op. Zet label ``in-progress`` + start-comment,
  genereert het werkproduct via de Mistral API (korte prompt; de volledige context -
  DoR, mocks, feedback - staat in het issue zelf), past de bestanden toe op een
  branch ``vibe/issue-<nr>-<slug>`` via de GitHub API, opent een draft PR en zet
  label ``needs-review`` + resultaat-comment. Met ``dry_run=True`` geen GitHub-writes.

Authenticatie: GitHub PAT via env WEEKMENU_GITHUB_TOKEN (workspace secret, idem als
ci-guardian); Mistral API via MISTRAL_API_KEY of MISTRAL_SA_TOKEN_PATH (service account).
"""

import json
import os
import re
import urllib.parse
import base64
from datetime import timedelta
from typing import Any

import mistralai.workflows as workflows
from mistralai.workflows import workflow
from pydantic import BaseModel, Field

with workflow.unsafe.imports_passed_through():
    import httpx

GITHUB_API = "https://api.github.com"
MISTRAL_API = (os.environ.get("MISTRAL_BASE_URL") or "https://api.mistral.ai").rstrip("/")
TOKEN_ENV_VAR = "WEEKMENU_GITHUB_TOKEN"
RUNNER_MARKER = "<!-- issue-runner -->"
RUNNABLE_LABELS = {"ready", "needs-rework"}
MAX_CONCURRENT_DEFAULT = 3


class IssueDispatcherInput(BaseModel):
    repo: str = Field(default="MMasician/weekmenu-app")
    dry_run: bool = Field(default=False)
    max_concurrent: int = Field(default=MAX_CONCURRENT_DEFAULT)


class StartedIssue(BaseModel):
    issue_number: int
    title: str
    labels: list[str]


class IssueDispatcherOutput(BaseModel):
    repo: str
    dry_run: bool
    started: list[StartedIssue]
    skipped_already_running: list[int]


class AgentRunInput(BaseModel):
    repo: str = Field(default="MMasician/weekmenu-app")
    issue_number: int
    mode: str = Field(default="auto")  # auto | elaborate | implement
    dry_run: bool = Field(default=False)
    model: str = Field(default="mistral-large-latest")


class AgentRunOutput(BaseModel):
    repo: str
    issue_number: int
    dry_run: bool
    branch: str | None = None
    pr_number: int | None = None
    files_changed: list[str] = Field(default_factory=list)
    summary: str = ""


def _mistral_api_key() -> str:
    """Mistral API key: env MISTRAL_API_KEY, anders de service-account token van de deployment."""
    key = os.environ.get("MISTRAL_API_KEY", "").strip()
    if not key:
        sa_path = os.environ.get("MISTRAL_SA_TOKEN_PATH", "").strip()
        if sa_path and os.path.exists(sa_path):
            with open(sa_path, encoding="utf-8") as fh:
                key = fh.read().strip()
    return key


def _workspace_secret(name: str) -> str:
    """Leest een workspace secret via de Mistral API (service-account token van de deployment)."""
    api_key = _mistral_api_key()
    if not api_key:
        return ""
    base = (os.environ.get("MISTRAL_BASE_URL") or "https://api.mistral.ai").rstrip("/")

    def _get(path: str, query: dict[str, str] | None = None) -> Any:
        url = base + path + (f"?{urllib.parse.urlencode(query, safe=':,')}" if query else "")
        req = urllib.request.Request(url, headers={"Authorization": f"Bearer {api_key}", "Accept": "application/json"})
        with urllib.request.urlopen(req, timeout=10) as resp:
            return json.load(resp)

    try:
        workspace_id = _get("/v1/users/me")["workspace"]["id"]
        page = _get(f"/v1/secrets/workspaces/{urllib.parse.quote(workspace_id, safe='')}", {"limit": "100"})
        names = {item["name"].lower() for item in page.get("items", [])}
        if name.lower() not in names:
            return ""
        ref = f"secret:workspace:{name.lower()}"
        for secret in _get("/v1/secrets/values", {"names": ref}):
            if secret["name"].lower() == ref:
                return str(secret["value"])
    except Exception:
        return ""
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


def _mistral_token() -> str:
    token = _mistral_api_key()
    if not token:
        raise RuntimeError("geen Mistral API key: zet MISTRAL_API_KEY of MISTRAL_SA_TOKEN_PATH")
    return token


async def _gh(method: str, path: str, body: dict[str, Any] | None = None) -> Any:
    headers = {
        "Authorization": f"Bearer {_github_token()}",
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "User-Agent": "issue-runner-workflow",
    }
    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.request(method, f"{GITHUB_API}{path}", headers=headers, json=body)
        if response.status_code == 404:
            return None
        response.raise_for_status()
        if response.content:
            return response.json()
        return None


async def _mistral_chat(messages: list[dict[str, str]], model: str) -> str:
    payload = {"model": model, "messages": messages, "response_format": {"type": "json_object"}}
    async with httpx.AsyncClient(timeout=600.0) as client:
        response = await client.post(
            f"{MISTRAL_API}/v1/chat/completions",
            headers={"Authorization": f"Bearer {_mistral_token()}", "Content-Type": "application/json"},
            json=payload,
        )
        response.raise_for_status()
        data = response.json()
    return data["choices"][0]["message"]["content"]


def _labels_of(issue: dict[str, Any]) -> list[str]:
    return [str(l.get("name")) for l in issue.get("labels") or []]


def _slug(title: str, max_len: int = 40) -> str:
    s = re.sub(r"[^a-z0-9]+", "-", title.lower()).strip("-")
    return (s or "issue")[:max_len].strip("-") or "issue"


# ---------- activiteiten ----------


@workflows.activity(start_to_close_timeout=timedelta(seconds=60))
async def list_open_issues(repo: str) -> list[dict[str, Any]]:
    issues = await _gh("GET", f"/repos/{repo}/issues?state=open&per_page=100")
    return [i for i in (issues or []) if "pull_request" not in i]


@workflows.activity(start_to_close_timeout=timedelta(seconds=60))
async def fetch_issue(repo: str, number: int) -> dict[str, Any]:
    issue = await _gh("GET", f"/repos/{repo}/issues/{number}")
    comments = await _gh("GET", f"/repos/{repo}/issues/{number}/comments?per_page=100")
    return {"issue": issue, "comments": comments or []}


@workflows.activity(start_to_close_timeout=timedelta(seconds=60))
async def issue_has_marker(repo: str, number: int) -> bool:
    comments = await _gh("GET", f"/repos/{repo}/issues/{number}/comments?per_page=100")
    return any(RUNNER_MARKER in (c.get("body") or "") for c in (comments or []))


@workflows.activity(start_to_close_timeout=timedelta(seconds=60), retry_policy_max_attempts=1)
async def set_issue_labels(repo: str, number: int, add: list[str], remove: list[str]) -> None:
    if add:
        await _gh("POST", f"/repos/{repo}/issues/{number}/labels", {"labels": add})
    for name in remove:
        await _gh("DELETE", f"/repos/{repo}/issues/{number}/labels/{urllib.parse.quote(name)}")


@workflows.activity(start_to_close_timeout=timedelta(seconds=60), retry_policy_max_attempts=1)
async def post_issue_comment(repo: str, number: int, body: str) -> None:
    await _gh("POST", f"/repos/{repo}/issues/{number}/comments", {"body": body})


@workflows.activity(start_to_close_timeout=timedelta(minutes=15))
async def generate_work_product(
    repo: str,
    issue_number: int,
    title: str,
    body: str,
    comments_text: str,
    mode: str,
    model: str,
) -> dict[str, Any]:
    system = (
        "Je bent de repo-agent voor het GitHub-repo " + repo + ". Je werkt issues uit volgens "
        "docs/domeinproces.md (Definition of Ready/Done, labels, mocks-eerst in docs/ux/<onderwerp>/ "
        "+ VOORSTEL.md met 3 versies per gewijzigd scherm, branch vibe/<slug>, draft PR, tests in "
        "tools/test-*.cjs, npm run build/verify, SPECS/ADR bijwerken, CACHE_VERSION bump, PR body "
        "eindigt met 'Closes #<nr>'). De volledige context (DoR, mocks, feedback van de eigenaar) "
        "staat in het issue en de comments hieronder."
    )
    user = (
        f"Issue #{issue_number}: {title}\n\n--- issue body ---\n{body}\n\n--- comments ---\n{comments_text}\n\n"
        f"Mode: {mode} (auto = als het issue label ready heeft met akkoord-comment: implementeer; "
        "anders: elaboratie + mocks).\n\n"
        "Geef ALLEEN JSON terug met dit schema: "
        '{"pr_title": str, "pr_body": str, "summary": str, "files": [{"path": str, "content": str}]}. '
        "Lege files-lijst mag als er geen bestandwijzigingen nodig zijn."
    )
    raw = await _mistral_chat(
        [{"role": "system", "content": system}, {"role": "user", "content": user}], model
    )
    try:
        data = json.loads(raw)
    except json.JSONDecodeError:
        m = re.search(r"\{.*\}", raw, re.DOTALL)
        data = json.loads(m.group(0)) if m else {}
    files = [
        {"path": str(f["path"]), "content": str(f.get("content", ""))}
        for f in data.get("files") or []
        if f.get("path")
    ]
    return {
        "pr_title": str(data.get("pr_title") or f"Issue #{issue_number}: {title}"),
        "pr_body": str(data.get("pr_body") or ""),
        "summary": str(data.get("summary") or ""),
        "files": files,
    }


@workflows.activity(start_to_close_timeout=timedelta(seconds=60))
async def main_sha(repo: str) -> str:
    ref = await _gh("GET", f"/repos/{repo}/git/ref/heads/main")
    return str((ref.get("object") or {}).get("sha"))


@workflows.activity(start_to_close_timeout=timedelta(seconds=60), retry_policy_max_attempts=1)
async def create_branch(repo: str, branch: str, sha: str) -> None:
    await _gh("POST", f"/repos/{repo}/git/refs", {"ref": f"refs/heads/{branch}", "sha": sha})


@workflows.activity(start_to_close_timeout=timedelta(seconds=60))
async def get_file_sha(repo: str, path: str, ref: str) -> str | None:
    data = await _gh("GET", f"/repos/{repo}/contents/{urllib.parse.quote(path, safe='')}?ref={ref}")
    if not data or isinstance(data, list):
        return None
    return data.get("sha")


@workflows.activity(start_to_close_timeout=timedelta(seconds=120), retry_policy_max_attempts=1)
async def put_file(repo: str, path: str, branch: str, content: str, message: str, sha: str | None) -> None:
    body: dict[str, Any] = {
        "message": message,
        "content": base64.b64encode(content.encode("utf-8")).decode("ascii"),
        "branch": branch,
    }
    if sha:
        body["sha"] = sha
    await _gh("PUT", f"/repos/{repo}/contents/{urllib.parse.quote(path, safe='')}", body)


@workflows.activity(start_to_close_timeout=timedelta(seconds=60), retry_policy_max_attempts=1)
async def open_draft_pr(repo: str, head: str, title: str, body: str) -> int:
    data = await _gh(
        "POST", f"/repos/{repo}/pulls", {"title": title, "head": head, "base": "main", "body": body, "draft": True}
    )
    return int(data.get("number"))


# ---------- workflows ----------


@workflow.define(
    name="issue_agent_run",
    workflow_description="Per-issue agent-run: pakt 1 issue op (label ready/needs-rework), genereert werkproduct via Mistral API, pusht branch + draft PR, zet labels/comments",
)
class IssueAgentRunWorkflow:
    @workflow.entrypoint
    async def run(self, data: AgentRunInput) -> AgentRunOutput:
        fetched = await fetch_issue(data.repo, data.issue_number)
        issue = fetched["issue"]
        title = str(issue.get("title") or "")
        body = str(issue.get("body") or "")
        comments_text = "\n".join(
            f"- {c.get('user', {}).get('login', '?')}: {c.get('body', '')}" for c in fetched["comments"]
        )
        labels = _labels_of(issue)

        if not data.dry_run:
            await set_issue_labels(
                data.repo, data.issue_number, add=["in-progress"], remove=["ready", "needs-rework", "needs-review"]
            )
            await post_issue_comment(
                data.repo,
                data.issue_number,
                f"{RUNNER_MARKER}\nissue-runner: agent-run gestart voor dit issue (mode `{data.mode}`, dry_run={data.dry_run}).",
            )

        product = await generate_work_product(
            data.repo, data.issue_number, title, body, comments_text, data.mode, data.model
        )

        branch: str | None = None
        pr_number: int | None = None
        files_changed: list[str] = []
        if product["files"] and not data.dry_run:
            sha = await main_sha(data.repo)
            branch = f"vibe/issue-{data.issue_number}-{_slug(title)}"
            await create_branch(data.repo, branch, sha)
            for f in product["files"]:
                fsha = await get_file_sha(data.repo, f["path"], branch)
                await put_file(
                    data.repo, f["path"], branch, f["content"], f"issue #{data.issue_number}: {f['path']}", fsha
                )
                files_changed.append(f["path"])
            pr_body = product["pr_body"] + f"\n\nCloses #{data.issue_number}"
            pr_number = await open_draft_pr(data.repo, branch, product["pr_title"], pr_body)

        if not data.dry_run:
            await set_issue_labels(data.repo, data.issue_number, add=["needs-review"], remove=["in-progress"])
            pr_line = f" Draft PR: #{pr_number} ({branch})." if pr_number else ""
            await post_issue_comment(
                data.repo,
                data.issue_number,
                f"{RUNNER_MARKER}\nissue-runner: run afgerond.{pr_line}\n\n{product['summary']}\n\nBestanden: {', '.join(files_changed) or 'geen'}",
            )

        return AgentRunOutput(
            repo=data.repo,
            issue_number=data.issue_number,
            dry_run=data.dry_run,
            branch=branch,
            pr_number=pr_number,
            files_changed=files_changed,
            summary=product["summary"],
        )


@workflow.define(
    name="issue_dispatcher",
    workflow_description="Zoekt open issues met label ready/needs-rework zonder runner-marker en start per issue een child-run van issue_agent_run (max. 3 tegelijk)",
)
class IssueDispatcherWorkflow:
    @workflow.entrypoint
    async def run(self, data: IssueDispatcherInput) -> IssueDispatcherOutput:
        issues = await list_open_issues(data.repo)
        candidates = [
            i for i in issues if RUNNABLE_LABELS.intersection(set(_labels_of(i)))
        ]
        started: list[StartedIssue] = []
        skipped: list[int] = []
        for issue in candidates[: max(0, data.max_concurrent)]:
            number = int(issue["number"])
            if await issue_has_marker(data.repo, number):
                skipped.append(number)
                continue
            await workflow.execute_workflow(
                IssueAgentRunWorkflow,
                params=AgentRunInput(repo=data.repo, issue_number=number, dry_run=data.dry_run),
            )
            if not data.dry_run:
                await post_issue_comment(
                    data.repo, number, f"{RUNNER_MARKER}\nissue-runner: dispatcher heeft een agent-run gestart."
                )
            started.append(
                StartedIssue(issue_number=number, title=str(issue.get("title") or ""), labels=_labels_of(issue))
            )
        return IssueDispatcherOutput(repo=data.repo, dry_run=data.dry_run, started=started, skipped_already_running=skipped)
