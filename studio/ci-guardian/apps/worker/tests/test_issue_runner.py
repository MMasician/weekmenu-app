import asyncio
import base64
import re
import urllib.parse
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
    ir.update_issue_body,
    ir.generate_issue_dor,
    ir.generate_work_product,
    ir.main_sha,
    ir.repo_context,
    ir.create_branch,
    ir.get_file_sha,
    ir.get_file_content,
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
        existing_branch: bool = False,
        existing_pr: bool = False,
        file_contents: dict[str, str] | None = None,
        tree: list[dict[str, Any]] | None = None,
    ) -> None:
        self.issues = issues or []
        self.issue = issue or {}
        self.issues_map = issues_map or {}
        self.comments = comments or {}
        self.existing_branch = existing_branch
        self.existing_pr = existing_pr
        self.file_contents = file_contents or {}
        self.tree = tree if tree is not None else [
            {"path": "src/App.jsx", "type": "blob", "size": 220000},
            {"path": "src/app.js", "type": "blob", "size": 260000},
            {"path": "index.html", "type": "blob", "size": 8000},
            {"path": "sw.js", "type": "blob", "size": 4000},
            {"path": "styles.css", "type": "blob", "size": 30000},
            {"path": "docs/ux/test/mock.svg", "type": "blob", "size": 1200},
            {"path": "tools/run-tests.cjs", "type": "blob", "size": 500},
            {"path": "node_modules/x/index.js", "type": "blob", "size": 99},
            {"path": "docs", "type": "tree"},
        ]
        self.calls: list[tuple[str, str, dict[str, Any] | None]] = []
        self.raw_calls: list[tuple[str, str, dict[str, Any] | None]] = []

    async def __call__(self, method: str, path: str, body: dict[str, Any] | None = None) -> Any:
        base = path.split("?")[0]
        self.calls.append((method, base, body))
        self.raw_calls.append((method, path, body))
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
        if method == "PATCH" and re.fullmatch(r"/repos/[^/]+/[^/]+/issues/\d+", base):
            return {"ok": True}  # issue-body bijgewerkt (DoR); "Update an issue" is PATCH, geen PUT
        if method == "GET" and base == f"/repos/{REPO}/git/ref/heads/main":
            return {"object": {"sha": "abc123"}}
        if method == "GET" and re.fullmatch(r"/repos/[^/]+/[^/]+/git/trees/[^/]+", base):
            return {"tree": self.tree, "truncated": False}
        if method == "GET" and base.startswith(f"/repos/{REPO}/git/ref/heads/"):
            return {"object": {"sha": "def456"}} if self.existing_branch else None  # 404 -> branch bestaat niet
        if method == "GET" and base == f"/repos/{REPO}/pulls":
            return [{"number": 555}] if self.existing_pr else []
        if method == "POST" and base == f"/repos/{REPO}/git/refs":
            return {"ok": True}
        if method == "GET" and "/contents/" in base:
            rel = urllib.parse.unquote(base.split("/contents/", 1)[1])
            if rel in self.file_contents:
                return {
                    "sha": "sha-" + rel,
                    "content": base64.b64encode(self.file_contents[rel].encode("utf-8")).decode("ascii"),
                }
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


async def _run_agent(
    temporal_env, monkeypatch, fake: FakeGitHub, dry_run: bool, product_json: str | None = None
) -> dict[str, Any]:
    monkeypatch.setattr(ir, "_gh", fake)
    product_json = product_json or '{"pr_title":"Test PR","pr_body":"body","summary":"samenvatting","files":[{"path":"docs/ux/test/VOORSTEL.md","content":"# test"}]}'
    monkeypatch.setattr(ir, "_mistral_chat", lambda messages, model: asyncio.sleep(0, result=product_json))
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
    # ook mét ingevulde DoR-velden: dry_run mag niets schrijven, ook geen issue-PUT
    result = await _run_agent(
        temporal_env,
        monkeypatch,
        fake,
        dry_run=True,
        product_json='{"acceptatiecriteria":["Given x, When y, Then z"],"summary":"s","files":[]}',
    )
    assert result["dry_run"] is True
    assert result["branch"] is None and result["pr_number"] is None
    assert result["files_changed"] == []
    assert result["summary"] == "s"
    writes = [c for c in fake.calls if c[0] in ("POST", "PUT", "PATCH", "DELETE")]
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
    # alleen een MISLUKT-marker (mislukte run) triggert de retry-cooldown
    issues = [_issue(37, ["ready"])]
    fake = FakeGitHub(issues=issues, comments={37: [{"body": f"{ir.RUNNER_MARKER} MISLUKT bezet"}]})
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
    fake = FakeGitHub(issues=issues, comments={37: [{"body": f"{ir.RUNNER_MARKER} MISLUKT oud", "created_at": old}]})
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


