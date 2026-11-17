"""
Echo Continuous Monitoring & Knowledge Drift Detection Service
Re-scans repositories on new commits, detects knowledge drift (stale code,
spikes in ownership concentration / bus factor drops), and processes webhooks.
"""

import os
import uuid
from datetime import datetime, timezone
from typing import Optional, Dict, Any, List

from database import get_db
from services.risk_engine import calculate_project_risk

def detect_knowledge_drift(project_id: str) -> List[Dict[str, Any]]:
    """
    Evaluates repository artifacts against knowledge staleness thresholds
    and ownership concentration shifts. Creates structured alerts in SQLite.
    """
    if not project_id:
        return []

    conn = get_db()
    now = datetime.now(timezone.utc).isoformat()
    risk_data = calculate_project_risk(project_id)
    artifacts = risk_data.get("artifacts", [])

    # Record risk snapshot
    avg_risk = sum(a["risk_score"] for a in artifacts) / len(artifacts) if artifacts else 0.0
    conn.execute("""
        INSERT INTO risk_snapshots
        (project_id, snapshot_date, high_risk_count, bus_factor_violations_count, avg_risk_score, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
    """, (
        project_id, now[:10], risk_data.get("high_risk_count", 0),
        len(risk_data.get("bus_factor_violations", [])), round(avg_risk, 3), now
    ))

    # Retrieve raw artifacts for recency and repo info
    art_rows = conn.execute("SELECT * FROM artifacts WHERE project_id = ?", (project_id,)).fetchall()
    art_map = {r["id"]: dict(r) for r in art_rows}

    # Retrieve existing unresolved alerts to prevent duplicate spam
    existing_alerts = conn.execute("""
        SELECT artifact_id, alert_type FROM knowledge_drift_alerts
        WHERE project_id = ? AND is_resolved = 0
    """, (project_id,)).fetchall()
    existing_set = {(r["artifact_id"], r["alert_type"]) for r in existing_alerts}

    new_alerts = []

    for a in artifacts:
        art_id = a["artifact_id"]
        raw = art_map.get(art_id, {})
        days_since = raw.get("days_since_touch", 0)
        doc_coverage = raw.get("doc_coverage", 0.0)
        criticality = raw.get("criticality", 3)
        oc = a["components"]["ownership_concentration"]
        bus_factor = a["bus_factor_one"]
        repo = raw.get("repo") or "repository"
        repo_id = raw.get("repo_id")

        # 1. Stale Knowledge Detection
        # Code untouched for 45+ days with high criticality and low doc coverage
        if days_since >= 45 and doc_coverage <= 0.4 and criticality >= 3:
            alert_type = "stale_knowledge"
            if (art_id, alert_type) not in existing_set:
                severity = "critical" if days_since >= 90 else "warning"
                msg = f"Knowledge in '{a['title']}' has gone stale ({days_since} days since last touch, {int((1-doc_coverage)*100)}% undocumented). High risk of uncaptured tacit drift."
                alert_id = f"DRIFT-{uuid.uuid4().hex[:6].upper()}"

                conn.execute("""
                    INSERT INTO knowledge_drift_alerts
                    (id, project_id, repo_id, artifact_id, alert_type, severity, message, previous_value, current_value, is_resolved, created_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?)
                """, (
                    alert_id, project_id, repo_id, art_id, alert_type,
                    severity, msg, float(days_since - 15), float(days_since), now
                ))

                new_alerts.append({
                    "id": alert_id,
                    "artifact_id": art_id,
                    "repo": repo,
                    "alert_type": alert_type,
                    "severity": severity,
                    "message": msg
                })

        # 2. Newly Concentrated Knowledge Detection
        # Ownership concentration jumped to 80%+ on critical modules
        if bus_factor and oc >= 0.8:
            alert_type = "newly_concentrated"
            if (art_id, alert_type) not in existing_set:
                severity = "critical"
                msg = f"Knowledge newly concentrated in '{a['title']}' (Ownership Concentration {int(oc*100)}%). Sole point of failure detected."
                alert_id = f"DRIFT-{uuid.uuid4().hex[:6].upper()}"

                conn.execute("""
                    INSERT INTO knowledge_drift_alerts
                    (id, project_id, repo_id, artifact_id, alert_type, severity, message, previous_value, current_value, is_resolved, created_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, 0.50, ?, 0, ?)
                """, (
                    alert_id, project_id, repo_id, art_id, alert_type,
                    severity, msg, float(oc), now
                ))

                new_alerts.append({
                    "id": alert_id,
                    "artifact_id": art_id,
                    "repo": repo,
                    "alert_type": alert_type,
                    "severity": severity,
                    "message": msg
                })

    conn.commit()
    conn.close()
    return new_alerts

