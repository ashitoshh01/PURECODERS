"""
Echo Knowledge-Risk Engine — SQLite Database Layer
Persistent storage for projects, repositories, artifacts, team members,
risk assessments, interview answers, decisions, handovers, chats,
GitHub credentials, commits, and asynchronous ingestion jobs.
"""

import os
import sqlite3
from datetime import datetime, timezone

DB_PATH = os.getenv("DATABASE_PATH", os.path.join(os.path.dirname(__file__), "echo.db"))

def get_db():
    db_dir = os.path.dirname(os.path.abspath(DB_PATH))
    if db_dir and not os.path.exists(db_dir):
        os.makedirs(db_dir, exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON;")
    return conn

def init_db():
    conn = get_db()
    with conn:
        conn.executescript("""
        CREATE TABLE IF NOT EXISTS projects (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            description TEXT,
            mode TEXT DEFAULT 'demo', -- 'demo' or 'live'
            is_active INTEGER DEFAULT 0,
            created_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS repositories (
            id TEXT PRIMARY KEY,
            project_id TEXT NOT NULL,
            name TEXT NOT NULL,
            path_or_url TEXT,
            branch TEXT DEFAULT 'main',
            source_type TEXT DEFAULT 'git', -- 'git', 'github', 'demo'
            status TEXT DEFAULT 'synced',
            last_synced_at TEXT,
            owner TEXT,
            repo_id_github INTEGER,
            default_branch TEXT,
            description TEXT,
            is_private INTEGER DEFAULT 0,
            html_url TEXT,
            size_kb INTEGER DEFAULT 0,
            FOREIGN KEY(project_id) REFERENCES projects(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS team_members (
            id TEXT PRIMARY KEY,
            project_id TEXT NOT NULL,
            name TEXT NOT NULL,
            email TEXT,
            role TEXT NOT NULL,
            is_leaver INTEGER DEFAULT 0,
            is_successor INTEGER DEFAULT 0,
            is_manager INTEGER DEFAULT 0,
            avatar_url TEXT,
            FOREIGN KEY(project_id) REFERENCES projects(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS artifacts (
            id TEXT PRIMARY KEY,
            project_id TEXT NOT NULL,
            repo_id TEXT,
            type TEXT NOT NULL, -- 'module', 'pull_request', 'ticket', 'chat_thread', 'document'
            title TEXT NOT NULL,
            path TEXT,
            criticality INTEGER NOT NULL, -- 1-5
            doc_coverage REAL NOT NULL, -- 0.0 - 1.0
            days_since_touch INTEGER NOT NULL,
            repo TEXT,
            is_planted_gap INTEGER DEFAULT 0,
            created_at TEXT NOT NULL,
            FOREIGN KEY(project_id) REFERENCES projects(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS contributions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            artifact_id TEXT NOT NULL,
            person_id TEXT NOT NULL,
            count INTEGER NOT NULL DEFAULT 0,
            FOREIGN KEY(artifact_id) REFERENCES artifacts(id) ON DELETE CASCADE,
            FOREIGN KEY(person_id) REFERENCES team_members(id) ON DELETE CASCADE,
            UNIQUE(artifact_id, person_id)
        );

        CREATE TABLE IF NOT EXISTS graph_edges (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            project_id TEXT NOT NULL,
            source TEXT NOT NULL,
            relation TEXT NOT NULL,
            target TEXT NOT NULL,
            FOREIGN KEY(project_id) REFERENCES projects(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS interview_questions (
            id TEXT PRIMARY KEY,
            project_id TEXT NOT NULL,
            artifact_id TEXT NOT NULL,
            evidence TEXT NOT NULL,
            gap_type TEXT NOT NULL,
            risk_score REAL NOT NULL,
            question TEXT NOT NULL,
            rationale TEXT,
            order_index INTEGER DEFAULT 0,
            FOREIGN KEY(project_id) REFERENCES projects(id) ON DELETE CASCADE,
            FOREIGN KEY(artifact_id) REFERENCES artifacts(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS interview_answers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            question_id TEXT NOT NULL,
            artifact_id TEXT NOT NULL,
            evidence TEXT,
            question TEXT,
            answer TEXT NOT NULL,
            submitted_by TEXT,
            submitted_at TEXT NOT NULL,
            FOREIGN KEY(question_id) REFERENCES interview_questions(id) ON DELETE CASCADE,
            FOREIGN KEY(artifact_id) REFERENCES artifacts(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS decisions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            project_id TEXT NOT NULL,
            artifact_id TEXT NOT NULL,
            decision TEXT NOT NULL,
            rationale TEXT NOT NULL,
            extracted_from_answer_id INTEGER,
            created_at TEXT NOT NULL,
            FOREIGN KEY(project_id) REFERENCES projects(id) ON DELETE CASCADE,
            FOREIGN KEY(artifact_id) REFERENCES artifacts(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS handover_packages (
            id TEXT PRIMARY KEY,
            project_id TEXT NOT NULL,
            leaver_id TEXT NOT NULL,
            successor_id TEXT NOT NULL,
            manager_id TEXT NOT NULL,
            status TEXT DEFAULT 'pending_manager_approval', -- 'pending_manager_approval', 'approved'
            approved_at TEXT,
            approved_by TEXT,
            FOREIGN KEY(project_id) REFERENCES projects(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS onboarding_tasks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            package_id TEXT NOT NULL,
            week INTEGER NOT NULL,
            days TEXT NOT NULL,
            task TEXT NOT NULL,
            why TEXT NOT NULL,
            is_completed INTEGER DEFAULT 0,
            order_index INTEGER DEFAULT 0,
            FOREIGN KEY(package_id) REFERENCES handover_packages(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS open_loops (
            id TEXT PRIMARY KEY,
            package_id TEXT NOT NULL,
            title TEXT NOT NULL,
            artifact_id TEXT NOT NULL,
            owner_id TEXT NOT NULL,
            FOREIGN KEY(package_id) REFERENCES handover_packages(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS who_to_ask (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            package_id TEXT NOT NULL,
            area TEXT NOT NULL,
            contact TEXT NOT NULL,
            confidence TEXT NOT NULL, -- 'high', 'low'
            FOREIGN KEY(package_id) REFERENCES handover_packages(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS chat_messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            project_id TEXT NOT NULL,
            conversation_id TEXT,
            role TEXT NOT NULL, -- 'user', 'echo'
            text TEXT,
            answer TEXT,
            echo_says TEXT,
            suggested_contact TEXT,
            stale_warning INTEGER DEFAULT 0,
            citations_json TEXT,
            created_at TEXT NOT NULL,
            FOREIGN KEY(project_id) REFERENCES projects(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS conversations (
            id TEXT PRIMARY KEY,
            project_id TEXT NOT NULL,
            title TEXT NOT NULL,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            FOREIGN KEY(project_id) REFERENCES projects(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS connectors (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            type TEXT NOT NULL, -- 'git', 'github', 'slack', 'jira', 'docs'
            status TEXT NOT NULL, -- 'connected', 'disconnected', 'not_configured'
            details TEXT,
            last_sync_at TEXT
        );

        CREATE TABLE IF NOT EXISTS github_credentials (
            id TEXT PRIMARY KEY DEFAULT 'default',
            auth_type TEXT NOT NULL, -- 'pat', 'oauth', 'app'
            token TEXT NOT NULL,
            username TEXT,
            name TEXT,
            avatar_url TEXT,
            scopes TEXT,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS ingestion_jobs (
            id TEXT PRIMARY KEY,
            project_id TEXT,
            repo_owner TEXT,
            repo_name TEXT,
            branch TEXT,
            status TEXT NOT NULL, -- 'queued', 'cloning', 'analyzing', 'completed', 'failed'
            step TEXT,
            progress INTEGER DEFAULT 0,
            artifacts_count INTEGER DEFAULT 0,
            authors_count INTEGER DEFAULT 0,
            error_message TEXT,
            created_at TEXT NOT NULL,
            updated_at TEXT,
            completed_at TEXT
        );

        CREATE TABLE IF NOT EXISTS commits (
            id TEXT PRIMARY KEY,
            project_id TEXT NOT NULL,
            repo_id TEXT NOT NULL,
            author_name TEXT NOT NULL,
            author_email TEXT,
            committed_at TEXT NOT NULL,
            message TEXT,
            files_changed_count INTEGER DEFAULT 0,
            FOREIGN KEY(project_id) REFERENCES projects(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            full_name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            role TEXT NOT NULL DEFAULT 'incoming_contributor',
            is_active INTEGER DEFAULT 1,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS user_sessions (
            token TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            expires_at TEXT NOT NULL,
            created_at TEXT NOT NULL,
            FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS password_reset_tokens (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT NOT NULL,
            token TEXT UNIQUE NOT NULL,
            expires_at TEXT NOT NULL,
            used INTEGER DEFAULT 0,
            created_at TEXT NOT NULL,
            FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS workspace_memberships (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT NOT NULL,
            project_id TEXT NOT NULL,
            role TEXT NOT NULL,
            joined_at TEXT NOT NULL,
            FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY(project_id) REFERENCES projects(id) ON DELETE CASCADE,
            UNIQUE(user_id, project_id)
        );

        CREATE TABLE IF NOT EXISTS connector_credentials (
            id TEXT PRIMARY KEY,
            connector_type TEXT NOT NULL, -- 'slack', 'jira', 'github'
            project_id TEXT,
            auth_type TEXT NOT NULL,      -- 'oauth', 'token'
            access_token TEXT NOT NULL,
            refresh_token TEXT,
            token_expires_at TEXT,
            scope TEXT,
            workspace_id TEXT,
            workspace_name TEXT,
            account_email TEXT,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS connector_sync_targets (
            id TEXT PRIMARY KEY,
            connector_type TEXT NOT NULL, -- 'slack', 'jira'
            project_id TEXT NOT NULL,
            target_id TEXT NOT NULL,      -- Slack channel ID or Jira project key
            target_name TEXT NOT NULL,
            sync_enabled INTEGER DEFAULT 1,
            last_synced_at TEXT,
            FOREIGN KEY(project_id) REFERENCES projects(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS landmines (
            id TEXT PRIMARY KEY,
            project_id TEXT NOT NULL,
            artifact_id TEXT NOT NULL,
            title TEXT NOT NULL,
            description TEXT NOT NULL,
            symptom TEXT,
            how_to_recover TEXT,
            extracted_from_answer_id INTEGER,
            review_status TEXT DEFAULT 'pending_review', -- 'pending_review', 'approved', 'rejected'
            reviewed_by TEXT,
            reviewed_at TEXT,
            created_at TEXT NOT NULL,
            FOREIGN KEY(project_id) REFERENCES projects(id) ON DELETE CASCADE,
            FOREIGN KEY(artifact_id) REFERENCES artifacts(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS risk_snapshots (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            project_id TEXT NOT NULL,
            repo_id TEXT,
            snapshot_date TEXT NOT NULL,
            high_risk_count INTEGER NOT NULL,
            bus_factor_violations_count INTEGER NOT NULL,
            avg_risk_score REAL NOT NULL,
            created_at TEXT NOT NULL,
            FOREIGN KEY(project_id) REFERENCES projects(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS knowledge_drift_alerts (
            id TEXT PRIMARY KEY,
            project_id TEXT NOT NULL,
            repo_id TEXT,
            artifact_id TEXT NOT NULL,
            alert_type TEXT NOT NULL, -- 'stale_knowledge', 'newly_concentrated', 'bus_factor_jump'
            severity TEXT NOT NULL,   -- 'critical', 'warning', 'info'
            message TEXT NOT NULL,
            previous_value REAL,
            current_value REAL,
            is_resolved INTEGER DEFAULT 0,
            created_at TEXT NOT NULL,
            FOREIGN KEY(project_id) REFERENCES projects(id) ON DELETE CASCADE,
            FOREIGN KEY(artifact_id) REFERENCES artifacts(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS knowledge_freshness_alerts (
            id TEXT PRIMARY KEY,
            project_id TEXT NOT NULL,
            record_type TEXT NOT NULL, -- 'decision', 'landmine', 'doc'
            record_id TEXT NOT NULL,
            artifact_id TEXT,
            title TEXT NOT NULL,
            documented_statement TEXT NOT NULL,
            contradicting_commit_id TEXT,
            contradicting_message TEXT,
            contradicting_author TEXT,
            mismatch_details TEXT,
            severity TEXT NOT NULL DEFAULT 'warning', -- 'warning', 'critical'
            is_resolved INTEGER DEFAULT 0,
            resolved_at TEXT,
            resolved_by TEXT,
            created_at TEXT NOT NULL,
            FOREIGN KEY(project_id) REFERENCES projects(id) ON DELETE CASCADE
        );
        """)

        # Migration: ensure newly added columns exist in older SQLite databases
        repo_cols = [r["name"] for r in conn.execute("PRAGMA table_info(repositories)").fetchall()]
        needed_repo_cols = {
            "owner": "TEXT",
            "repo_id_github": "INTEGER",
            "default_branch": "TEXT",
            "description": "TEXT",
            "is_private": "INTEGER DEFAULT 0",
            "html_url": "TEXT",
            "size_kb": "INTEGER DEFAULT 0"
        }
        for col, col_type in needed_repo_cols.items():
            if col not in repo_cols:
                conn.execute(f"ALTER TABLE repositories ADD COLUMN {col} {col_type};")

        chat_cols = [r["name"] for r in conn.execute("PRAGMA table_info(chat_messages)").fetchall()]
        needed_chat_cols = {
            "ai_provider": "TEXT DEFAULT 'asi1'",
            "ai_model": "TEXT DEFAULT 'asi1'",
            "conversation_id": "TEXT"
        }
        for col, col_type in needed_chat_cols.items():
            if col not in chat_cols:
                conn.execute(f"ALTER TABLE chat_messages ADD COLUMN {col} {col_type};")

        # Backfill conversations table if missing
        conn.execute("""
            CREATE TABLE IF NOT EXISTS conversations (
                id TEXT PRIMARY KEY,
                project_id TEXT NOT NULL,
                title TEXT NOT NULL,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                FOREIGN KEY(project_id) REFERENCES projects(id) ON DELETE CASCADE
            );
        """)

        # If any chat_messages have NULL conversation_id, backfill a default conversation
        null_conv_rows = conn.execute("SELECT DISTINCT project_id FROM chat_messages WHERE conversation_id IS NULL").fetchall()
        for nr in null_conv_rows:
            p_id = nr["project_id"]
            first_user_msg = conn.execute(
                "SELECT text, created_at FROM chat_messages WHERE project_id = ? AND role = 'user' ORDER BY id ASC LIMIT 1",
                (p_id,)
            ).fetchone()
            first_title = first_user_msg["text"][:50] if first_user_msg else "General Discussion"
            conv_id = f"conv_default_{p_id}"
            first_time = first_user_msg["created_at"] if first_user_msg else "2026-11-18T00:00:00Z"
            conn.execute("""
                INSERT OR IGNORE INTO conversations (id, project_id, title, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?)
            """, (conv_id, p_id, first_title, first_time, first_time))
            conn.execute("UPDATE chat_messages SET conversation_id = ? WHERE project_id = ? AND conversation_id IS NULL", (conv_id, p_id))

        # Decisions migration: rejected_alternatives, review_status, reviewed_by, reviewed_at, freshness columns
        decision_cols = [r["name"] for r in conn.execute("PRAGMA table_info(decisions)").fetchall()]
        needed_decision_cols = {
            "rejected_alternatives": "TEXT",
            "review_status": "TEXT DEFAULT 'pending_review'",
            "reviewed_by": "TEXT",
            "reviewed_at": "TEXT",
            "last_verified_at": "TEXT",
            "last_verified_by": "TEXT",
            "freshness_status": "TEXT DEFAULT 'fresh'",
            "mismatch_reason": "TEXT",
            "contradicting_commit_id": "TEXT"
        }
        for col, col_type in needed_decision_cols.items():
            if col not in decision_cols:
                conn.execute(f"ALTER TABLE decisions ADD COLUMN {col} {col_type};")

        # Landmines migration: freshness columns
        landmine_cols = [r["name"] for r in conn.execute("PRAGMA table_info(landmines)").fetchall()]
        needed_landmine_cols = {
            "last_verified_at": "TEXT",
            "last_verified_by": "TEXT",
            "freshness_status": "TEXT DEFAULT 'fresh'",
            "mismatch_reason": "TEXT",
            "contradicting_commit_id": "TEXT"
        }
        for col, col_type in needed_landmine_cols.items():
            if col not in landmine_cols:
                conn.execute(f"ALTER TABLE landmines ADD COLUMN {col} {col_type};")

        # Open Loops migration: description, review_status, reviewed_by, reviewed_at
        loop_cols = [r["name"] for r in conn.execute("PRAGMA table_info(open_loops)").fetchall()]
        needed_loop_cols = {
            "description": "TEXT",
            "review_status": "TEXT DEFAULT 'pending_review'",
            "reviewed_by": "TEXT",
            "reviewed_at": "TEXT"
        }
        for col, col_type in needed_loop_cols.items():
            if col not in loop_cols:
                conn.execute(f"ALTER TABLE open_loops ADD COLUMN {col} {col_type};")

        # Artifacts migration: source_connector, updated_at
        artifact_cols = [r["name"] for r in conn.execute("PRAGMA table_info(artifacts)").fetchall()]
        needed_artifact_cols = {
            "source_connector": "TEXT",
            "updated_at": "TEXT",
        }
        for col, col_type in needed_artifact_cols.items():
            if col not in artifact_cols:
                conn.execute(f"ALTER TABLE artifacts ADD COLUMN {col} {col_type};")

        # Connector credentials migration: updated_at
        existing_tables = [t[0] for t in conn.execute("SELECT name FROM sqlite_master WHERE type='table'").fetchall()]
        if "connector_credentials" in existing_tables:
            cc_cols = [r["name"] for r in conn.execute("PRAGMA table_info(connector_credentials)").fetchall()]
            if "updated_at" not in cc_cols:
                conn.execute("ALTER TABLE connector_credentials ADD COLUMN updated_at TEXT;")

    conn.close()

def get_active_project():
    conn = get_db()
    row = conn.execute("SELECT * FROM projects WHERE is_active = 1 LIMIT 1").fetchone()
    if not row:
        row = conn.execute("SELECT * FROM projects ORDER BY created_at ASC LIMIT 1").fetchone()
    conn.close()
    return dict(row) if row else None

def reset_database(clear_credentials: bool = False, clear_users: bool = False):
    """
    Safely and transactionally deletes application data in strict dependency order,
    resets auto-increment counters, and verifies referential integrity.
    Preserves database schema and table definitions.
    By default preserves registered user accounts and sessions unless clear_users=True.
    """
    conn = get_db()
    cleared_tables = [
        "knowledge_freshness_alerts",
        "knowledge_drift_alerts",
        "risk_snapshots",
        "landmines",
        "connector_sync_targets",
        "chat_messages",
        "who_to_ask",
        "open_loops",
        "onboarding_tasks",
        "handover_packages",
        "decisions",
        "interview_answers",
        "interview_questions",
        "graph_edges",
        "contributions",
        "artifacts",
        "commits",
        "ingestion_jobs",
        "team_members",
        "repositories",
        "projects",
        "connectors",
    ]
    if clear_credentials:
        cleared_tables.extend(["github_credentials", "connector_credentials"])
    if clear_users:
        cleared_tables = ["password_reset_tokens", "user_sessions", "workspace_memberships", "users"] + cleared_tables

    try:
        with conn:
            for table in cleared_tables:
                conn.execute(f"DELETE FROM {table};")
            conn.execute("DELETE FROM sqlite_sequence;")

            # Verify referential integrity
            fk_violations = conn.execute("PRAGMA foreign_key_check;").fetchall()
            if fk_violations:
                raise RuntimeError(f"Foreign key integrity violation during reset: {fk_violations}")
        return {
            "status": "success",
            "message": "Database successfully reset to clean slate",
            "cleared_tables": cleared_tables,
            "sequences_reset": True,
        }
    finally:
        conn.close()
