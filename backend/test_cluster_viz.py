"""
Automated Test Suite for Clustered Architecture Visualization Endpoint
Verifies:
- GET /api/graph/cluster-viz?dataset=carddemo
- GET /api/graph/cluster-viz?dataset=workspace
- Data integrity of clusters, nodes, radii, colors, risk tiers, and dependency edges.
"""

import unittest
from fastapi.testclient import TestClient
from main import app

class TestClusterVizEndpoint(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        from database import init_db
        from services.auth_service import seed_default_users
        init_db()
        seed_default_users()
        cls.client = TestClient(app)
        login_res = cls.client.post("/api/auth/login", json={"email": "lead@echo.dev", "password": "EchoLead#2026"})
        token = login_res.json()["token"]
        cls.auth_headers = {"Authorization": f"Bearer {token}"}

    def test_unauthenticated_cluster_viz_rejected_401(self):
        """Security test: unauthenticated access to cluster visualization is blocked with 401."""
        unauth_client = TestClient(app)
        res = unauth_client.get("/api/graph/cluster-viz?dataset=carddemo")
        self.assertEqual(res.status_code, 401)

    def test_carddemo_dataset(self):
        res = self.client.get("/api/graph/cluster-viz?dataset=carddemo", headers=self.auth_headers)
        self.assertEqual(res.status_code, 200)
        data = res.json()

        self.assertEqual(data["system_name"], "CardDemo")
        self.assertEqual(data["dataset_type"], "carddemo")
        
        # Verify clusters
        clusters = data["clusters"]
        cluster_ids = {c["id"] for c in clusters}
        expected_clusters = {
            "data_stores", "acct_cust", "card_mgmt", "txn_bill",
            "core_batch", "batch_infra", "db2_ext", "user_sec",
            "reporting", "ims_mq"
        }
        self.assertTrue(expected_clusters.issubset(cluster_ids))

        # Verify nodes
        nodes = data["nodes"]
        self.assertGreaterEqual(len(nodes), 45)
        
        node_names = {n["name"] for n in nodes}
        # Check canonical programs from reference photo
        self.assertIn("COACTUPC", node_names)
        self.assertIn("COACTVWC", node_names)
        self.assertIn("CBTRN01C", node_names)
        self.assertIn("CBACT04C", node_names)
        self.assertIn("CUSTDAT", node_names)
        self.assertIn("ACCTDAT", node_names)

        # Verify node attributes
        for n in nodes:
            self.assertIn("id", n)
            self.assertIn("cluster_id", n)
            self.assertIn("risk_score", n)
            self.assertIn("radius", n)
            self.assertIn("color", n)

        # Verify edges
        edges = data["edges"]
        self.assertGreaterEqual(len(edges), 40)
        for e in edges:
            self.assertIn("source", e)
            self.assertIn("target", e)
            self.assertIn("relation", e)

        # Verify summary
        summary = data["summary"]
        self.assertGreater(summary["total_nodes"], 0)
        self.assertGreater(summary["high_risk_count"], 0)
        self.assertGreater(summary["data_store_count"], 0)

    def test_workspace_dataset(self):
        res = self.client.get("/api/graph/cluster-viz?dataset=workspace", headers=self.auth_headers)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("nodes", data)
        self.assertIn("clusters", data)
        self.assertIn("edges", data)
        self.assertIn("summary", data)
        self.assertGreaterEqual(len(data["nodes"]), 5)

if __name__ == "__main__":
    unittest.main()
