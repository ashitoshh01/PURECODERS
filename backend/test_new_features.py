"""
Echo Test Suite: Live Connectors, Voice Interviews, Continuous Monitoring & Multi-Repo Workspaces
"""

import unittest
import os
import sys

# Ensure backend directory is in path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from database import init_db, get_db, reset_database
from fixtures.demo_seed import seed_demo_data, DEMO_PROJECT_ID
from services import slack_service, jira_service, voice_service, monitor_service, git_scanner
from services.risk_engine import calculate_project_risk

class TestEchoNewFeatures(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        init_db()
        seed_demo_data(reset=True)

    def test_01_slack_connector_live_sync_and_scoring(self):
        """Test Slack token connection, thread ingestion, and deterministic risk scoring."""
        # 1. Connect Slack token
        res_conn = slack_service.save_slack_credentials(
            project_id=DEMO_PROJECT_ID,
            access_token="xoxb-mock-slack-test-token-12345",
            auth_type="token",
            workspace_name="Engineering Core Workspace"
        )
        self.assertEqual(res_conn["status"], "connected")

        # 2. Sync discussion threads
        sync_res = slack_service.sync_slack_workspace(
            project_id=DEMO_PROJECT_ID,
            mock_fallback=True
        )
        self.assertEqual(sync_res["status"], "success")
        self.assertGreater(sync_res["ingested_count"], 0)

        # 3. Verify chat_thread artifacts are created in DB
        conn = get_db()
        slack_arts = conn.execute("SELECT * FROM artifacts WHERE project_id = ? AND type = 'chat_thread'", (DEMO_PROJECT_ID,)).fetchall()
        conn.close()
        self.assertGreater(len(slack_arts), 0)

        # 4. Verify risk engine incorporates Slack threads
        risk_data = calculate_project_risk(DEMO_PROJECT_ID)
        chat_artifacts = [a for a in risk_data["artifacts"] if a["type"] == "chat_thread"]
        self.assertGreater(len(chat_artifacts), 0)
        for ca in chat_artifacts:
            self.assertIn("risk_score", ca)
            self.assertIn("ownership_concentration", ca["components"])

    def test_02_jira_connector_live_sync_and_scoring(self):
        """Test Jira token connection, ticket ingestion, and deterministic risk scoring."""
        # 1. Connect Jira API token
        res_conn = jira_service.connect_jira_api_token(
            domain="company-test.atlassian.net",
            email="lead@company.internal",
            api_token="jira-token-secret-xyz",
            project_id=DEMO_PROJECT_ID
        )
        self.assertEqual(res_conn["status"], "connected")

        # 2. Sync Jira tickets
        sync_res = jira_service.sync_jira_workspace(
            project_id=DEMO_PROJECT_ID,
            mock_fallback=True
        )
        self.assertEqual(sync_res["status"], "success")
        self.assertGreater(sync_res["ingested_count"], 0)

        # 3. Verify ticket artifacts exist in DB
        conn = get_db()
        jira_arts = conn.execute("SELECT * FROM artifacts WHERE project_id = ? AND type = 'ticket'", (DEMO_PROJECT_ID,)).fetchall()
        conn.close()
        self.assertGreater(len(jira_arts), 0)

        # 4. Verify risk engine ranks Jira tickets
        risk_data = calculate_project_risk(DEMO_PROJECT_ID)
        ticket_artifacts = [a for a in risk_data["artifacts"] if a["type"] == "ticket"]
        self.assertGreater(len(ticket_artifacts), 0)

    def test_03_voice_interview_extraction_and_reviewer_flow(self):
        """Test voice transcript parsing, structured extraction (Decisions, Landmines, Open Loops) and Reviewer sign-off."""
        transcript = (
            "We chose Redis cluster because the memory leak in the older in-memory cache was causing "
            "frequent OOM crashes during midnight billing runs, instead of Memcached. "
            "Be careful because the sync job fails silently on weekends if the connection pool is exhausted. "
            "There is an unfinished refactor on the payment retry loop that is still pending migration."
        )

        # 1. Extract structured knowledge from spoken transcript
        extracted = voice_service.extract_structured_knowledge(
            transcript=transcript,
            question_text="Why was the retry limit updated and what happens during failures?",
            artifact_id="MOD-SYNC",
            project_id=DEMO_PROJECT_ID,
            submitted_by="Aarav"
        )

        self.assertGreater(len(extracted["decisions"]), 0, "Expected at least one architectural decision extracted")
        self.assertGreater(len(extracted["landmines"]), 0, "Expected at least one landmine / gotcha extracted")
        self.assertGreater(len(extracted["open_loops"]), 0, "Expected at least one open loop extracted")

        dec = extracted["decisions"][0]
        self.assertEqual(dec["review_status"], "pending_review")

        landmine = extracted["landmines"][0]
        self.assertEqual(landmine["review_status"], "pending_review")

        # 2. Test Reviewer approval workflow
        items = voice_service.get_review_items(DEMO_PROJECT_ID)
        self.assertGreaterEqual(items["pending_count"], 3)

        # Approve decision
        app_dec = voice_service.update_review_status(
            item_type="decision",
            item_id=str(dec["id"]),
            new_status="approved",
            reviewer_name="Reviewer Lead"
        )
        self.assertEqual(app_dec["review_status"], "approved")

        # Approve landmine
        app_mine = voice_service.update_review_status(
            item_type="landmine",
            item_id=str(landmine["id"]),
            new_status="approved",
            reviewer_name="Reviewer Lead"
        )
        self.assertEqual(app_mine["review_status"], "approved")

    def test_04_continuous_monitoring_and_drift_detection(self):
        """Test knowledge drift detection: stale knowledge aging and newly concentrated ownership."""
        # 1. Insert a stale un-documented module to test drift detection
        conn = get_db()
        with conn:
            conn.execute("""
                INSERT OR REPLACE INTO artifacts
                (id, project_id, repo_id, type, title, path, criticality, doc_coverage, days_since_touch, repo, is_planted_gap, created_at)
                VALUES ('MOD-DRIFT-TEST', ?, 'repo-core', 'module', 'legacy_vault.py', 'core/legacy_vault.py', 5, 0.1, 120, 'core-platform', 0, datetime('now'))
            """, (DEMO_PROJECT_ID,))
            conn.execute("""
                INSERT OR REPLACE INTO contributions (artifact_id, person_id, count)
                VALUES ('MOD-DRIFT-TEST', 'aarav', 25)
            """)
        conn.close()

        # 2. Run drift detection
        alerts = monitor_service.detect_knowledge_drift(DEMO_PROJECT_ID)
        self.assertGreater(len(alerts), 0, "Expected at least one knowledge drift alert")

        # Verify drift alerts query
        retrieved_alerts = monitor_service.get_drift_alerts(DEMO_PROJECT_ID)
        self.assertGreater(len(retrieved_alerts), 0)

        # 3. Resolve an alert
        first_alert = retrieved_alerts[0]
        resolved = monitor_service.resolve_drift_alert(first_alert["id"])
        self.assertTrue(resolved)

    def test_05_multi_repository_scoping(self):
        """Test multi-repository workspace isolation so scanning repo B does not wipe repo A."""
        conn = get_db()
        with conn:
            # Seed repo 1
            conn.execute("""
                INSERT OR REPLACE INTO repositories (id, project_id, name, path_or_url, branch, status)
                VALUES ('repo-service-a', ?, 'service-a', 'https://github.com/org/service-a', 'main', 'synced')
            """, (DEMO_PROJECT_ID,))
            conn.execute("""
                INSERT OR REPLACE INTO artifacts (id, project_id, repo_id, type, title, path, criticality, doc_coverage, days_since_touch, repo, created_at)
                VALUES ('SRV-A-01', ?, 'repo-service-a', 'module', 'service_a.py', 'service_a.py', 4, 0.5, 5, 'service-a', datetime('now'))
            """, (DEMO_PROJECT_ID,))

            # Seed repo 2
            conn.execute("""
                INSERT OR REPLACE INTO repositories (id, project_id, name, path_or_url, branch, status)
                VALUES ('repo-service-b', ?, 'service-b', 'https://github.com/org/service-b', 'main', 'synced')
            """, (DEMO_PROJECT_ID,))
            conn.execute("""
                INSERT OR REPLACE INTO artifacts (id, project_id, repo_id, type, title, path, criticality, doc_coverage, days_since_touch, repo, created_at)
                VALUES ('SRV-B-01', ?, 'repo-service-b', 'module', 'service_b.py', 'service_b.py', 4, 0.5, 5, 'service-b', datetime('now'))
            """, (DEMO_PROJECT_ID,))

        # Verify both repositories exist in risk calculation
        risk_data = calculate_project_risk(DEMO_PROJECT_ID)
        repos_in_project = [r["id"] for r in risk_data.get("repositories", [])]
        self.assertIn("repo-service-a", repos_in_project)
        self.assertIn("repo-service-b", repos_in_project)

        # Scoped risk query for service-a only
        service_a_risk = calculate_project_risk(DEMO_PROJECT_ID, repo_id="repo-service-a")
        art_ids = [a["artifact_id"] for a in service_a_risk["artifacts"]]
        self.assertIn("SRV-A-01", art_ids)
        self.assertNotIn("SRV-B-01", art_ids)

if __name__ == "__main__":
    unittest.main()