def get_drift_alerts(project_id: str, include_resolved: bool = False) -> List[Dict[str, Any]]:
    """Retrieves all drift alerts for a project."""
    conn = get_db()
    if include_resolved:
        rows = conn.execute("""
            SELECT a.*, art.title as artifact_title, art.type as artifact_type, art.repo as repo_name
            FROM knowledge_drift_alerts a
            LEFT JOIN artifacts art ON a.artifact_id = art.id
            WHERE a.project_id = ?
            ORDER BY a.created_at DESC
        """, (project_id,)).fetchall()
    else:
        rows = conn.execute("""
            SELECT a.*, art.title as artifact_title, art.type as artifact_type, art.repo as repo_name
            FROM knowledge_drift_alerts a
            LEFT JOIN artifacts art ON a.artifact_id = art.id
            WHERE a.project_id = ? AND a.is_resolved = 0
            ORDER BY a.created_at DESC
        """, (project_id,)).fetchall()
    conn.close()
    return [dict(r) for r in rows]

def resolve_drift_alert(alert_id: str) -> bool:
    """Marks a drift alert as resolved."""
    conn = get_db()
    with conn:
        conn.execute("UPDATE knowledge_drift_alerts SET is_resolved = 1 WHERE id = ?", (alert_id,))
    conn.close()
    return True

def process_github_push_webhook(project_id: str, payload: Dict[str, Any]) -> Dict[str, Any]:
    """
    Processes incoming GitHub push webhook:
    1. Extracts pushed commits and modified files.
    2. Updates recency (days_since_touch -> 0) and author touches.
    3. Triggers drift detection.
    """
    commits = payload.get("commits", [])
    repository = payload.get("repository", {})
    repo_name = repository.get("name", "live-repo")

    now = datetime.now(timezone.utc).isoformat()
    conn = get_db()

    updated_artifacts = 0
    with conn:
        for c in commits:
            author_info = c.get("author", {})
            author_name = author_info.get("name") or author_info.get("username", "Unknown")
            author_email = author_info.get("email", "")
            sha = c.get("id") or str(uuid.uuid4())
            msg = c.get("message", "")

            # Log commit
            conn.execute("""
                INSERT OR REPLACE INTO commits
                (id, project_id, repo_id, author_name, author_email, committed_at, message, files_changed_count)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                sha, project_id, f"repo-{repo_name.lower()}", author_name,
                author_email, now, msg, len(c.get("modified", [])) + len(c.get("added", []))
            ))

            # Update touched files
            all_files = c.get("modified", []) + c.get("added", [])
            for f in all_files:
                # Find matching artifact
                matching = conn.execute(
                    "SELECT id FROM artifacts WHERE project_id = ? AND (path LIKE ? OR title LIKE ?)",
                    (project_id, f"%{f}%", f"%{f}%")
                ).fetchall()

                for m in matching:
                    art_id = m["id"]
                    # Reset days since touch to 0
                    conn.execute("UPDATE artifacts SET days_since_touch = 0 WHERE id = ?", (art_id,))

                    # Increment contribution for author
                    member_id = author_name.lower().replace(" ", "_")
                    conn.execute("""
                        INSERT OR IGNORE INTO team_members (id, project_id, name, email, role)
                        VALUES (?, ?, ?, ?, 'Contributor')
                    """, (member_id, project_id, author_name, author_email))

                    cur = conn.execute("SELECT count FROM contributions WHERE artifact_id = ? AND person_id = ?", (art_id, member_id)).fetchone()
                    if cur:
                        conn.execute("UPDATE contributions SET count = count + 1 WHERE artifact_id = ? AND person_id = ?", (art_id, member_id))
                    else:
                        conn.execute("INSERT INTO contributions (artifact_id, person_id, count) VALUES (?, ?, 1)", (art_id, member_id))

                    updated_artifacts += 1

    conn.close()

    # Re-evaluate knowledge drift
    drift_alerts = detect_knowledge_drift(project_id)

    return {
        "status": "processed",
        "commits_processed": len(commits),
        "artifacts_updated": updated_artifacts,
        "new_drift_alerts_count": len(drift_alerts)
    }
