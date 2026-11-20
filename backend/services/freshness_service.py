"""
Echo Knowledge Freshness Monitor Service
Tracks when knowledge records (decisions, landmines, documentation) were last verified.
Continuously compares knowledge records with recent GitHub commits and pull requests
to detect implementation drift, outdated limits/rules, and flag records needing re-verification.
"""

import os
import re
import uuid
from datetime import datetime, timezone
from typing import Optional, Dict, Any, List

from database import get_db

def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()

def extract_numbers_and_keywords(text: str) -> Dict[str, Any]:
    """
    Extracts numerical parameters, limits, timeouts, and contextual keywords from text.
    Examples:
      'retry limit is 7' -> {'retry': 7}
      'update retry backoff interval to 5s' -> {'retry': 5, 'backoff': 5}
    """
    if not text:
        return {"numbers": [], "param_map": {}}

    lower = text.lower()
    numbers = [int(n) for n in re.findall(r"\b\d+\b", lower)]

    param_map = {}
    # Pattern 1: key word followed within 3 words by a number
    patterns = [
        r"(?:retry|retries|attempts?|backoff|limit|timeout|interval|threshold|ttl|workers|batch_size)\b(?:[^\w\d]{1,15}\b\w+\b){0,3}[^\w\d]{1,10}(\d+)",
        r"(\d+)\s*(?:s|ms|sec|seconds?|times?|attempts?|retries)\b"
    ]

    for p in patterns:
        for m in re.finditer(p, lower):
            num = int(m.group(1))
            # Find closest preceding keyword
            snippet = lower[max(0, m.start() - 30):m.end()]
            for kw in ["retry", "retries", "attempt", "backoff", "limit", "timeout", "interval", "ttl", "threshold"]:
                if kw in snippet:
                    canonical = "retry_limit" if kw in ["retry", "retries", "attempt", "limit"] else kw
                    param_map[canonical] = num

    return {
        "numbers": numbers,
        "param_map": param_map
    }

