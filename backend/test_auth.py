"""
Test Suite for ECHO Authentication & Role-Based Access Control
Validates:
- User registration (validation, duplicate prevention, bcrypt hashing)
- User login (valid credentials, invalid password, non-existent user, session cookie)
- Current user retrieval (/api/auth/me via Bearer token and cookie)
- User logout and session invalidation
- Password reset workflow (forgot password token generation, token consumption, replay attack prevention)
- Demo users listing and role switching
- Password security (bcrypt salt verification, plain text prevention)
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

class TestAuthentication(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        init_db()
        conn = get_db()
        with conn:
            conn.execute("DELETE FROM users WHERE email LIKE '%@domain.com'")
        conn.close()
        auth_service.seed_default_users()
        cls.client = TestClient(app)

    def test_01_seed_default_users(self):
        """Verifies that default demo accounts are seeded with distinct roles."""
        res = self.client.get("/api/auth/demo-users")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        users = data.get("users", [])
        self.assertEqual(len(users), 4)

        emails = [u["email"] for u in users]
        roles = [u["role"] for u in users]
        self.assertIn("lead@echo.dev", emails)
        self.assertIn("leaver@echo.dev", emails)
        self.assertIn("successor@echo.dev", emails)
        self.assertIn("reviewer@echo.dev", emails)
        self.assertIn("project_lead", roles)
        self.assertIn("departing_contributor", roles)
        self.assertIn("incoming_contributor", roles)
        self.assertIn("reviewer", roles)

    def test_02_login_demo_user_success(self):
        """Tests successful login with a seeded benchmark user."""
        res = self.client.post("/api/auth/login", json={
            "email": "lead@echo.dev",
            "password": "EchoLead#2026",
            "remember_me": True
        })
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["status"], "success")
        self.assertIn("token", data)
        self.assertEqual(data["user"]["role"], "project_lead")
        self.assertEqual(data["user"]["email"], "lead@echo.dev")
        self.assertNotIn("password_hash", data["user"])
        # Verify cookie was set
        self.assertIn("echo_token", res.cookies)

    def test_03_login_invalid_password(self):
        """Tests login failure with incorrect password."""
        res = self.client.post("/api/auth/login", json={
            "email": "lead@echo.dev",
            "password": "WrongPassword123"
        })
        self.assertEqual(res.status_code, 401)
        self.assertIn("Invalid email or password", res.json()["detail"])

    def test_04_login_nonexistent_user(self):
        """Tests login failure with unregistered email."""
        res = self.client.post("/api/auth/login", json={
            "email": "nonexistent@echo.dev",
            "password": "SomePassword123"
        })
        self.assertEqual(res.status_code, 401)
        self.assertIn("Invalid email or password", res.json()["detail"])

    def test_05_register_new_user_success(self):
        """Tests successful registration of a new user."""
        res = self.client.post("/api/auth/register", json={
            "full_name": "Dev Tester",
            "email": "tester@domain.com",
            "password": "SecurePassword#2026",
            "role": "incoming_contributor"
        })
        self.assertEqual(res.status_code, 201)
        data = res.json()
        self.assertEqual(data["status"], "success")
        self.assertIn("token", data)
        self.assertEqual(data["user"]["email"], "tester@domain.com")
        self.assertEqual(data["user"]["full_name"], "Dev Tester")
        self.assertEqual(data["user"]["role"], "incoming_contributor")

        # Verify password is not plaintext in database
        conn = get_db()
        row = conn.execute("SELECT password_hash FROM users WHERE email = 'tester@domain.com'").fetchone()
        conn.close()
        self.assertIsNotNone(row)
        self.assertTrue(row["password_hash"].startswith("$2b$") or row["password_hash"].startswith("$2a$"))
        self.assertNotIn("SecurePassword#2026", row["password_hash"])

    def test_06_register_duplicate_email(self):
        """Prevents duplicate registration with the same email."""
        res = self.client.post("/api/auth/register", json={
            "full_name": "Another Tester",
            "email": "tester@domain.com",
            "password": "AnotherPassword#2026",
            "role": "reviewer"
        })
        self.assertEqual(res.status_code, 409)
        self.assertIn("already exists", res.json()["detail"])

    def test_07_register_short_password(self):
        """Rejects password shorter than 8 characters."""
        res = self.client.post("/api/auth/register", json={
            "full_name": "Short Pw",
            "email": "short@domain.com",
            "password": "short",
            "role": "incoming_contributor"
        })
        self.assertEqual(res.status_code, 422)

    def test_08_get_current_user_me(self):
        """Tests /api/auth/me with valid Bearer token."""
        login_res = self.client.post("/api/auth/login", json={
            "email": "successor@echo.dev",
            "password": "EchoSuccessor#2026"
        })
        token = login_res.json()["token"]

        # Call /api/auth/me with Authorization header
        me_res = self.client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
        self.assertEqual(me_res.status_code, 200)
        data = me_res.json()
        self.assertTrue(data["authenticated"])
        self.assertEqual(data["user"]["email"], "successor@echo.dev")
        self.assertEqual(data["user"]["role"], "incoming_contributor")

    def test_09_get_current_user_unauthorized(self):
        """Tests /api/auth/me returns 401 when no token or cookie is provided."""
        # Clear client session cookies from previous tests
        self.client.cookies.clear()
        res = self.client.get("/api/auth/me")
        self.assertEqual(res.status_code, 401)

    def test_10_logout_and_session_invalidation(self):
        """Tests logout invalidates the session in the database."""
        login_res = self.client.post("/api/auth/login", json={
            "email": "reviewer@echo.dev",
            "password": "EchoReviewer#2026"
        })
        token = login_res.json()["token"]

        # Verify access works before logout
        chk_res = self.client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
        self.assertEqual(chk_res.status_code, 200)

        # Call logout
        logout_res = self.client.post("/api/auth/logout", headers={"Authorization": f"Bearer {token}"})
        self.assertEqual(logout_res.status_code, 200)

        # Verify access is now rejected
        after_res = self.client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
        self.assertEqual(after_res.status_code, 401)

    def test_11_forgot_and_reset_password_workflow(self):
        """Tests the complete forgot password and reset password lifecycle."""
        # 1. Request forgot password for registered user
        forgot_res = self.client.post("/api/auth/forgot-password", json={
            "email": "leaver@echo.dev"
        })
        self.assertEqual(forgot_res.status_code, 200)
        data = forgot_res.json()
        self.assertEqual(data["status"], "success")
        self.assertIn("dev_reset_token", data)
        reset_token = data["dev_reset_token"]

        # 2. Reset password using the generated token
        new_password = "BrandNewPassword#2026"
        reset_res = self.client.post("/api/auth/reset-password", json={
            "token": reset_token,
            "new_password": new_password
        })
        self.assertEqual(reset_res.status_code, 200)

        # 3. Old password should now fail
        old_login = self.client.post("/api/auth/login", json={
            "email": "leaver@echo.dev",
            "password": "EchoLeaver#2026"
        })
        self.assertEqual(old_login.status_code, 401)

        # 4. New password should succeed
        new_login = self.client.post("/api/auth/login", json={
            "email": "leaver@echo.dev",
            "password": new_password
        })
        self.assertEqual(new_login.status_code, 200)

        # 5. Replaying the reset token should fail (token was consumed)
        replay_res = self.client.post("/api/auth/reset-password", json={
            "token": reset_token,
            "new_password": "AnotherPassword#2026"
        })
        self.assertEqual(replay_res.status_code, 400)

        # 6. Restore demo account password so manual logins continue to succeed
        auth_service.seed_default_users()

    def test_12_forgot_password_nonexistent_email(self):
        """Forgot password for non-existent email should return success without leaking info."""
        res = self.client.post("/api/auth/forgot-password", json={
            "email": "unknown-stranger@nowhere.com"
        })
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.json()["status"], "success")
        self.assertNotIn("dev_reset_token", res.json())

    def test_13_switch_role(self):
        """Tests authenticated role switching."""
        login_res = self.client.post("/api/auth/login", json={
            "email": "lead@echo.dev",
            "password": "EchoLead#2026"
        })
        token = login_res.json()["token"]

        # Switch role to reviewer
        switch_res = self.client.post(
            "/api/auth/switch-role",
            json={"role": "reviewer"},
            headers={"Authorization": f"Bearer {token}"}
        )
        self.assertEqual(switch_res.status_code, 200)
        self.assertEqual(switch_res.json()["user"]["role"], "reviewer")

        # Reset back to project_lead
        self.client.post(
            "/api/auth/switch-role",
            json={"role": "project_lead"},
            headers={"Authorization": f"Bearer {token}"}
        )

    def test_14_unauthenticated_api_endpoints_blocked(self):
        """Security test: protected business endpoints return 401 when no session exists."""
        self.client.cookies.clear()
        
        # Test protected endpoints return 401
        self.assertEqual(self.client.get("/api/projects").status_code, 401)
        self.assertEqual(self.client.get("/api/risk-map").status_code, 401)
        self.assertEqual(self.client.get("/api/handover").status_code, 401)
        self.assertEqual(self.client.post("/api/reset").status_code, 401)
        self.assertEqual(self.client.delete("/api/projects/proj-demo").status_code, 401)

    def test_15_role_permission_guards_enforced(self):
        """Security test: role-based access control blocks unauthorized operations with 403."""
        # Login as incoming contributor (successor)
        login_res = self.client.post("/api/auth/login", json={
            "email": "successor@echo.dev",
            "password": "EchoSuccessor#2026"
        })
        token = login_res.json()["token"]
        headers = {"Authorization": f"Bearer {token}"}

        # Successor can read risk map & handover
        self.assertEqual(self.client.get("/api/risk-map", headers=headers).status_code, 200)
        self.assertEqual(self.client.get("/api/handover", headers=headers).status_code, 200)

        # Successor CANNOT delete projects (lead only -> 403)
        self.assertEqual(self.client.delete("/api/projects/proj-demo", headers=headers).status_code, 403)

        # Successor CANNOT reset database (lead only -> 403)
        self.assertEqual(self.client.post("/api/reset", headers=headers).status_code, 403)

        # Successor CANNOT approve reviewer items (reviewer/lead only -> 403)
        self.assertEqual(self.client.post("/api/handover/approve", json={"approved_by": "Test"}, headers=headers).status_code, 403)

if __name__ == "__main__":
    unittest.main()
