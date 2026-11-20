"""
Echo Benchmark Demo Fixtures
Dedicated, versioned fixtures for the We Code Coders Hackathon evaluation rubric.
Isolates benchmark demo data from production/live repository data.
"""

from datetime import datetime, timezone
from database import get_db

DEMO_PROJECT_ID = "proj-demo"
LIVE_PROJECT_ID = "proj-live"

def _seed_decisions_and_landmines(conn, now: str):
    """Seeds baseline architectural decisions and landmines with verified timestamps."""
    decisions = [
        (
            DEMO_PROJECT_ID,
            "MOD-RETRY",
            "Set payment retry limit to 7 attempts with exponential backoff on payment gateway failures.",
            "We chose retry limit of 7 because downstream banking webhooks experienced transient latency spikes during morning settlement runs, avoiding premature drops.",
            "Instant failover without retries, retry limit of 3",
            "approved",
            "Reviewer Lead",
            "2026-11-10T10:00:00Z",
            "2026-11-10T10:00:00Z",
            "Reviewer Lead",
            "fresh",
            None,
            "2026-11-10T10:00:00Z"
        ),
        (
            DEMO_PROJECT_ID,
            "MOD-SYNC",
            "Use Redis cluster for nightly sync state caching instead of in-memory Memcached.",
            "Chosen because memory leaks in Memcached caused OOM crashes during midnight sync runs.",
            "Memcached, local process dictionary",
            "approved",
            "Reviewer Lead",
            "2026-11-12T11:00:00Z",
            "2026-11-12T11:00:00Z",
            "Reviewer Lead",
            "fresh",
            None,
            "2026-11-12T11:00:00Z"
        ),
    ]
    conn.executemany("""
        INSERT OR REPLACE INTO decisions
        (project_id, artifact_id, decision, rationale, rejected_alternatives, review_status, reviewed_by, reviewed_at, last_verified_at, last_verified_by, freshness_status, extracted_from_answer_id, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, decisions)

    landmines = [
        (
            "MINE-SYNC-01",
            DEMO_PROJECT_ID,
            "MOD-SYNC",
            "Nightly sync job fails silently if Redis connection pool is exhausted on weekends",
            "Connection pool leaks during weekend maintenance window causing sync worker to freeze without triggering PagerDuty.",
            "Queue backlog exceeds 10,000 without alerts.",
            "Restart worker pod and run 'scripts/flush_stale_locks.py'.",
            "approved",
            "Reviewer Lead",
            "2026-11-12T12:00:00Z",
            "2026-11-12T12:00:00Z",
            "Reviewer Lead",
            "fresh",
            None,
            "2026-11-12T12:00:00Z"
        )
    ]
    conn.executemany("""
        INSERT OR REPLACE INTO landmines
        (id, project_id, artifact_id, title, description, symptom, how_to_recover, review_status, reviewed_by, reviewed_at, last_verified_at, last_verified_by, freshness_status, extracted_from_answer_id, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, landmines)

def seed_demo_data(reset: bool = False):
    conn = get_db()
    try:
        # Check if demo project already exists
        exists = conn.execute("SELECT id FROM projects WHERE id = ?", (DEMO_PROJECT_ID,)).fetchone()
        if exists and not reset:
            return

        now = datetime.now(timezone.utc).isoformat()

        if reset and exists:
            # Clear project-specific demo state
            with conn:
                conn.execute("DELETE FROM interview_answers WHERE question_id IN (SELECT id FROM interview_questions WHERE project_id = ?)", (DEMO_PROJECT_ID,))
                conn.execute("DELETE FROM decisions WHERE project_id = ?", (DEMO_PROJECT_ID,))
                conn.execute("DELETE FROM landmines WHERE project_id = ?", (DEMO_PROJECT_ID,))
                conn.execute("DELETE FROM knowledge_freshness_alerts WHERE project_id = ?", (DEMO_PROJECT_ID,))
                conn.execute("DELETE FROM chat_messages WHERE project_id = ?", (DEMO_PROJECT_ID,))
                conn.execute("UPDATE handover_packages SET status = 'pending_manager_approval', approved_at = NULL, approved_by = NULL WHERE project_id = ?", (DEMO_PROJECT_ID,))
                conn.execute("UPDATE onboarding_tasks SET is_completed = 0 WHERE package_id = 'pkg-demo'")
                conn.execute("DELETE FROM commits WHERE project_id = ?", (DEMO_PROJECT_ID,))
                conn.executemany("""
                    INSERT OR REPLACE INTO commits (id, project_id, repo_id, author_name, author_email, committed_at, message, files_changed_count)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """, [
                    ("c-demo-01", DEMO_PROJECT_ID, "repo-core", "Aarav", "aarav@example.com", now, "fix(payments): update retry backoff interval to 5s", 3),
                    ("c-demo-02", DEMO_PROJECT_ID, "repo-core", "Meera", "meera@example.com", "2026-11-16T14:30:00Z", "refactor(auth): simplify session token caching", 2),
                    ("c-demo-03", DEMO_PROJECT_ID, "repo-core", "Rohan", "rohan@example.com", "2026-11-15T09:15:00Z", "chore(ci): parallelize integration tests", 1),
                ])
                _seed_decisions_and_landmines(conn, now)

            # Trigger freshness drift check on reset
            try:
                from services.freshness_service import detect_freshness_drift
                detect_freshness_drift(DEMO_PROJECT_ID)
            except Exception:
                pass
            return

        with conn:
            # 1. Projects
            conn.execute("""
                INSERT OR REPLACE INTO projects (id, name, description, mode, is_active, created_at)
                VALUES (?, ?, ?, ?, ?, ?)
            """, (DEMO_PROJECT_ID, "Core Platform — Benchmark Hackathon Demo", "Payment & data sync services for core infrastructure", "demo", 1, now))

            # 2. Repositories
            conn.execute("""
                INSERT OR REPLACE INTO repositories (id, project_id, name, path_or_url, branch, source_type, status, last_synced_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """, ("repo-core", DEMO_PROJECT_ID, "core-platform", "https://github.com/wecode-coders/core-platform", "main", "git", "synced", now))

            # 3. Team Members
            people = [
                ("aarav", DEMO_PROJECT_ID, "Aarav", "aarav@example.com", "Backend Engineer (resigning)", 1, 0, 0),
                ("meera", DEMO_PROJECT_ID, "Meera", "meera@example.com", "Backend Engineer (successor)", 0, 1, 0),
                ("neha", DEMO_PROJECT_ID, "Neha", "neha@example.com", "Engineering Manager", 0, 0, 1),
                ("priya", DEMO_PROJECT_ID, "Priya", "priya@example.com", "Platform Engineer", 0, 0, 0),
                ("rohan", DEMO_PROJECT_ID, "Rohan", "rohan@example.com", "Data Engineer", 0, 0, 0),
            ]
            conn.executemany("""
                INSERT OR REPLACE INTO team_members (id, project_id, name, email, role, is_leaver, is_successor, is_manager)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """, people)

            # 4. Artifacts
            artifacts = [
                ("MOD-SYNC", DEMO_PROJECT_ID, "repo-core", "module", "nightly_sync.py — nightly data sync job", "core-platform/nightly_sync.py", 5, 0.0, 3, "core-platform", 1, now, now),
                ("MOD-RETRY", DEMO_PROJECT_ID, "repo-core", "module", "payments/retry.py — payment retry logic", "core-platform/payments/retry.py", 4, 0.3, 10, "core-platform", 0, now, now),
                ("MOD-BILLING", DEMO_PROJECT_ID, "repo-core", "module", "billing/invoice_gen.py", "core-platform/billing/invoice_gen.py", 3, 0.6, 40, "core-platform", 0, now, now),
                ("MOD-AUTH", DEMO_PROJECT_ID, "repo-core", "module", "auth/session.py", "core-platform/auth/session.py", 4, 0.8, 15, "core-platform", 0, now, now),
                ("PR-214", DEMO_PROJECT_ID, "repo-core", "pull_request", "PR #214 — changed retry limit 3 -> 7 (no explanation)", "core-platform/pulls/214", 4, 0.1, 10, "core-platform", 1, now, now),
                ("PR-198", DEMO_PROJECT_ID, "repo-core", "pull_request", "PR #198 — auth token refresh fix", "core-platform/pulls/198", 3, 0.7, 15, "core-platform", 0, now, now),
                ("TICK-882", DEMO_PROJECT_ID, "repo-core", "ticket", "JIRA-882 — Sync job fails silently on weekends", "jira/browse/882", 4, 0.4, 7, "jira", 1, now, now),
                ("SLACK-VENDOR", DEMO_PROJECT_ID, "repo-core", "chat_thread", "Vendor thread — DataPipe Inc. (Aarav only responder)", "slack/archives/datapipe", 3, 0.0, 2, "slack", 1, now, now),
                ("DOC-RUNBOOK", DEMO_PROJECT_ID, "repo-core", "document", "Runbook — payments service (stale, last updated 8 months ago)", "docs/runbooks/payments.md", 3, 0.2, 240, "docs", 0, now, now),
            ]
            conn.executemany("""
                INSERT OR REPLACE INTO artifacts (id, project_id, repo_id, type, title, path, criticality, doc_coverage, days_since_touch, repo, is_planted_gap, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, artifacts)

            # 5. Contributions
            contributions = [
                ("MOD-SYNC", "aarav", 22), ("MOD-SYNC", "priya", 0), ("MOD-SYNC", "rohan", 0),
                ("MOD-RETRY", "aarav", 14), ("MOD-RETRY", "priya", 2), ("MOD-RETRY", "rohan", 0),
                ("MOD-BILLING", "aarav", 6), ("MOD-BILLING", "priya", 5), ("MOD-BILLING", "rohan", 3),
                ("MOD-AUTH", "aarav", 4), ("MOD-AUTH", "priya", 9), ("MOD-AUTH", "rohan", 6),
                ("PR-214", "aarav", 1), ("PR-214", "priya", 0), ("PR-214", "rohan", 0),
                ("PR-198", "aarav", 1), ("PR-198", "priya", 1), ("PR-198", "rohan", 0),
                ("TICK-882", "aarav", 8), ("TICK-882", "priya", 1), ("TICK-882", "rohan", 0),
                ("SLACK-VENDOR", "aarav", 12), ("SLACK-VENDOR", "priya", 0), ("SLACK-VENDOR", "rohan", 0),
                ("DOC-RUNBOOK", "aarav", 3), ("DOC-RUNBOOK", "priya", 2), ("DOC-RUNBOOK", "rohan", 2),
            ]
            conn.executemany("""
                INSERT OR REPLACE INTO contributions (artifact_id, person_id, count)
                VALUES (?, ?, ?)
            """, contributions)

            # 6. Knowledge Graph Edges
            edges = [
                (DEMO_PROJECT_ID, "aarav", "authored", "MOD-SYNC"),
                (DEMO_PROJECT_ID, "aarav", "authored", "MOD-RETRY"),
                (DEMO_PROJECT_ID, "aarav", "owns", "SLACK-VENDOR"),
                (DEMO_PROJECT_ID, "aarav", "authored", "PR-214"),
                (DEMO_PROJECT_ID, "aarav", "authored", "TICK-882"),
                (DEMO_PROJECT_ID, "meera", "assigned_successor_of", "aarav"),
                (DEMO_PROJECT_ID, "priya", "reviewed", "MOD-AUTH"),
                (DEMO_PROJECT_ID, "rohan", "authored", "MOD-BILLING"),
            ]
            conn.executemany("""
                INSERT INTO graph_edges (project_id, source, relation, target)
                VALUES (?, ?, ?, ?)
            """, edges)

            # 7. Handover Package
            conn.execute("""
                INSERT OR REPLACE INTO handover_packages (id, project_id, leaver_id, successor_id, manager_id, status)
                VALUES (?, ?, ?, ?, ?, ?)
            """, ("pkg-demo", DEMO_PROJECT_ID, "aarav", "meera", "neha", "pending_manager_approval"))

            # 8. Onboarding Tasks
            tasks = [
                ("pkg-demo", 1, "1-2", "Shadow a deploy of the payments service", "Highest-criticality area (MOD-RETRY/MOD-BILLING)", 0, 1),
                ("pkg-demo", 1, "3-4", "Read captured interview answers on nightly sync job", "Single-owner, zero-doc module", 0, 2),
                ("pkg-demo", 1, "5", "Intro call with DataPipe vendor contact", "Solo-owner thread", 0, 3),
                ("pkg-demo", 2, "1-3", "Take first ticket in retry logic", "Active area", 0, 4),
                ("pkg-demo", 2, "4-5", "Own one nightly sync run end-to-end", "Independence check", 0, 5),
            ]
            conn.executemany("""
                INSERT INTO onboarding_tasks (package_id, week, days, task, why, is_completed, order_index)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            """, tasks)

            # 9. Open Loops
            loops = [
                ("OL-1", "pkg-demo", "Review pending on Rohan's invoice refactor PR", "MOD-BILLING", "aarav"),
                ("OL-2", "pkg-demo", "Monthly DataPipe report due next Friday", "SLACK-VENDOR", "aarav"),
            ]
            conn.executemany("""
                INSERT OR REPLACE INTO open_loops (id, package_id, title, artifact_id, owner_id)
                VALUES (?, ?, ?, ?, ?)
            """, loops)

            # 10. Who to Ask Contacts
            contacts = [
                ("pkg-demo", "Sync job / data pipeline", "Aarav (until exit) then Priya", "high"),
                ("pkg-demo", "Vendor relationship (DataPipe)", "Priya", "high"),
                ("pkg-demo", "Auth / sessions", "Priya", "high"),
            ]
            conn.executemany("""
                INSERT INTO who_to_ask (package_id, area, contact, confidence)
                VALUES (?, ?, ?, ?)
            """, contacts)

            # 11. Connectors (Actual Status)
            connectors = [
                ("conn-git", "Local Git Repository Ingestion", "git", "connected", "Analyzing commit history and file touch graph from active repository", now),
                ("conn-github", "GitHub REST API", "github", "not_configured", "GITHUB_TOKEN environment variable not set. Using local Git ingestion.", None),
                ("conn-slack", "Slack Workspace Connector", "slack", "not_configured", "OAuth credentials not configured. Using authorized exported threads.", None),
                ("conn-jira", "Jira Task Ingestion", "jira", "not_configured", "Atlassian API key not configured. Using indexed tickets.", None),
                ("conn-docs", "Engineering Docs & Runbooks", "docs", "connected", "Scanning workspace markdown documents and runbooks", now),
            ]
            conn.executemany("""
                INSERT OR REPLACE INTO connectors (id, name, type, status, details, last_sync_at)
                VALUES (?, ?, ?, ?, ?, ?)
            """, connectors)

            # 12. Recent Commits for Continuous Monitoring
            commits = [
                ("c-demo-01", DEMO_PROJECT_ID, "repo-core", "Aarav", "aarav@example.com", now, "fix(payments): update retry backoff interval to 5s", 3),
                ("c-demo-02", DEMO_PROJECT_ID, "repo-core", "Meera", "meera@example.com", "2026-11-16T14:30:00Z", "refactor(auth): simplify session token caching", 2),
                ("c-demo-03", DEMO_PROJECT_ID, "repo-core", "Rohan", "rohan@example.com", "2026-11-15T09:15:00Z", "chore(ci): parallelize integration tests", 1),
            ]
            conn.executemany("""
                INSERT OR REPLACE INTO commits (id, project_id, repo_id, author_name, author_email, committed_at, message, files_changed_count)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """, commits)

            # 13. Seed Baseline Decisions and Landmines with Verification Timestamps
            _seed_decisions_and_landmines(conn, now)

    finally:
        conn.close()

    # 14. Initial Drift & Freshness Detection Run
    try:
        from services.freshness_service import detect_freshness_drift
        detect_freshness_drift(DEMO_PROJECT_ID)
    except Exception:
        pass