def detect_freshness_drift(project_id: str) -> List[Dict[str, Any]]:
    """
    Compares all knowledge records for the project against recent commits & PRs.
    Flags records that may no longer match the current implementation.
    """
    if not project_id:
        return []

    conn = get_db()
    now = _now_iso()

    # 1. Fetch recent commits
    commits = conn.execute("""
        SELECT * FROM commits
        WHERE project_id = ?
        ORDER BY committed_at DESC
        LIMIT 50
    """, (project_id,)).fetchall()
    commit_list = [dict(c) for c in commits]

    # 2. Fetch decisions
    decision_rows = conn.execute("""
        SELECT d.*, a.title as artifact_title, a.path as artifact_path
        FROM decisions d
        LEFT JOIN artifacts a ON d.artifact_id = a.id
        WHERE d.project_id = ?
    """, (project_id,)).fetchall()
    decisions = [dict(d) for d in decision_rows]

    # 3. Fetch landmines
    landmine_rows = conn.execute("""
        SELECT l.*, a.title as artifact_title, a.path as artifact_path
        FROM landmines l
        LEFT JOIN artifacts a ON l.artifact_id = a.id
        WHERE l.project_id = ?
    """, (project_id,)).fetchall()
    landmines = [dict(l) for l in landmine_rows]

    # 4. Fetch PR / Documentation artifacts
    doc_rows = conn.execute("""
        SELECT * FROM artifacts
        WHERE project_id = ? AND (type = 'pull_request' OR type = 'document' OR is_planted_gap = 1)
    """, (project_id,)).fetchall()
    doc_artifacts = [dict(d) for d in doc_rows]

    # Retrieve existing unresolved freshness alerts
    existing_alerts = conn.execute("""
        SELECT record_type, record_id, contradicting_commit_id
        FROM knowledge_freshness_alerts
        WHERE project_id = ? AND is_resolved = 0
    """, (project_id,)).fetchall()
    existing_alert_keys = {(r["record_type"], str(r["record_id"]), str(r["contradicting_commit_id"])) for r in existing_alerts}

    new_alerts = []

    # Helper: Check record against commits
    def evaluate_record(record_type: str, record_id: str, title: str, statement: str, artifact_id: str, art_path: str, last_verified: Optional[str]):
        rec_parsed = extract_numbers_and_keywords(statement)

        for c in commit_list:
            c_msg = c.get("message", "")
            c_sha = c.get("id", "")
            c_author = c.get("author_name", "Contributor")
            c_date = c.get("committed_at", now)
            c_parsed = extract_numbers_and_keywords(c_msg)

            # Check for conflict conditions:
            conflict_detected = False
            mismatch_detail = ""

            # Check A: Parameter value divergence (e.g. doc says 7 retries, commit says 5 or 5s)
            common_params = set(rec_parsed["param_map"].keys()) & set(c_parsed["param_map"].keys())
            for param in common_params:
                doc_val = rec_parsed["param_map"][param]
                commit_val = c_parsed["param_map"][param]
                if doc_val != commit_val:
                    conflict_detected = True
                    mismatch_detail = (
                        f"Documented {param.replace('_', ' ')} is {doc_val}, but recent commit "
                        f"'{c_msg}' sets it to {commit_val} (committed by {c_author})."
                    )
                    break

            # Check B: Fallback check on numbers when sharing strong keywords (e.g., retry / payments)
            if not conflict_detected and rec_parsed["numbers"] and c_parsed["numbers"]:
                has_shared_kw = any(k in statement.lower() and k in c_msg.lower() for k in ["retry", "timeout", "interval", "backoff", "limit", "payment", "sync", "cache"])
                if has_shared_kw:
                    doc_num = rec_parsed["numbers"][0]
                    com_num = c_parsed["numbers"][0]
                    if doc_num != com_num:
                        conflict_detected = True
                        mismatch_detail = (
                            f"Documented limit/value is {doc_num}, but recent commit "
                            f"'{c_msg}' specifies {com_num}."
                        )

            # Check C: Related file updated after last_verified_at with refactor/breaking keywords
            if not conflict_detected and last_verified and c_date > last_verified:
                art_tag = (artifact_id or "").lower()
                path_tag = os.path.basename(art_path or "").lower().replace(".py", "").replace(".js", "")
                if path_tag and path_tag in c_msg.lower():
                    if any(w in c_msg.lower() for w in ["refactor", "breaking", "remove", "replace", "deprecate", "update"]):
                        conflict_detected = True
                        mismatch_detail = (
                            f"Implementation modified in commit '{c_msg}' after this record was verified "
                            f"on {last_verified[:10]}. Logic may have diverged."
                        )

            if conflict_detected:
                alert_key = (record_type, str(record_id), str(c_sha))
                alert_id = f"FRESH-{uuid.uuid4().hex[:6].upper()}"

                if alert_key not in existing_alert_keys:
                    conn.execute("""
                        INSERT INTO knowledge_freshness_alerts
                        (id, project_id, record_type, record_id, artifact_id, title, documented_statement,
                         contradicting_commit_id, contradicting_message, contradicting_author,
                         mismatch_details, severity, is_resolved, created_at)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'warning', 0, ?)
                    """, (
                        alert_id, project_id, record_type, str(record_id), artifact_id, title,
                        statement, c_sha, c_msg, c_author, mismatch_detail, now
                    ))

                    # Update record's freshness status in its own table
                    if record_type == "decision":
                        conn.execute("""
                            UPDATE decisions
                            SET freshness_status = 'needs_reverification',
                                mismatch_reason = ?,
                                contradicting_commit_id = ?
                            WHERE id = ?
                        """, (mismatch_detail, c_sha, record_id))
                    elif record_type == "landmine":
                        conn.execute("""
                            UPDATE landmines
                            SET freshness_status = 'needs_reverification',
                                mismatch_reason = ?,
                                contradicting_commit_id = ?
                            WHERE id = ?
                        """, (mismatch_detail, c_sha, record_id))

                    new_alerts.append({
                        "id": alert_id,
                        "record_type": record_type,
                        "record_id": record_id,
                        "title": title,
                        "documented_statement": statement,
                        "contradicting_commit_id": c_sha,
                        "contradicting_message": c_msg,
                        "contradicting_author": c_author,
                        "mismatch_details": mismatch_detail,
                        "severity": "warning",
                        "created_at": now
                    })
                break  # Alert on first major contradiction

    # 1. Evaluate Decisions
    for d in decisions:
        stmt = f"{d.get('decision', '')} Rationale: {d.get('rationale', '')}"
        evaluate_record(
            record_type="decision",
            record_id=str(d.get("id")),
            title=d.get("decision", "Architecture Decision"),
            statement=stmt,
            artifact_id=d.get("artifact_id", ""),
            art_path=d.get("artifact_path", ""),
            last_verified=d.get("last_verified_at") or d.get("reviewed_at")
        )

    # 2. Evaluate Landmines
    for l in landmines:
        stmt = f"{l.get('title', '')} — {l.get('description', '')}. Recovery: {l.get('how_to_recover', '')}"
        evaluate_record(
            record_type="landmine",
            record_id=str(l.get("id")),
            title=l.get("title", "Gotcha / Landmine"),
            statement=stmt,
            artifact_id=l.get("artifact_id", ""),
            art_path=l.get("artifact_path", ""),
            last_verified=l.get("last_verified_at") or l.get("reviewed_at")
        )

    # 3. Evaluate Documented PRs / Planted gaps
    for doc in doc_artifacts:
        evaluate_record(
            record_type="doc",
            record_id=str(doc.get("id")),
            title=doc.get("title", "Documentation Record"),
            statement=f"{doc.get('title', '')} ({doc.get('path', '')})",
            artifact_id=doc.get("id", ""),
            art_path=doc.get("path", ""),
            last_verified=doc.get("created_at")
        )

    conn.commit()
    conn.close()
    return new_alerts

