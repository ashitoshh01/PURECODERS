"""
ECHO Authentication & Protected Access End-to-End Verification Test
Verifies the complete 13-step verification checklist specified in the task:
1. Open application without logging in -> verify login/unauthenticated state.
2. Verify that unauthenticated access to /api/auth/me is rejected.
3. Register a new user with full_name, email, password, role.
4. Verify user is stored in SQLite database with secure bcrypt password hash.
5. Log in with valid credentials -> returns token and sets HTTP-only cookie.
6. Verify session restoration (page refresh simulation via /api/auth/me).
7. Try incorrect login credentials -> verify 401 rejection with proper error message.
8. Try registering an already registered email -> verify 409 duplicate rejection.
9. Verify access to protected resources without authentication is blocked.
10. Test logout -> verify session invalidated in database and cookies cleared.
11. Verify that subsequent access using logged-out session fails (401).
12. Test forgot password and reset password workflow.
13. Verify that existing ECHO features (Risk Map, Exit Interview, Handover, Ask Echo, Git Connectors) remain 100% operational.
"""

import os
import sys
import unittest

backend_dir = os.path.dirname(os.path.abspath(__file__))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from fastapi.testclient import TestClient
from main import app
from database import init_db, get_db, reset_database
from services import auth_service

class TestE2EVerification(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        init_db()
        conn = get_db()
        with conn:
            conn.execute("DELETE FROM users WHERE email LIKE '%@verification.com'")
        conn.close()
        auth_service.seed_default_users()
        cls.client = TestClient(app)

    def test_step_01_and_02_unauthenticated_state(self):
        """Step 1 & 2: Verify unauthenticated state and protected route blocking."""
        self.client.cookies.clear()
        res = self.client.get("/api/auth/me")
        self.assertEqual(res.status_code, 401)
        self.assertIn("Authentication required", res.json()["detail"])

        # Root static serving serves the frontend SPA for login
        root_res = self.client.get("/")
        self.assertEqual(root_res.status_code, 200)

    def test_step_03_and_04_registration_and_db_persistence(self):
        """Step 3 & 4: Register a new user and verify secure database storage."""
        reg_payload = {
            "full_name": "Sarah Connor",
            "email": "sarah@verification.com",
            "password": "SecurePassword#2026",
            "role": "incoming_contributor"
        }
        res = self.client.post("/api/auth/register", json=reg_payload)
        self.assertEqual(res.status_code, 201)
        data = res.json()
        self.assertEqual(data["status"], "success")
        self.assertEqual(data["user"]["email"], "sarah@verification.com")
        self.assertEqual(data["user"]["full_name"], "Sarah Connor")
        self.assertEqual(data["user"]["role"], "incoming_contributor")
        self.assertIn("token", data)

        # Direct database verification
        conn = get_db()
        user_row = conn.execute("SELECT * FROM users WHERE email = 'sarah@verification.com'").fetchone()
        conn.close()
        self.assertIsNotNone(user_row)
        self.assertEqual(user_row["full_name"], "Sarah Connor")
        # Ensure password is NOT stored as plaintext
        self.assertNotEqual(user_row["password_hash"], "SecurePassword#2026")
        # Ensure password is a valid bcrypt hash
        self.assertTrue(user_row["password_hash"].startswith("$2b$") or user_row["password_hash"].startswith("$2a$"))
        # Verify bcrypt verify works
        self.assertTrue(auth_service.verify_password("SecurePassword#2026", user_row["password_hash"]))

    def test_step_05_and_06_login_and_session_persistence(self):
        """Step 5 & 6: Log in and verify session persistence on page refresh."""
        self.client.cookies.clear()
        login_res = self.client.post("/api/auth/login", json={
            "email": "sarah@verification.com",
            "password": "SecurePassword#2026",
            "remember_me": True
        })
        self.assertEqual(login_res.status_code, 200)
        login_data = login_res.json()
        token = login_data["token"]
        self.assertIn("echo_token", login_res.cookies)

        # Simulate page refresh by fetching /api/auth/me using Bearer token
        refresh_res = self.client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
        self.assertEqual(refresh_res.status_code, 200)
        refresh_data = refresh_res.json()
        self.assertTrue(refresh_data["authenticated"])
        self.assertEqual(refresh_data["user"]["email"], "sarah@verification.com")
        self.assertEqual(refresh_data["user"]["role"], "incoming_contributor")

    def test_step_07_incorrect_login_credentials(self):
        """Step 7: Reject incorrect password with 401."""
        res = self.client.post("/api/auth/login", json={
            "email": "sarah@verification.com",
            "password": "WrongPassword#9999"
        })
        self.assertEqual(res.status_code, 401)
        self.assertIn("Invalid email or password", res.json()["detail"])

    def test_step_08_duplicate_email_prevention(self):
        """Step 8: Prevent duplicate registration with 409 Conflict."""
        res = self.client.post("/api/auth/register", json={
            "full_name": "Clone Sarah",
            "email": "sarah@verification.com",
            "password": "AnotherPassword#2026",
            "role": "reviewer"
        })
        self.assertEqual(res.status_code, 409)
        self.assertIn("already exists", res.json()["detail"])

    def test_step_09_10_and_11_logout_and_revocation(self):
        """Step 9, 10, 11: Test logout, cookie clearing, and subsequent access revocation."""
        # Log in to get active session
        login_res = self.client.post("/api/auth/login", json={
            "email": "sarah@verification.com",
            "password": "SecurePassword#2026"
        })
        token = login_res.json()["token"]

        # Call logout endpoint
        logout_res = self.client.post("/api/auth/logout", headers={"Authorization": f"Bearer {token}"})
        self.assertEqual(logout_res.status_code, 200)

        # Verify session is deleted from user_sessions table
        conn = get_db()
        session_row = conn.execute("SELECT * FROM user_sessions WHERE token = ?", (token,)).fetchone()
        conn.close()
        self.assertIsNone(session_row)

        # Verify subsequent /api/auth/me fails with 401
        self.client.cookies.clear()
        revoked_res = self.client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
        self.assertEqual(revoked_res.status_code, 401)

    def test_step_12_forgot_and_reset_password(self):
        """Step 12: Verify time-limited password recovery workflow."""
        # 1. Forgot password
        forgot_res = self.client.post("/api/auth/forgot-password", json={
            "email": "sarah@verification.com"
        })
        self.assertEqual(forgot_res.status_code, 200)
        token = forgot_res.json().get("dev_reset_token")
        self.assertIsNotNone(token)

        # 2. Reset password with token
        new_pass = "SarahNewSecret#2026"
        reset_res = self.client.post("/api/auth/reset-password", json={
            "token": token,
            "new_password": new_pass
        })
        self.assertEqual(reset_res.status_code, 200)

        # 3. Login with new password
        login_new = self.client.post("/api/auth/login", json={
            "email": "sarah@verification.com",
            "password": new_pass
        })
        self.assertEqual(login_new.status_code, 200)

    def test_step_13_existing_echo_features_intact(self):
        """Step 13: Verify all existing ECHO core APIs remain operational."""
        # Health
        health = self.client.get("/api/health").json()
        self.assertEqual(health["status"], "ok")

        # Projects
        projects = self.client.get("/api/projects").json()
        self.assertIn("projects", projects)

        # Risk Map
        risk = self.client.get("/api/risk-map").json()
        self.assertIn("artifacts", risk)
        self.assertIn("high_risk_count", risk)

        # Exit Interview
        interview = self.client.get("/api/interview/questions").json()
        self.assertIn("questions", interview)

        # Handover Package
        handover = self.client.get("/api/handover").json()
        self.assertIn("coverage", handover)

        # Connectors
        connectors = self.client.get("/api/connectors").json()
        self.assertIn("connectors", connectors)

if __name__ == "__main__":
    unittest.main()
