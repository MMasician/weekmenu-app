import asyncio
import re
from datetime import datetime, timedelta, timezone
from types import SimpleNamespace
from typing import Any

import pytest

from mistralai.workflows.testing import create_test_worker
from worker.workflows import issue_runner as ir

REPO = "MMasician/weekmenu-app"

ACTIVITIES = [
    ir.list_open_issues,
    ir.fetch_issue,
    ir.latest_runner_marker,
    ir.utc_now,
    ir.set_issue_labels,
    ir.post_issue_comment,
    ir.generate_work_product,
    ir.main_sha,
    ir.create_branch,
    ir.get_file_sha,
    ir.put_file,
    ir.open_draft_pr,
]


class FakeGitHub:
    def __init__(
        self,
        issues: list[dict[str, Any]] | None = None,
        issue: dict[str, Any] | None = None,
        issues_map: dict[int, dict[str, Any]] | None = None,
        comments: dict[int, list[dict[str, Any]]] | None = None,
    ) -> None:
        self.issues = issues or []
        self.issue = issue or {}
        self.issues_map = issues_map or {}
        self.comments = comments or {}
        self.calls: list[tuple[str, str, dict[str, Any] | None]] = []

    async def __call__(self, method: str, path: str, body: dict[str, Any] | None = None) -> Any:
        base = path.split("?")[0]
        self.calls.append((method, base, body))
        if method == "GET" and base == f"/repos/{REPO}/issues":
            return self.issues  # list-call (heeft query ?state=open)
        if method == "GET" and base.endswith("/comments"):
            number = int(base.split("/issues/")[1].split("/")[0])
            return self.comments.get(number, [])
        if method == "GET" and re.fullmatch(r"/repos/[^/]+/[^/]+/issues/\d+", base):
            number = int(base.rsplit("/", 1)[1])
            if number in self.issues_map:
                return self.issues_map[number]
            return self.issue if number == self.issue.get("number") else None
        if method == "POST" and base.endswith("/labels"):
            return {"ok": True}
        if method == "DELETE" and "/labels/" in base:
            return {"ok": True}
        if method == "POST" and base.endswith("/comments"):
            return {"id": 1}
        if method == "GET" and base == f"/repos/{REPO}/git/ref/heads/main":
            return {"object": {"sha": "abc123"}}
        if method == "POST" and base == f"/repos/{REPO}/git/refs":
            return {"ok": True}
        if method == "GET" and "/contents/" in base:
            return None  # 404 -> nieuw bestand
        if method == "PUT" and "/contents/" in base:
            return {"ok": True}
        if method == "POST" and base == f"/repos/{REPO}/pulls":
            return {"number": 555, "html_url": "https://example.invalid/pr/555"}
        raise AssertionError(f"unexpected call {method} {path}")


def _issue(number: int, labels: list[str], title: str = "Test issue") -> dict[str, Any]:
    return {"number": number, "title": title, "body": "body", "labels": [{"name": l} for l in labels]}


FAKE_PRODUCT = {
    "pr_title": "Test PR",
    "pr_body": "body",
    "summary": "samenvatting",
    "files": [{"path": "docs/ux/test/VOORSTEL.md", "content": "# test"}],
}


async def _run_agent(temporal_env, monkeypatch, fake: FakeGitHub, dry_run: bool) -> dict[str, Any]:
    monkeypatch.setattr(ir, "_gh", fake)
    monkeypatch.setattr(ir, "_mistral_chat", lambda messages, model: asyncio.sleep(0, result='{"pr_title":"Test PR","pr_body":"body","summary":"samenvatting","files":[{"path":"docs/ux/test/VOORSTEL.md","content":"# test"}]}'))
    async with create_test_worker(temporal_env, workflows=[ir.IssueAgentRunWorkflow], activities=ACTIVITIES):
        handle = await temporal_env.client.start_workflow(
            "issue_agent_run",
            {"repo": REPO, "issue_number": 37, "dry_run": dry_run},
            id=f"test-agent-run-{dry_run}",
            task_queue="test-task-queue",
            execution_timeout=timedelta(seconds=20),
        )
        return await asyncio.wait_for(handle.result(), timeout=25)