def track_verification(record_type: str, record_id: str, verifier_name: Optional[str] = None) -> Dict[str, Any]:
    """
    Marks a knowledge record as re-verified by reviewer or lead,
    resets freshness flags, updates verification timestamp, and resolves related alerts.
    """
    conn = get_db()
    now = _now_iso()
    verifier = verifier_name or "Lead Reviewer"

    with conn:
        if record_type == "decision":
            conn.execute("""
                UPDATE decisions
                SET last_verified_at = ?,
                    last_verified_by = ?,
                    freshness_status = 'fresh',
                    mismatch_reason = NULL,
                    contradicting_commit_id = NULL
                WHERE id = ?
            """, (now, verifier, record_id))
        elif record_type == "landmine":
            conn.execute("""
                UPDATE landmines
                SET last_verified_at = ?,
                    last_verified_by = ?,
                    freshness_status = 'fresh',
                    mismatch_reason = NULL,
                    contradicting_commit_id = NULL
                WHERE id = ?
            """, (now, verifier, record_id))
        elif record_type == "doc":
            conn.execute("""
                UPDATE artifacts
                SET updated_at = ?
                WHERE id = ?
            """, (now, record_id))

        # Resolve associated freshness alerts
        conn.execute("""
            UPDATE knowledge_freshness_alerts
            SET is_resolved = 1,
                resolved_at = ?,
                resolved_by = ?
            WHERE record_type = ? AND record_id = ?
        """, (now, verifier, record_type, str(record_id)))

    conn.close()
    return {
        "status": "verified",
        "record_type": record_type,
        "record_id": record_id,
        "last_verified_at": now,
        "last_verified_by": verifier,
        "freshness_status": "fresh"
    }

def dismiss_freshness_alert(alert_id: str, dismissed_by: Optional[str] = None) -> bool:
    """Marks a freshness alert as dismissed without modifying the underlying record."""
    conn = get_db()
    now = _now_iso()
    user = dismissed_by or "Lead Reviewer"
    with conn:
        conn.execute("""
            UPDATE knowledge_freshness_alerts
            SET is_resolved = 1,
                resolved_at = ?,
                resolved_by = ?
            WHERE id = ?
        """, (now, user, alert_id))
    conn.close()
    return True

