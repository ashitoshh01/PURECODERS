"""
Echo Test Suite: Knowledge Freshness Monitor
Validates tracking of last-verified timestamps on knowledge records,
automated detection of conflicts between documentation and git commits/PRs,
alert generation with evidence, and the reviewer re-verification workflow.
"""

import unittest
import os
import sys

# Ensure backend directory is in path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from database import init_db, get_db, reset_database
from fixtures.demo_seed import seed_demo_data, DEMO_PROJECT_ID
from services import freshness_service

class TestKnowledgeFreshnessMonitor(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        init_db()
        seed_demo_data(reset=True)

    def test_01_database_schema_and_freshness_columns(self):
        """Verify database schema has knowledge_freshness_alerts table and freshness columns on decisions/landmines."""
        conn = get_db()
        tables = [t[0] for t in conn.execute("SELECT name FROM sqlite_master WHERE type='table'").fetchall()]
        self.assertIn("knowledge_freshness_alerts", tables)

        decision_cols = [r["name"] for r in conn.execute("PRAGMA table_info(decisions)").fetchall()]
        self.assertIn("last_verified_at", decision_cols)
        self.assertIn("last_verified_by", decision_cols)
        self.assertIn("freshness_status", decision_cols)
        self.assertIn("mismatch_reason", decision_cols)
        self.assertIn("contradicting_commit_id", decision_cols)

        landmine_cols = [r["name"] for r in conn.execute("PRAGMA table_info(landmines)").fetchall()]
        self.assertIn("last_verified_at", landmine_cols)
        self.assertIn("freshness_status", landmine_cols)
        conn.close()

    def test_02_detect_contradiction_between_documentation_and_commits(self):
        """
        Verify that a documented decision specifying retry limit 7 is flagged
        when a recent commit changes it to 5s / 5.
        """
        alerts = freshness_service.detect_freshness_drift(DEMO_PROJECT_ID)

        conn = get_db()
        flagged_dec = conn.execute("""
            SELECT * FROM decisions
            WHERE project_id = ? AND artifact_id = 'MOD-RETRY'
        """, (DEMO_PROJECT_ID,)).fetchone()
        conn.close()

        self.assertIsNotNone(flagged_dec, "Expected MOD-RETRY decision to exist")
        self.assertEqual(flagged_dec["freshness_status"], "needs_reverification")
        self.assertIsNotNone(flagged_dec["mismatch_reason"])
        self.assertIn("c-demo-01", str(flagged_dec["contradicting_commit_id"]))

        # Verify alert record in database
        alerts_in_db = freshness_service.get_freshness_alerts(DEMO_PROJECT_ID, include_resolved=False)
        self.assertGreaterEqual(len(alerts_in_db), 1)

        retry_alert = next((a for a in alerts_in_db if a.get("artifact_id") == "MOD-RETRY"), None)
        self.assertIsNotNone(retry_alert, "Expected freshness alert for MOD-RETRY")
        self.assertEqual(retry_alert["contradicting_commit_id"], "c-demo-01")
        self.assertIn("5", retry_alert["contradicting_message"])

    def test_03_reverification_workflow(self):
        """Verify re-verification resets status to 'fresh', updates timestamp, and resolves alerts."""
        conn = get_db()
        flagged = conn.execute("""
            SELECT id FROM decisions WHERE project_id = ? AND artifact_id = 'MOD-RETRY'
        """, (DEMO_PROJECT_ID,)).fetchone()
        conn.close()
        self.assertIsNotNone(flagged)
        dec_id = flagged["id"]

        # Perform re-verification
        res = freshness_service.track_verification(
            record_type="decision",
            record_id=str(dec_id),
            verifier_name="Lead Reviewer"
        )
        self.assertEqual(res["status"], "verified")
        self.assertEqual(res["freshness_status"], "fresh")
        self.assertIsNotNone(res["last_verified_at"])

        # Check DB state
        conn = get_db()
        updated_dec = conn.execute("SELECT * FROM decisions WHERE id = ?", (dec_id,)).fetchone()
        self.assertEqual(updated_dec["freshness_status"], "fresh")
        self.assertIsNone(updated_dec["mismatch_reason"])
        self.assertEqual(updated_dec["last_verified_by"], "Lead Reviewer")

        # Verify alert was marked as resolved
        resolved_alert = conn.execute("""
            SELECT * FROM knowledge_freshness_alerts
            WHERE record_type = 'decision' AND record_id = ? AND is_resolved = 1
        """, (str(dec_id),)).fetchone()
        self.assertIsNotNone(resolved_alert, "Expected freshness alert to be resolved")
        conn.close()

    def test_04_freshness_overview_metrics(self):
        """Verify the overview endpoint returns correct freshness score and counts."""
        overview = freshness_service.get_freshness_overview(DEMO_PROJECT_ID)
        self.assertEqual(overview["project_id"], DEMO_PROJECT_ID)
        self.assertGreaterEqual(overview["total_monitored_records"], 2)
        self.assertIn("freshness_health_score", overview)
        self.assertIn("fresh_records_count", overview)

    def test_05_dismiss_alert_action(self):
        """Verify dismissing an alert."""
        conn = get_db()
        # Insert a dummy open alert
        alert_id = "FRESH-TEST-DISMISS"
        conn.execute("""
            INSERT OR REPLACE INTO knowledge_freshness_alerts
            (id, project_id, record_type, record_id, artifact_id, title, documented_statement,
             contradicting_commit_id, contradicting_message, contradicting_author,
             mismatch_details, severity, is_resolved, created_at)
            VALUES (?, ?, 'decision', '999', 'MOD-SYNC', 'Sync Decision', 'Use Redis',
                    'c-dummy', 'test commit', 'Tester', 'test diff', 'warning', 0, datetime('now'))
        """, (alert_id, DEMO_PROJECT_ID))
        conn.commit()
        conn.close()

        res = freshness_service.dismiss_freshness_alert(alert_id, dismissed_by="Lead Reviewer")
        self.assertTrue(res)

        conn = get_db()
        row = conn.execute("SELECT is_resolved, resolved_by FROM knowledge_freshness_alerts WHERE id = ?", (alert_id,)).fetchone()
        conn.close()
        self.assertEqual(row["is_resolved"], 1)
        self.assertEqual(row["resolved_by"], "Lead Reviewer")

if __name__ == "__main__":
    unittest.main()