async def test_dispatcher_rework_after_successful_run_not_blocked(temporal_env, monkeypatch) -> None:
    # een geslaagde run ('run afgerond', marker zonder MISLUKT) blokkeert niet: bij needs-rework
    # pakt de volgende tick het issue direct op (rework-lus)
    recent = datetime.now(timezone.utc).isoformat()
    issues = [_issue(37, ["needs-rework"])]
    fake = FakeGitHub(issues=issues, comments={37: [{"body": f"{ir.RUNNER_MARKER} run afgerond", "created_at": recent}]})
    monkeypatch.setattr(ir, "_gh", fake)
    monkeypatch.setattr(ir, "_mistral_chat", lambda messages, model: asyncio.sleep(0, result='{"pr_title":"t","pr_body":"b","summary":"s","files":[]}'))
    async with create_test_worker(
        temporal_env, workflows=[ir.IssueDispatcherWorkflow, ir.IssueAgentRunWorkflow], activities=ACTIVITIES
    ):
        handle = await temporal_env.client.start_workflow(
            "issue_dispatcher",
            {"repo": REPO, "dry_run": True, "max_concurrent": 3, "retry_cooldown_hours": 6},
            id="test-dispatcher-rework",
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


def test_merge_dor_into_body_vervangt_alleen_dor_sectie() -> None:
    template = (
        "# Change\n\n## Seed — door de indiener\n\n### Doel\nIets.\n\n"
        "## Rest van de DoR — aan te vullen door de agent\n\n### Acceptatiecriteria\n- [ ]\n\n"
        "### Afhankelijkheden\n<!-- ... -->\n"
    )
    dor = {
        "acceptatiecriteria": ["Given x, When y, Then z"],
        "scope_getroffen": "Producten-tab",
        "scope_buiten": "prijzen",
        "ux_mocks": "docs/ux/timetags/ met 3 versies per scherm",
        "randgevallen": {"lege_state": "geen tag = null", "foutafhandeling": "validatie", "offline": "lokaal", "per_huishouden": "ADR-009"},
        "open_vragen": "geen open vragen",
        "verificatie": ["npm run verify"],
        "afhankelijkheden": "na #59",
        "summary": "s",
    }
    out = ir._merge_dor_into_body(template, dor)
    assert out.startswith("# Change")
    assert "## Seed — door de indiener" in out  # seed behouden
    assert out.count("## Rest van de DoR") == 1
    assert "- [ ] Given x, When y, Then z" in out
    assert "Getroffen tab(s)/onderdelen: Producten-tab" in out
    assert "Buiten scope: prijzen" in out
    assert "Lege state: geen tag = null" in out
    assert "na #59" in out


async def test_agent_run_updates_issue_body_with_dor(temporal_env, monkeypatch) -> None:
    fake = FakeGitHub(issue=_issue(37, ["needs-rework"]), comments={37: []})
    monkeypatch.setattr(ir, "_gh", fake)
    product = (
        '{"acceptatiecriteria":["Given x, When y, Then z"],"scope_getroffen":"Producten-tab",'
        '"summary":"s","files":[]}'
    )
    monkeypatch.setattr(ir, "_mistral_chat", lambda messages, model: asyncio.sleep(0, result=product))
    async with create_test_worker(temporal_env, workflows=[ir.IssueAgentRunWorkflow], activities=ACTIVITIES):
        handle = await temporal_env.client.start_workflow(
            "issue_agent_run",
            {"repo": REPO, "issue_number": 37, "dry_run": False},
            id="test-agent-run-body",
            task_queue="test-task-queue",
            execution_timeout=timedelta(seconds=20),
        )
        result = await asyncio.wait_for(handle.result(), timeout=25)
    puts = [c for c in fake.calls if c[0] == "PATCH" and re.fullmatch(rf"/repos/{REPO}/issues/\d+", c[1])]
    assert len(puts) == 1
    assert puts[0][1] == f"/repos/{REPO}/issues/37"
    assert "Given x, When y, Then z" in puts[0][2]["body"]
    assert "## Rest van de DoR" in puts[0][2]["body"]
    assert result["files_changed"] == []


async def test_agent_run_rework_reuses_branch_and_pr(temporal_env, monkeypatch) -> None:
    # rework-run op een issue met bestaande branch + draft PR: hergebruik beide, schrijf wel files
    fake = FakeGitHub(issue=_issue(37, ["needs-rework"]), comments={37: []}, existing_branch=True, existing_pr=True)
    monkeypatch.setattr(ir, "_gh", fake)
    product = (
        '{"pr_title":"t","pr_body":"b","summary":"s","issue_body":"",'
        '"files":[{"path":"docs/ux/test/mock.svg","content":"<svg/>"}]}'
    )
    monkeypatch.setattr(ir, "_mistral_chat", lambda messages, model: asyncio.sleep(0, result=product))
    async with create_test_worker(temporal_env, workflows=[ir.IssueAgentRunWorkflow], activities=ACTIVITIES):
        handle = await temporal_env.client.start_workflow(
            "issue_agent_run",
            {"repo": REPO, "issue_number": 37, "dry_run": False},
            id="test-agent-run-rework",
            task_queue="test-task-queue",
            execution_timeout=timedelta(seconds=20),
        )
        result = await asyncio.wait_for(handle.result(), timeout=25)
    assert result["branch"] == "vibe/issue-37-test-issue"
    assert result["pr_number"] == 555
    assert not any(c[0] == "POST" and c[1] == f"/repos/{REPO}/git/refs" for c in fake.calls)  # branch hergebruikt
    assert not any(c[0] == "POST" and c[1] == f"/repos/{REPO}/pulls" for c in fake.calls)  # PR hergebruikt
    assert any(c[0] == "PUT" and "/contents/" in c[1] for c in fake.calls)  # wel files geschreven
    # head-filter moet owner:branch-vorm hebben, anders matcht GitHub niets en pakt hij de eerste open PR
    get_pulls = [c for c in fake.raw_calls if c[0] == "GET" and c[1].startswith(f"/repos/{REPO}/pulls?")]
    assert get_pulls and "head=MMasician:vibe/issue-37-test-issue" in get_pulls[0][1]


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


def test_apply_patch_after_before_replace() -> None:
    out = ir._apply_patch(
        "a\nb\nc\n",
        [
            {"anchor": "a\n", "position": "after", "content": "a2\n"},
            {"anchor": "c\n", "position": "before", "content": "c0\n"},
            {"anchor": "b\n", "position": "replace", "content": "B\n"},
        ],
    )
    assert out == "a\na2\nB\nc0\nc\n"


def test_apply_patch_anchor_moet_uniek_zijn() -> None:
    with pytest.raises(ValueError):
        ir._apply_patch("x\nx\n", [{"anchor": "x\n", "position": "after", "content": "y\n"}])
    with pytest.raises(ValueError):
        ir._apply_patch("a\n", [{"anchor": "zzz\n", "position": "after", "content": "y\n"}])


def _put_contents(fake: FakeGitHub) -> dict[str, str]:
    """path -> gedecodeerde content van alle PUT /contents calls."""
    out: dict[str, str] = {}
    for method, path, body in fake.raw_calls:
        if method == "PUT" and "/contents/" in path:
            rel = urllib.parse.unquote(path.split("/contents/", 1)[1])
            out[rel] = base64.b64decode(body["content"]).decode("utf-8")
    return out


def _comment_bodies(fake: FakeGitHub) -> list[str]:
    return [c[2]["body"] for c in fake.calls if c[0] == "POST" and c[1].endswith("/comments")]


async def test_agent_run_patch_mode_past_edits_toe(temporal_env, monkeypatch) -> None:
    big = "\n".join(f"regel {i}" for i in range(100)) + "\n"
    fake = FakeGitHub(issue=_issue(37, ["ready"]), comments={37: []}, file_contents={"src/App.jsx": big})
    product = (
        '{"pr_title":"t","pr_body":"b","summary":"s","files":['
        '{"path":"src/App.jsx","mode":"patch","edits":[{"anchor":"regel 5\\n","position":"after","content":"regel 5b\\n"}]}]}'
    )
    result = await _run_agent(temporal_env, monkeypatch, fake, dry_run=False, product_json=product)
    puts = _put_contents(fake)
    assert list(puts) == ["src/App.jsx"]
    assert "regel 5\nregel 5b\n" in puts["src/App.jsx"]
    assert ir._line_count(puts["src/App.jsx"]) == 101
    assert result["files_changed"] == ["src/App.jsx"]


async def test_agent_run_blokkeert_gutting_van_bestaand_bestand(temporal_env, monkeypatch) -> None:
    big = "\n".join(f"regel {i}" for i in range(100)) + "\n"
    fake = FakeGitHub(issue=_issue(37, ["ready"]), comments={37: []}, file_contents={"src/App.jsx": big})
    # full-rewrite van bestaand App.jsx naar 2 regels -> moet geblokkeerd worden
    product = '{"pr_title":"t","pr_body":"b","summary":"s","files":[{"path":"src/App.jsx","content":"klein\\n"}]}'
    result = await _run_agent(temporal_env, monkeypatch, fake, dry_run=False, product_json=product)
    assert _put_contents(fake) == {}
    assert result["files_changed"] == []
    assert any("anti-gutting" in b for b in _comment_bodies(fake))


async def test_agent_run_herschrijft_bestaande_mock_nooit(temporal_env, monkeypatch) -> None:
    fake = FakeGitHub(
        issue=_issue(37, ["ready"]),
        comments={37: []},
        file_contents={"docs/ux/test/mock.svg": "<svg/>"},
    )
    product = '{"pr_title":"t","pr_body":"b","summary":"s","files":[{"path":"docs/ux/test/mock.svg","content":"<svg>changed</svg>"}]}'
    result = await _run_agent(temporal_env, monkeypatch, fake, dry_run=False, product_json=product)
    assert _put_contents(fake) == {}
    assert result["files_changed"] == []
    assert any("niet overschreven" in b for b in _comment_bodies(fake))


async def test_agent_run_waarschuwt_bij_code_zonder_cache_bump(temporal_env, monkeypatch) -> None:
    fake = FakeGitHub(issue=_issue(37, ["ready"]), comments={37: []})
    product = '{"pr_title":"t","pr_body":"b","summary":"s","files":[{"path":"src/nieuw.js","content":"x\\n"}]}'
    result = await _run_agent(temporal_env, monkeypatch, fake, dry_run=False, product_json=product)
    assert result["files_changed"] == ["src/nieuw.js"]
    assert any("CACHE_VERSION" in b for b in _comment_bodies(fake))


# ---------- repo-context (HUIDIGE code van main in de prompt) ----------

APPJS_SAMPLE = """// weekmenu-app
"use strict";
function productKey(s) {
  return String(s || "").toLowerCase();
}
function App() {
  const [products, setProducts] = useState([]);
  const renderMenuTab = () => (null);
  return null;
}
"""


def test_app_outline_pakt_signatures_met_regelnummers() -> None:
    out = ir._app_outline(APPJS_SAMPLE)
    assert "3: function productKey" in out
    assert "6: function App" in out
    assert "8: const renderMenuTab" in out
    # const met destructuring (const [x, setX] = ...) wordt niet als const-declaratie gepakt
    assert "useState" not in out
    # leeg bestand -> vallen terug op regelcount
    assert "geen top-level declaraties" in ir._app_outline("// alleen comment\n")
    # cap: max_entries
    big = "\n".join(f"function f{i}() {{}}" for i in range(200))
    out2 = ir._app_outline(big, max_entries=50)
    assert "150 declaraties meer" in out2
    assert out2.count("\n") <= 51


def test_repo_context_text_filtert_tree_en_bevat_outline_en_full_files() -> None:
    tree = [
        {"path": "src/App.jsx", "type": "blob", "size": 220000},
        {"path": "src/app.js", "type": "blob", "size": 260000},  # gegenereerd -> skip
        {"path": "src/timetags.js", "type": "blob", "size": 5000},
        {"path": "index.html", "type": "blob", "size": 8000},
        {"path": "sw.js", "type": "blob", "size": 4000},
        {"path": "docs/ux/x/mock.svg", "type": "blob", "size": 100},  # mocks -> skip
        {"path": "node_modules/y.js", "type": "blob", "size": 100},  # -> skip
        {"path": "docs", "type": "tree"},  # geen blob -> skip
        {"path": "README.md", "type": "blob", "size": 900},
    ]
    text = ir._repo_context_text(
        "abc1234567890",
        tree,
        full_contents={"index.html": "<html>?v=22</html>", "sw.js": 'CACHE_VERSION = "weekmenu-app-v23"'},
        outlines={"src/App.jsx": ir._app_outline(APPJS_SAMPLE)},
    )
    assert "Repo-structuur van main @ abc1234" in text
    assert "- src/App.jsx (220000 bytes)" in text
    assert "3: function productKey" in text  # outline van App.jsx
    assert "- src/timetags.js (5000 bytes)" in text
    assert "- index.html (8000 bytes)" in text
    assert "- README.md (900 bytes)" in text
    assert "- src/app.js" not in text  # gegenereerd artefact niet in de boom (wel in de header-uitleg)
    assert "- docs/ux/" not in text and "- node_modules/" not in text  # mocks/node_modules niet in de boom
    assert "### index.html (volledig" in text and "?v=22" in text
    assert "### sw.js (volledig" in text and "weekmenu-app-v23" in text
    # harde cap
    capped = ir._repo_context_text("abc123", tree, {"index.html": "x" * 100000}, {})
    assert len(capped) <= ir.CONTEXT_MAX_CHARS + 40
    assert "afgekapt" in capped


async def test_agent_run_stuurt_repo_context_naar_model(temporal_env, monkeypatch) -> None:
    # de agent krijgt boom + outline van src/App.jsx + volledige index.html/sw.js in de prompt,
    # en de git-tree wordt opgehaald; patch-anchors moeten daarop gebaseerd zijn
    fake = FakeGitHub(
        issue=_issue(37, ["ready"]),
        comments={37: []},
        file_contents={
            "src/App.jsx": APPJS_SAMPLE,
            "index.html": "<html><script src=\"src/app.js?v=22\"></script></html>",
            "sw.js": 'const CACHE_VERSION = "weekmenu-app-v23";',
        },
    )
    monkeypatch.setattr(ir, "_gh", fake)
    captured: list[list[dict[str, str]]] = []

    async def _capture(messages, model):
        captured.append(messages)
        return '{"pr_title":"t","pr_body":"b","summary":"s","files":[]}'

    monkeypatch.setattr(ir, "_mistral_chat", _capture)
    async with create_test_worker(temporal_env, workflows=[ir.IssueAgentRunWorkflow], activities=ACTIVITIES):
        handle = await temporal_env.client.start_workflow(
            "issue_agent_run",
            {"repo": REPO, "issue_number": 37, "dry_run": True},
            id="test-agent-run-ctx",
            task_queue="test-task-queue",
            execution_timeout=timedelta(seconds=20),
        )
        await asyncio.wait_for(handle.result(), timeout=25)
    # git-tree opgehaald voor de context
    assert any(c[0] == "GET" and "/git/trees/" in c[1] for c in fake.calls)
    assert len(captured) == 2  # DoR-call + work-product-call
    for messages in captured:
        user = messages[-1]["content"]
        assert "HUIDIGE REPO-CONTEXT (main)" in user
        assert "Repo-structuur van main @ abc123" in user
        assert "6: function App" in user  # outline uit HUIDIGE src/App.jsx
        assert "### index.html (volledig" in user and "?v=22" in user
        assert "### sw.js (volledig" in user and "weekmenu-app-v23" in user
        assert "- src/app.js" not in user  # gegenereerd artefact niet in de boom
        assert "- docs/ux/" not in user and "node_modules" not in user  # mocks/node_modules niet in context
    # system-prompt van de work-product-call instrucciones anchors uit de context te kopieren
    work_system = captured[1][0]["content"]
    assert "HUIDIGE REPO-CONTEXT" in work_system
    assert "src/app.js" in work_system and "NOOIT" in work_system  # gegenereerd bestand niet patchen
