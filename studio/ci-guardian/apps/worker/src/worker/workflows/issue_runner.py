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
import urllib.request
import base64
from datetime import datetime, timedelta, timezone
from typing import Any

import mistralai.workflows as workflows
from mistralai.workflows import workflow
from pydantic import BaseModel, Field

with workflow.unsafe.imports_passed_through():
    import httpx

GITHUB_API = "https://api.github.com"
TOKEN_ENV_VAR = "WEEKMENU_GITHUB_TOKEN"
RUNNER_MARKER = "<!-- issue-runner -->"
RUNNABLE_LABELS = {"ready", "needs-rework"}
MAX_CONCURRENT_DEFAULT = 3


class IssueDispatcherInput(BaseModel):
    repo: str = Field(default="MMasician/weekmenu-app")
    dry_run: bool = Field(default=False)
    max_concurrent: int = Field(default=MAX_CONCURRENT_DEFAULT)
    # na een mislukte run wacht de dispatcher deze tijd voor een nieuwe poging op hetzelfde issue
    retry_cooldown_hours: float = Field(default=6.0)


class StartedIssue(BaseModel):
    issue_number: int
    title: str
    labels: list[str]


class IssueDispatcherOutput(BaseModel):
    repo: str
    dry_run: bool
    started: list[StartedIssue]
    skipped_already_running: list[int]
    errors: list[str] = Field(default_factory=list)


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
    """Chat-call via de SDK-client van de app (utils.mistral): op een gedeployde worker leest die
    het service-account token uit MISTRAL_SA_TOKEN_PATH (per call, rotatie-veilig) en anders
    MISTRAL_API_KEY; het base-url komt uit MISTRAL_BASE_URL / de env-package."""
    from utils.mistral import mistral_client

    client = mistral_client()
    response = await client.chat.complete_async(
        model=model,
        messages=messages,
        response_format={"type": "json_object"},
    )
    content = response.choices[0].message.content
    return content if isinstance(content, str) else json.dumps(content)


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


@workflows.activity(start_to_close_timeout=timedelta(seconds=30))
async def utc_now() -> str:
    """Huidige UTC-tijd als ISO-string (workflow-code mag zelf geen datetime.now() gebruiken)."""
    return datetime.now(timezone.utc).isoformat()


@workflows.activity(start_to_close_timeout=timedelta(seconds=60))
async def latest_runner_marker(repo: str, number: int) -> str | None:
    """created_at (ISO) van de nieuwste runner-marker-comment, of None als er geen is."""
    comments = await _gh("GET", f"/repos/{repo}/issues/{number}/comments?per_page=100")
    stamps = [
        str(c.get("created_at"))
        for c in (comments or [])
        if RUNNER_MARKER in (c.get("body") or "")
    ]
    return max(stamps) if stamps else None


@workflows.activity(start_to_close_timeout=timedelta(seconds=60), retry_policy_max_attempts=1)
async def set_issue_labels(repo: str, number: int, add: list[str], remove: list[str]) -> None:
    if add:
        await _gh("POST", f"/repos/{repo}/issues/{number}/labels", {"labels": add})
    for name in remove:
        await _gh("DELETE", f"/repos/{repo}/issues/{number}/labels/{urllib.parse.quote(name)}")


@workflows.activity(start_to_close_timeout=timedelta(seconds=60), retry_policy_max_attempts=1)
async def post_issue_comment(repo: str, number: int, body: str) -> int:
    data = await _gh("POST", f"/repos/{repo}/issues/{number}/comments", {"body": body})
    return int((data or {}).get("id") or 0)


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
    if not ref:
        raise RuntimeError(f"geen ref heads/main gevonden in {repo}")
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
    if not data:
        raise RuntimeError(f"PR aanmaken mislukt voor head {head}")
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
        # bij een mislukte run worden deze labels teruggezet zodat de dispatcher het issue opnieuw kan oppakken
        restore_labels = [l for l in labels if l in RUNNABLE_LABELS] or ["ready"]

        try:
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
        except Exception as exc:
            # mislukte run: label(s) terugzetten + fout melden in het issue; de marker-comment blijft
            # staan zodat de dispatcher de retry-cooldown hanteert (zie issue_dispatcher)
            if not data.dry_run:
                try:
                    await set_issue_labels(data.repo, data.issue_number, add=restore_labels, remove=["in-progress"])
                    await post_issue_comment(
                        data.repo,
                        data.issue_number,
                        f"{RUNNER_MARKER}\nissue-runner: run MISLUKT voor issue #{data.issue_number}: "
                        f"`{type(exc).__name__}: {exc}`\nLabels teruggezet naar {', '.join(restore_labels)}; "
                        "wordt na de retry-cooldown automatisch opnieuw opgepakt.",
                    )
                except Exception:
                    pass
            raise


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
        cooldown = timedelta(hours=max(0.0, data.retry_cooldown_hours))
        now = datetime.fromisoformat(await utc_now())

        def _marker_age(stamp: str | None) -> timedelta:
            if not stamp:
                return timedelta(0)  # geen timestamp -> als vers beschouwen (nooit dubbel oppakken)
            try:
                ts = datetime.fromisoformat(stamp.replace("Z", "+00:00"))
                if ts.tzinfo is None:
                    ts = ts.replace(tzinfo=timezone.utc)
                return now - ts
            except ValueError:
                return timedelta(0)

        started: list[StartedIssue] = []
        skipped: list[int] = []
        errors: list[str] = []
        for issue in candidates[: max(0, data.max_concurrent)]:
            number = int(issue["number"])
            try:
                marker = await latest_runner_marker(data.repo, number)
                if marker is not None and _marker_age(marker) < cooldown:
                    skipped.append(number)  # recente run (geslaagd of mislukt) -> cooldown
                    continue
                # wait=False: een falende child-run mag de dispatcher (en daarmee de schedule) niet stoppen
                await workflow.execute_workflow(
                    IssueAgentRunWorkflow,
                    params=AgentRunInput(repo=data.repo, issue_number=number, dry_run=data.dry_run),
                    execution_id=f"issue-agent-run-{data.repo}-{number}",
                    wait=False,
                )
                if not data.dry_run:
                    await post_issue_comment(
                        data.repo, number, f"{RUNNER_MARKER}\nissue-runner: dispatcher heeft een agent-run gestart."
                    )
                started.append(
                    StartedIssue(issue_number=number, title=str(issue.get("title") or ""), labels=_labels_of(issue))
                )
            except Exception as exc:
                if "AlreadyStarted" in type(exc).__name__:
                    skipped.append(number)  # child-run voor dit issue draait al
                else:
                    errors.append(f"#{number}: {type(exc).__name__}: {exc}")
        return IssueDispatcherOutput(
            repo=data.repo, dry_run=data.dry_run, started=started, skipped_already_running=skipped, errors=errors
        )