async def test_agent_run_dry_run_writes_nothing(temporal_env, monkeypatch) -> None:
    fake = FakeGitHub(issue=_issue(37, ["ready"]), comments={37: []})
    result = await _run_agent(temporal_env, monkeypatch, fake, dry_run=True)
    assert result["dry_run"] is True
    assert result["branch"] is None and result["pr_number"] is None
    assert result["files_changed"] == []
    assert result["summary"] == "samenvatting"
    writes = [c for c in fake.calls if c[0] in ("POST", "PUT", "DELETE")]
    assert writes == []


async def test_agent_run_full_flow_sets_labels_branch_pr(temporal_env, monkeypatch) -> None:
    fake = FakeGitHub(issue=_issue(37, ["ready"]), comments={37: []})
    result = await _run_agent(temporal_env, monkeypatch, fake, dry_run=False)
    assert result["branch"] == "vibe/issue-37-test-issue"
    assert result["pr_number"] == 555
    assert result["files_changed"] == ["docs/ux/test/VOORSTEL.md"]
    bases = [c[1] for c in fake.calls]
    assert f"/repos/{REPO}/git/refs" in bases  # branch aangemaakt
    assert f"/repos/{REPO}/pulls" in bases  # draft PR geopend
    label_calls = [c for c in fake.calls if c[1].endswith("/labels") and c[0] == "POST"]
    assert any("in-progress" in (c[2] or {}).get("labels", []) for c in label_calls)
    assert any("needs-review" in (c[2] or {}).get("labels", []) for c in label_calls)
    comment_calls = [c for c in fake.calls if c[1].endswith("/comments") and c[0] == "POST"]
    assert any(ir.RUNNER_MARKER in (c[2] or {}).get("body", "") for c in comment_calls)


async def test_dispatcher_starts_child_per_runnable_issue(temporal_env, monkeypatch) -> None:
    issues = [_issue(37, ["ready"]), _issue(38, ["needs-rework"]), _issue(40, ["needs-approval"])]
    fake = FakeGitHub(
        issues=issues,
        issues_map={37: _issue(37, ["ready"]), 38: _issue(38, ["needs-rework"])},
        comments={37: [], 38: []},
    )
    monkeypatch.setattr(ir, "_gh", fake)
    monkeypatch.setattr(ir, "_mistral_chat", lambda messages, model: asyncio.sleep(0, result='{"pr_title":"t","pr_body":"b","summary":"s","files":[]}'))
    async with create_test_worker(
        temporal_env, workflows=[ir.IssueDispatcherWorkflow, ir.IssueAgentRunWorkflow], activities=ACTIVITIES
    ):
        handle = await temporal_env.client.start_workflow(
            "issue_dispatcher",
            {"repo": REPO, "dry_run": True, "max_concurrent": 3},
            id="test-dispatcher",
            task_queue="test-task-queue",
            execution_timeout=timedelta(seconds=30),
        )
        result = await asyncio.wait_for(handle.result(), timeout=35)
    assert [s["issue_number"] for s in result["started"]] == [37, 38]
    assert result["skipped_already_running"] == []


async def test_dispatcher_skips_issues_with_marker(temporal_env, monkeypatch) -> None:
    issues = [_issue(37, ["ready"])]
    fake = FakeGitHub(issues=issues, comments={37: [{"body": f"{ir.RUNNER_MARKER} bezet"}]})
    monkeypatch.setattr(ir, "_gh", fake)
    monkeypatch.setattr(ir, "_mistral_chat", lambda messages, model: asyncio.sleep(0, result='{"pr_title":"t","pr_body":"b","summary":"s","files":[]}'))
    async with create_test_worker(
        temporal_env, workflows=[ir.IssueDispatcherWorkflow, ir.IssueAgentRunWorkflow], activities=ACTIVITIES
    ):
        handle = await temporal_env.client.start_workflow(
            "issue_dispatcher",
            {"repo": REPO, "dry_run": True, "max_concurrent": 3},
            id="test-dispatcher-skip",
            task_queue="test-task-queue",
            execution_timeout=timedelta(seconds=30),
        )
        result = await asyncio.wait_for(handle.result(), timeout=35)
    assert result["started"] == []
    assert result["skipped_already_running"] == [37]


