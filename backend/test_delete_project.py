import unittest
import sqlite3
import os
import sys

# Ensure backend root is on sys.path
sys.path.insert(0, os.path.dirname(__file__))

from fastapi.testclient import TestClient
from main import app
from database import get_db, init_db, reset_database, get_active_project
from fixtures.demo_seed import seed_demo_data

class TestDeleteProject(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)

    def setUp(self):
        reset_database(clear_credentials=False, clear_users=False)
        seed_demo_data()

    def test_delete_nonexistent_project_returns_404(self):
        res = self.client.delete("/api/projects/proj-does-not-exist")
        self.assertEqual(res.status_code, 404)
        self.assertIn("not found", res.json()["detail"].lower())

    def test_delete_project_cascades_and_cleans_records(self):
        # Verify demo project exists with child records
        conn = get_db()
        demo_proj = conn.execute("SELECT * FROM projects WHERE id = 'proj-demo'").fetchone()
        self.assertIsNotNone(demo_proj)
        
        art_count = conn.execute("SELECT COUNT(*) as c FROM artifacts WHERE project_id = 'proj-demo'").fetchone()["c"]
        self.assertGreater(art_count, 0)
        
        q_count = conn.execute("SELECT COUNT(*) as c FROM interview_questions WHERE project_id = 'proj-demo'").fetchone()["c"]
        self.assertGreater(q_count, 0)
        conn.close()

        # Delete proj-demo
        res = self.client.delete("/api/projects/proj-demo")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["status"], "deleted")
        self.assertEqual(data["deleted_project_id"], "proj-demo")

        # Verify completely gone
        conn = get_db()
        proj_after = conn.execute("SELECT * FROM projects WHERE id = 'proj-demo'").fetchone()
        self.assertIsNone(proj_after)

        art_after = conn.execute("SELECT COUNT(*) as c FROM artifacts WHERE project_id = 'proj-demo'").fetchone()["c"]
        self.assertEqual(art_after, 0)

        q_after = conn.execute("SELECT COUNT(*) as c FROM interview_questions WHERE project_id = 'proj-demo'").fetchone()["c"]
        self.assertEqual(q_after, 0)

        # Check FK integrity
        fk_violations = conn.execute("PRAGMA foreign_key_check;").fetchall()
        self.assertEqual(len(fk_violations), 0)
        conn.close()

    def test_delete_active_project_switches_to_remaining_project(self):
        # Create second project
        conn = get_db()
        conn.execute("""
            INSERT INTO projects (id, name, description, mode, is_active, created_at)
            VALUES ('proj-alpha', 'Alpha Project', 'Secondary test project', 'live', 0, '2026-01-01T00:00:00Z')
        """)
        conn.commit()
        conn.close()

        # Ensure proj-demo is active
        self.client.post("/api/projects/select", json={"project_id": "proj-demo"})
        self.assertEqual(get_active_project()["id"], "proj-demo")

        # Delete active project proj-demo
        res = self.client.delete("/api/projects/proj-demo")
        self.assertEqual(res.status_code, 200)

        # Remaining project proj-alpha should now be automatically active
        active = get_active_project()
        self.assertIsNotNone(active)
        self.assertEqual(active["id"], "proj-alpha")

    def test_delete_last_project_returns_none_active(self):
        # Only proj-demo exists initially
        res = self.client.delete("/api/projects/proj-demo")
        self.assertEqual(res.status_code, 200)

        # No active project left
        self.assertIsNone(get_active_project())
        
        # list projects returns empty list
        p_res = self.client.get("/api/projects")
        self.assertEqual(p_res.status_code, 200)
        self.assertEqual(p_res.json()["projects"], [])

if __name__ == "__main__":
    unittest.main()
