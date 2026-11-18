import asyncio
from datetime import timedelta
from typing import Any

from mistralai.workflows.testing import create_test_worker
from worker.workflows import ci_guardian as cg

REPO = "MMasician/weekmenu-app"

ACTIVITIES = [
    cg.list_open_dependabot_prs,
    cg.failed_checks_for_sha,
    cg.pr_has_guardian_comment,
    cg.post_pr_comment,
    cg.latest_main_run,
    cg.find_open_guardian_issue,
    cg.create_guardian_issue,
]


class FakeGitHub:
    def __init__(
        self,
        pulls: list[dict[str, Any]] | None = None,
        check_runs: dict[str, list[dict[str, Any]]] | None = None,
        comments: dict[int, list[dict[str, Any]]] | None = None,
        runs: list[dict[str, Any]] | None = None,
        issues: list[dict[str, Any]] | None = None,
    ) -> None:
        self.pulls = pulls or []
        self.check_runs = check_runs or {}
        self.comments = comments or {}
        self.runs = runs or []
        self.issues = issues or []
        self.posts: list[tuple[str, dict[str, Any]]] = []

    async def __call__(
        self, method: str, path: str, body: dict[str, Any] | None = None
    ) -> Any:
        base = path.split("?")[0]
        if method == "GET" and base == f"/repos/{REPO}/pulls":
            return self.pulls
        if method == "GET" and "/commits/" in base and base.endswith("/check-runs"):
            sha = base.split("/commits/")[1].split("/")[0]
            return {"check_runs": self.check_runs.get(sha, [])}
        if method == "GET" and "/issues/" in base and base.endswith("/comments"):
            number = int(base.split("/issues/")[1].split("/")[0])
            return self.comments.get(number, [])
        if method == "POST" and "/issues/" in base and base.endswith("/comments"):
            number = int(base.split("/issues/")[1].split("/")[0])
            self.posts.append(("comment", {"number": number, "body": body}))
            return {"id": 1}
        if method == "GET" and base == f"/repos/{REPO}/actions/runs":
            return {"workflow_runs": self.runs}
        if method == "GET" and base == f"/repos/{REPO}/issues":
            return self.issues
        if method == "POST" and base == f"/repos/{REPO}/issues":
            self.posts.append(("issue", body or {}))
            return {"number": 999}
        raise AssertionError(f"unexpected call {method} {path}")


def _pr(number: int, sha: str, login: str = "dependabot[bot]") -> dict[str, Any]:
    return {
        "number": number,
        "title": f"Bump dep {number}",
        "user": {"login": login},
        "head": {"sha": sha},
    }


def _failing_run(run_id: int = 1) -> dict[str, Any]:
    return {
        "id": run_id,
        "name": "build-and-test",
        "conclusion": "failure",
        "html_url": "https://example.invalid/run/1",
        "created_at": "2026-11-18T20:00:00Z",
        "head_sha": "deadbeef",
    }


async def _run(
    temporal_env, monkeypatch, fake: FakeGitHub, dry_run: bool
) -> dict[str, Any]:
    monkeypatch.setattr(cg, "_gh", fake)
    async with create_test_worker(
        temporal_env, workflows=[cg.CiGuardianWorkflow], activities=ACTIVITIES
    ):
        handle = await temporal_env.client.start_workflow(
            "ci_guardian",
            {"repo": REPO, "dry_run": dry_run},
            id=f"test-ci-guardian-{dry_run}",
            task_queue="test-task-queue",
            execution_timeout=timedelta(seconds=10),
        )
        return await asyncio.wait_for(handle.result(), timeout=15)


async def test_dry_run_reports_failures_without_writes(
    temporal_env, monkeypatch
) -> None:
    fake = FakeGitHub(
        pulls=[_pr(21, "abc123")],
        check_runs={
            "abc123": [
                {
                    "name": "lint",
                    "conclusion": "failure",
                    "html_url": "https://example.invalid/job/1",
                }
            ]
        },
        runs=[_failing_run()],
    )
    result = await _run(temporal_env, monkeypatch, fake, dry_run=True)
    assert result["dry_run"] is True
    assert len(result["dependabot_prs"]) == 1
    pr = result["dependabot_prs"][0]
    assert pr["number"] == 21
    assert [c["name"] for c in pr["failed_checks"]] == ["lint"]
    assert pr["comment_posted"] is False
    assert result["main"]["conclusion"] == "failure"
    assert result["main"]["issue_created"] is False
    assert fake.posts == []


async def test_posts_comment_and_issue_when_not_dry_run(
    temporal_env, monkeypatch
) -> None:
    fake = FakeGitHub(
        pulls=[_pr(21, "abc123")],
        check_runs={
            "abc123": [
                {
                    "name": "lint",
                    "conclusion": "failure",
                    "html_url": "https://example.invalid/job/1",
                }
            ]
        },
        runs=[_failing_run()],
    )
    result = await _run(temporal_env, monkeypatch, fake, dry_run=False)
    assert result["dependabot_prs"][0]["comment_posted"] is True
    assert result["main"]["issue_created"] is True
    assert result["main"]["issue_number"] == 999
    kinds = [kind for kind, _ in fake.posts]
    assert kinds == ["comment", "issue"]
    comment_body = fake.posts[0][1]["body"]["body"]
    assert cg.COMMENT_MARKER in comment_body
    assert "**lint**" in comment_body


async def test_dedupes_existing_comment_and_issue(temporal_env, monkeypatch) -> None:
    fake = FakeGitHub(
        pulls=[_pr(21, "abc123")],
        check_runs={
            "abc123": [{"name": "lint", "conclusion": "failure", "html_url": None}]
        },
        comments={21: [{"body": f"{cg.COMMENT_MARKER} al gemeld"}]},
        runs=[_failing_run()],
        issues=[{"title": f"{cg.ISSUE_TITLE_PREFIX} — run 1"}],
    )
    result = await _run(temporal_env, monkeypatch, fake, dry_run=False)
    assert result["dependabot_prs"][0]["comment_posted"] is False
    assert result["main"]["issue_created"] is False
    assert fake.posts == []


async def test_ignores_non_dependabot_prs(temporal_env, monkeypatch) -> None:
    fake = FakeGitHub(
        pulls=[_pr(22, "def456", login="some-human")],
        check_runs={
            "def456": [{"name": "lint", "conclusion": "failure", "html_url": None}]
        },
        runs=[
            {
                "id": 2,
                "name": "build-and-test",
                "conclusion": "success",
                "html_url": None,
                "created_at": "2026-11-18T21:00:00Z",
                "head_sha": "cafe",
            }
        ],
    )
    result = await _run(temporal_env, monkeypatch, fake, dry_run=False)
    assert result["dependabot_prs"] == []
    assert result["main"]["conclusion"] == "success"
    assert result["main"]["issue_created"] is False
    assert fake.posts == []
