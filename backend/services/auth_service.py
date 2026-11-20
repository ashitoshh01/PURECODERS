"""
Echo Knowledge-Risk Engine — Authentication & Authorization Service
Provides secure password hashing (bcrypt), JWT generation/validation,
session tracking in SQLite, user registration, authentication dependencies,
and role-based access control.
"""

import os
import re
import uuid
import secrets
from datetime import datetime, timezone, timedelta
from typing import Optional, Dict, Any, List
import sqlite3
import bcrypt
import jwt

from database import get_db

# ----------------------------------------------------------------------------
# CONFIGURATION
# ----------------------------------------------------------------------------
DEFAULT_DEV_SECRET = "echo-knowledge-risk-secret-key-prod-2026-hackathon"
JWT_SECRET = os.getenv("JWT_SECRET", DEFAULT_DEV_SECRET)
JWT_ALGORITHM = "HS256"
JWT_EXPIRES_DAYS = int(os.getenv("JWT_EXPIRES_DAYS", "7"))
JWT_REMEMBER_DAYS = int(os.getenv("JWT_REMEMBER_DAYS", "30"))

def validate_security_configuration():
    """Validates critical security configuration at runtime."""
    env = os.getenv("ENV", "").lower()
    railway = os.getenv("RAILWAY_ENVIRONMENT")
    is_prod = env == "production" or bool(railway)
    if is_prod and (not JWT_SECRET or JWT_SECRET == DEFAULT_DEV_SECRET):
        if os.getenv("STRICT_SECURITY", "").lower() in ("true", "1", "yes"):
            raise RuntimeError(
                "CRITICAL SECURITY CONFIGURATION ERROR: JWT_SECRET must be configured with a secure custom value in production."
            )
        else:
            import logging
            logging.getLogger("echo.security").critical(
                "SECURITY WARNING: Default development JWT_SECRET is currently in use in production! Set a custom JWT_SECRET."
            )

validate_security_configuration()

# Valid role identifiers in ECHO
VALID_ROLES = {
    "project_lead": "Project Lead / Manager",
    "departing_contributor": "Departing Contributor",
    "incoming_contributor": "Incoming Contributor",
    "reviewer": "Reviewer"
}

DEFAULT_ROLE = "incoming_contributor"

# ----------------------------------------------------------------------------
# PASSWORD HASHING (BCRYPT)
# ----------------------------------------------------------------------------
def hash_password(password: str) -> str:
    """Hashes a plaintext password using bcrypt with salt."""
    salt = bcrypt.gensalt(rounds=12)
    hashed = bcrypt.hashpw(password.encode("utf-8"), salt)
    return hashed.decode("utf-8")

def verify_password(password: str, hashed_password: str) -> bool:
    """Verifies a plaintext password against a bcrypt hash."""
    try:
        return bcrypt.checkpw(password.encode("utf-8"), hashed_password.encode("utf-8"))
    except Exception:
        return False