async def test_dispatcher_retries_after_cooldown(temporal_env, monkeypatch) -> None:
    # marker van 24 uur geleden, cooldown 6 uur -> opnieuw oppakken
    old = (datetime.now(timezone.utc) - timedelta(hours=24)).isoformat()
    issues = [_issue(37, ["ready"])]
    fake = FakeGitHub(issues=issues, comments={37: [{"body": f"{ir.RUNNER_MARKER} oud", "created_at": old}]})
    monkeypatch.setattr(ir, "_gh", fake)
    monkeypatch.setattr(ir, "_mistral_chat", lambda messages, model: asyncio.sleep(0, result='{"pr_title":"t","pr_body":"b","summary":"s","files":[]}'))
    async with create_test_worker(
        temporal_env, workflows=[ir.IssueDispatcherWorkflow, ir.IssueAgentRunWorkflow], activities=ACTIVITIES
    ):
        handle = await temporal_env.client.start_workflow(
            "issue_dispatcher",
            {"repo": REPO, "dry_run": True, "max_concurrent": 3, "retry_cooldown_hours": 6},
            id="test-dispatcher-cooldown",
            task_queue="test-task-queue",
            execution_timeout=timedelta(seconds=30),
        )
        result = await asyncio.wait_for(handle.result(), timeout=35)
    assert [s["issue_number"] for s in result["started"]] == [37]
    assert result["skipped_already_running"] == []


async def test_agent_run_failure_restores_labels_and_comments(temporal_env, monkeypatch) -> None:
    fake = FakeGitHub(issue=_issue(37, ["ready"]), comments={37: []})
    monkeypatch.setattr(ir, "_gh", fake)

    async def _boom(messages, model):
        raise RuntimeError("geen Mistral API key")

    monkeypatch.setattr(ir, "_mistral_chat", _boom)
    async with create_test_worker(temporal_env, workflows=[ir.IssueAgentRunWorkflow], activities=ACTIVITIES):
        handle = await temporal_env.client.start_workflow(
            "issue_agent_run",
            {"repo": REPO, "issue_number": 37, "dry_run": False},
            id="test-agent-run-fail",
            task_queue="test-task-queue",
            execution_timeout=timedelta(seconds=20),
        )
        with pytest.raises(Exception):
            await asyncio.wait_for(handle.result(), timeout=25)
    # label in-progress weer weg, ready teruggezet
    label_posts = [c for c in fake.calls if c[0] == "POST" and c[1].endswith("/labels")]
    label_dels = [c for c in fake.calls if c[0] == "DELETE" and "/labels/" in c[1]]
    assert any("ready" in (c[2] or {}).get("labels", []) for c in label_posts)
    assert any("in-progress" in c[1] for c in label_dels)
    # foutcomment met marker geplaatst
    comment_calls = [c for c in fake.calls if c[0] == "POST" and c[1].endswith("/comments")]
    assert any(ir.RUNNER_MARKER in (c[2] or {}).get("body", "") and "MISLUKT" in (c[2] or {}).get("body", "") for c in comment_calls)
    # geen branch/PR aangemaakt
    assert not any(c[1] == f"/repos/{REPO}/git/refs" for c in fake.calls)
    assert not any(c[1] == f"/repos/{REPO}/pulls" for c in fake.calls)


def _client_returning(content: Any) -> Any:
    response = SimpleNamespace(choices=[SimpleNamespace(message=SimpleNamespace(content=content))])

    class _Chat:
        async def complete_async(self, **kwargs: Any) -> Any:
            return response

    return SimpleNamespace(chat=_Chat())


async def test_mistral_chat_str_content_passthrough(monkeypatch) -> None:
    import utils.mistral as um

    monkeypatch.setattr(um, "mistral_client", lambda **kwargs: _client_returning('{"a": 1}'))
    assert await ir._mistral_chat([{"role": "user", "content": "x"}], "m") == '{"a": 1}'


async def test_mistral_chat_chunk_lijst_reduceert_tot_tekst(monkeypatch) -> None:
    # mistral-large-latest kan content als chunk-lijst teruggeven (ThinkChunk + TextChunk);
    # ThinkChunk heeft geen .text en mag niet via json.dumps (crasht: niet serialiseerbaar)
    from mistralai.client.models import TextChunk, ThinkChunk

    import utils.mistral as um

    content = [ThinkChunk(thinking=[]), TextChunk(text='{"b":'), TextChunk(text="2}")]
    monkeypatch.setattr(um, "mistral_client", lambda **kwargs: _client_returning(content))
    assert await ir._mistral_chat([{"role": "user", "content": "x"}], "m") == '{"b":2}'