def get_freshness_overview(project_id: str) -> Dict[str, Any]:
    """Retrieves high-level summary statistics for the Knowledge Freshness Monitor."""
    conn = get_db()

    # Total decisions & landmines
    dec_rows = conn.execute("SELECT id, freshness_status, last_verified_at FROM decisions WHERE project_id = ?", (project_id,)).fetchall()
    mine_rows = conn.execute("SELECT id, freshness_status, last_verified_at FROM landmines WHERE project_id = ?", (project_id,)).fetchall()

    all_records = [dict(r) for r in dec_rows] + [dict(r) for r in mine_rows]
    total_records = len(all_records)

    needs_review = [r for r in all_records if r.get("freshness_status") == "needs_reverification"]
    fresh_count = total_records - len(needs_review)
    freshness_pct = round((fresh_count / total_records * 100), 1) if total_records > 0 else 100.0

    # Active alerts
    alert_rows = conn.execute("""
        SELECT COUNT(*) as c FROM knowledge_freshness_alerts
        WHERE project_id = ? AND is_resolved = 0
    """, (project_id,)).fetchone()
    open_alerts = alert_rows["c"] if alert_rows else 0

    latest_alert = conn.execute("""
        SELECT created_at FROM knowledge_freshness_alerts
        WHERE project_id = ?
        ORDER BY created_at DESC LIMIT 1
    """, (project_id,)).fetchone()

    conn.close()
    return {
        "project_id": project_id,
        "total_monitored_records": total_records,
        "fresh_records_count": fresh_count,
        "needs_reverification_count": len(needs_review),
        "open_alerts_count": open_alerts,
        "freshness_health_score": freshness_pct,
        "last_monitored_at": latest_alert["created_at"] if latest_alert else _now_iso(),
        "status": "healthy" if len(needs_review) == 0 else "action_required"
    }

def get_freshness_alerts(project_id: str, include_resolved: bool = False) -> List[Dict[str, Any]]:
    """Retrieves all freshness drift alerts for the project."""
    conn = get_db()
    if include_resolved:
        rows = conn.execute("""
            SELECT a.*, art.title as artifact_name
            FROM knowledge_freshness_alerts a
            LEFT JOIN artifacts art ON a.artifact_id = art.id
            WHERE a.project_id = ?
            ORDER BY a.created_at DESC
        """, (project_id,)).fetchall()
    else:
        rows = conn.execute("""
            SELECT a.*, art.title as artifact_name
            FROM knowledge_freshness_alerts a
            LEFT JOIN artifacts art ON a.artifact_id = art.id
            WHERE a.project_id = ? AND a.is_resolved = 0
            ORDER BY a.created_at DESC
        """, (project_id,)).fetchall()
    conn.close()
    return [dict(r) for r in rows]

def get_freshness_records(project_id: str) -> List[Dict[str, Any]]:
    """Retrieves all knowledge records with their freshness and verification status."""
    conn = get_db()
    dec_rows = conn.execute("""
        SELECT d.id, d.artifact_id, d.decision as title, d.rationale as details,
               d.last_verified_at, d.last_verified_by, d.freshness_status,
               d.mismatch_reason, d.contradicting_commit_id, d.created_at,
               'decision' as record_type, a.title as artifact_title, a.path as artifact_path
        FROM decisions d
        LEFT JOIN artifacts a ON d.artifact_id = a.id
        WHERE d.project_id = ?
        ORDER BY d.created_at DESC
    """, (project_id,)).fetchall()

    mine_rows = conn.execute("""
        SELECT l.id, l.artifact_id, l.title, (l.description || ' ' || coalesce(l.symptom, '')) as details,
               l.last_verified_at, l.last_verified_by, l.freshness_status,
               l.mismatch_reason, l.contradicting_commit_id, l.created_at,
               'landmine' as record_type, a.title as artifact_title, a.path as artifact_path
        FROM landmines l
        LEFT JOIN artifacts a ON l.artifact_id = a.id
        WHERE l.project_id = ?
        ORDER BY l.created_at DESC
    """, (project_id,)).fetchall()

    conn.close()
    return [dict(r) for r in dec_rows] + [dict(r) for r in mine_rows]