# ----------------------------------------------------------------------------
# JWT TOKEN GENERATION & DECODING
# ----------------------------------------------------------------------------
def create_access_token(user_id: str, email: str, role: str, expires_delta: Optional[timedelta] = None) -> str:
    """Generates a signed JWT access token."""
    now = datetime.now(timezone.utc)
    if expires_delta:
        expire = now + expires_delta
    else:
        expire = now + timedelta(days=JWT_EXPIRES_DAYS)

    payload = {
        "sub": user_id,
        "email": email,
        "role": role,
        "iat": int(now.timestamp()),
        "exp": int(expire.timestamp()),
        "jti": secrets.token_hex(16)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def decode_access_token(token: str) -> Optional[Dict[str, Any]]:
    """Decodes and validates a signed JWT access token."""
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except (jwt.ExpiredSignatureError, jwt.InvalidTokenError):
        return None

# ----------------------------------------------------------------------------
# USER DATABASE OPERATIONS
# ----------------------------------------------------------------------------
def validate_email_format(email: str) -> bool:
    """Validates standard email format."""
    pattern = r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$"
    return bool(re.match(pattern, email.strip()))

def get_user_by_email(email: str) -> Optional[Dict[str, Any]]:
    """Fetches user record by email (case-insensitive)."""
    conn = get_db()
    row = conn.execute(
        "SELECT * FROM users WHERE LOWER(email) = LOWER(?)",
        (email.strip(),)
    ).fetchone()
    conn.close()
    return dict(row) if row else None

def get_user_by_id(user_id: str) -> Optional[Dict[str, Any]]:
    """Fetches user record by user ID."""
    conn = get_db()
    row = conn.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()
    conn.close()
    return dict(row) if row else None

def create_user(
    full_name: str,
    email: str,
    password: str,
    role: str = DEFAULT_ROLE
) -> Dict[str, Any]:
    """
    Creates a new user account with hashed password and role.
    Raises ValueError for invalid inputs or duplicate emails.
    """
    clean_name = full_name.strip()
    clean_email = email.strip().lower()

    if not clean_name or len(clean_name) < 2:
        raise ValueError("Full name must be at least 2 characters.")

    if not validate_email_format(clean_email):
        raise ValueError("Please provide a valid email address.")

    if len(password) < 8:
        raise ValueError("Password must be at least 8 characters long.")

    if role not in VALID_ROLES:
        role = DEFAULT_ROLE

    existing = get_user_by_email(clean_email)
    if existing:
        raise ValueError(f"An account with email '{clean_email}' already exists.")

    user_id = f"usr-{uuid.uuid4().hex[:12]}"
    pw_hash = hash_password(password)
    now = datetime.now(timezone.utc).isoformat()

    conn = get_db()
    with conn:
        conn.execute("""
            INSERT INTO users (id, full_name, email, password_hash, role, is_active, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, 1, ?, ?)
        """, (user_id, clean_name, clean_email, pw_hash, role, now, now))
    conn.close()

    return {
        "id": user_id,
        "full_name": clean_name,
        "email": clean_email,
        "role": role,
        "role_display": VALID_ROLES.get(role, role),
        "is_active": 1,
        "created_at": now,
        "updated_at": now
    }

def update_user_role(user_id: str, new_role: str) -> Dict[str, Any]:
    """Updates user role."""
    if new_role not in VALID_ROLES:
        raise ValueError(f"Invalid role '{new_role}'. Must be one of: {list(VALID_ROLES.keys())}")

    now = datetime.now(timezone.utc).isoformat()
    conn = get_db()
    with conn:
        res = conn.execute("UPDATE users SET role = ?, updated_at = ? WHERE id = ?", (new_role, now, user_id))
        if res.rowcount == 0:
            conn.close()
            raise ValueError(f"User '{user_id}' not found.")
    conn.close()
    user = get_user_by_id(user_id)
    if user:
        user.pop("password_hash", None)
        user["role_display"] = VALID_ROLES.get(user["role"], user["role"])
    return user

# ----------------------------------------------------------------------------
# SESSION MANAGEMENT (PERSISTENT IN SQLITE)
# ----------------------------------------------------------------------------
def create_session(user_id: str, token: str, expires_at: datetime) -> None:
    """Stores an active session in the database."""
    now = datetime.now(timezone.utc).isoformat()
    exp_iso = expires_at.isoformat()
    conn = get_db()
    with conn:
        conn.execute("""
            INSERT OR REPLACE INTO user_sessions (token, user_id, expires_at, created_at)
            VALUES (?, ?, ?, ?)
        """, (token, user_id, exp_iso, now))
    conn.close()

def validate_session(token: str) -> Optional[Dict[str, Any]]:
    """
    Validates a session token:
    1. Checks JWT validity & expiration
    2. Verifies session exists in SQLite user_sessions table
    3. Fetches active user
    """
    if not token:
        return None

    # Decode JWT
    payload = decode_access_token(token)
    if not payload:
        return None

    user_id = payload.get("sub")
    if not user_id:
        return None

    now = datetime.now(timezone.utc).isoformat()
    conn = get_db()
    session_row = conn.execute(
        "SELECT * FROM user_sessions WHERE token = ? AND expires_at > ?",
        (token, now)
    ).fetchone()

    if not session_row:
        conn.close()
        return None

    user_row = conn.execute(
        "SELECT id, full_name, email, role, is_active, created_at, updated_at FROM users WHERE id = ? AND is_active = 1",
        (user_id,)
    ).fetchone()
    conn.close()

    if not user_row:
        return None

    user_data = dict(user_row)
    user_data["role_display"] = VALID_ROLES.get(user_data["role"], user_data["role"])
    return user_data

def delete_session(token: str) -> None:
    """Deletes/invalidates an active session."""
    conn = get_db()
    with conn:
        conn.execute("DELETE FROM user_sessions WHERE token = ?", (token,))
    conn.close()

def delete_user_sessions(user_id: str) -> None:
    """Invalidates all sessions for a specific user."""
    conn = get_db()
    with conn:
        conn.execute("DELETE FROM user_sessions WHERE user_id = ?", (user_id,))
    conn.close()

# ----------------------------------------------------------------------------
# PASSWORD RESET WORKFLOW
# ----------------------------------------------------------------------------
def create_password_reset_token(email: str) -> Optional[Dict[str, Any]]:
    """
    Generates a secure password reset token for a user.
    Returns token metadata. If email does not exist, returns None without error.
    """
    user = get_user_by_email(email)
    if not user:
        return None

    token = secrets.token_urlsafe(32)
    now = datetime.now(timezone.utc)
    expires_at = now + timedelta(hours=1)

    conn = get_db()
    with conn:
        # Invalidate previous unused reset tokens for this user
        conn.execute("UPDATE password_reset_tokens SET used = 1 WHERE user_id = ? AND used = 0", (user["id"],))
        conn.execute("""
            INSERT INTO password_reset_tokens (user_id, token, expires_at, used, created_at)
            VALUES (?, ?, ?, 0, ?)
        """, (user["id"], token, expires_at.isoformat(), now.isoformat()))
    conn.close()

    return {
        "user_id": user["id"],
        "email": user["email"],
        "token": token,
        "expires_at": expires_at.isoformat()
    }

def reset_password_with_token(token: str, new_password: str) -> bool:
    """
    Validates a reset token and updates the user's password.
    Raises ValueError on invalid token or password format.
    """
    if len(new_password) < 8:
        raise ValueError("Password must be at least 8 characters long.")

    now = datetime.now(timezone.utc).isoformat()
    conn = get_db()

    row = conn.execute("""
        SELECT * FROM password_reset_tokens
        WHERE token = ? AND used = 0 AND expires_at > ?
    """, (token, now)).fetchone()

    if not row:
        conn.close()
        raise ValueError("Invalid or expired password reset token.")

    user_id = row["user_id"]
    new_hash = hash_password(new_password)

    with conn:
        # Update user's password
        conn.execute("UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?", (new_hash, now, user_id))
        # Mark token as used
        conn.execute("UPDATE password_reset_tokens SET used = 1 WHERE id = ?", (row["id"],))
        # Invalidate all active sessions for security
        conn.execute("DELETE FROM user_sessions WHERE user_id = ?", (user_id,))
    conn.close()

    return True

# ----------------------------------------------------------------------------
# SEED DEFAULT DEMO USERS
# ----------------------------------------------------------------------------
DEFAULT_DEMO_ACCOUNTS = [
    {
        "full_name": "Neha Sharma (Project Lead)",
        "email": "lead@echo.dev",
        "password": "EchoLead#2026",
        "role": "project_lead",
    },
    {
        "full_name": "Aarav Patel (Departing Lead)",
        "email": "leaver@echo.dev",
        "password": "EchoLeaver#2026",
        "role": "departing_contributor",
    },
    {
        "full_name": "Meera Nair (Successor)",
        "email": "successor@echo.dev",
        "password": "EchoSuccessor#2026",
        "role": "incoming_contributor",
    },
    {
        "full_name": "Priya Menon (Reviewer)",
        "email": "reviewer@echo.dev",
        "password": "EchoReviewer#2026",
        "role": "reviewer",
    },
]

def seed_default_users() -> None:
    """Seeds default demo accounts for each role if they do not exist, and ensures their default passwords."""
    for acc in DEFAULT_DEMO_ACCOUNTS:
        try:
            existing = get_user_by_email(acc["email"])
            if not existing:
                create_user(
                    full_name=acc["full_name"],
                    email=acc["email"],
                    password=acc["password"],
                    role=acc["role"]
                )
            else:
                conn = get_db()
                with conn:
                    conn.execute(
                        "UPDATE users SET password_hash = ?, full_name = ?, role = ? WHERE LOWER(email) = LOWER(?)",
                        (hash_password(acc["password"]), acc["full_name"], acc["role"], acc["email"])
                    )
                conn.close()
        except Exception:
            pass

