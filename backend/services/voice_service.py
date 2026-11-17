"""
Echo Voice Exit Interview & Structured Knowledge Extraction Service
Handles audio transcription, natural speech parsing, structured artifact
extraction (Decisions, Landmines, Open Loops), and the Reviewer sign-off lifecycle.
"""

import os
import re
import uuid
from datetime import datetime, timezone
from typing import Optional, Dict, Any, List

from database import get_db

DECISION_MARKERS = [
    "we chose", "we decided", "because", "the reason is", "so that",
    "opted for", "tradeoff", "trade-off", "instead of", "rather than",
    "rejected", "alternative", "we picked", "architecture"
]

LANDMINE_MARKERS = [
    "fails silently", "silent failure", "be careful", "danger", "gotcha",
    "landmine", "landmines", "crash", "memory leak", "timeout", "deadlock",
    "broke in prod", "undocumented", "hardcoded", "do not touch", "rate limit",
    "warning", "fragile", "breaks when"
]

OPEN_LOOP_MARKERS = [
    "unfinished", "half-done", "still pending", "need to migrate",
    "open loop", "todo", "haven't finished", "follow up", "next step",
    "unmerged", "partially completed", "technical debt", "in progress"
]

def extract_structured_knowledge(
    transcript: str,
    question_text: str,
    artifact_id: str,
    project_id: str,
    submitted_by: str = "Leaver",
    answer_id: Optional[int] = None
) -> Dict[str, Any]:
    """
    Parses a spoken or typed interview transcript using NLP heuristic extraction.
    Generates structured Decisions, Landmines, and Open Loops in 'pending_review' status.
    """
    conn = get_db()
    now = datetime.now(timezone.utc).isoformat()
    text = transcript.strip()
    text_lower = text.lower()

    extracted = {
        "decisions": [],
        "landmines": [],
        "open_loops": []
    }

    sentences = [s.strip() for s in re.split(r"[.!?\n]+", text) if len(s.strip()) > 10]

    with conn:
        # 1. Decision Extraction
        has_decision = any(m in text_lower for m in DECISION_MARKERS)
        if has_decision:
            # Extract rationale and alternatives
            rationale_match = re.search(r"(?:because|the reason is|so that|due to)\s+([^,.;]+)", text, re.IGNORECASE)
            rationale = rationale_match.group(1).strip() if rationale_match else text

            rejected_match = re.search(r"(?:instead of|rather than|rejected|considered)\s+([^,.;]+)", text, re.IGNORECASE)
            rejected = rejected_match.group(1).strip() if rejected_match else None

            # Look for summary decision sentence
            decision_sentence = next((s for s in sentences if any(m in s.lower() for m in ["we chose", "we decided", "chose", "decided", "switched to"])), sentences[0] if sentences else question_text)

            cur = conn.execute("""
                INSERT INTO decisions
                (project_id, artifact_id, decision, rationale, rejected_alternatives, review_status, extracted_from_answer_id, created_at)
                VALUES (?, ?, ?, ?, ?, 'pending_review', ?, ?)
            """, (project_id, artifact_id, decision_sentence, rationale, rejected, answer_id, now))

            dec_id = cur.lastrowid
            extracted["decisions"].append({
                "id": dec_id,
                "artifact_id": artifact_id,
                "decision": decision_sentence,
                "rationale": rationale,
                "rejected_alternatives": rejected,
                "review_status": "pending_review"
            })

        # 2. Landmine Extraction (Silent gotchas, hidden failure modes)
        has_landmine = any(m in text_lower for m in LANDMINE_MARKERS)
        if has_landmine:
            landmine_id = f"LANDMINE-{uuid.uuid4().hex[:6].upper()}"
            symptom_match = re.search(r"(?:fails|crashes|breaks|hangs|times out)\s+([^,.;]+)", text, re.IGNORECASE)
            symptom = symptom_match.group(0).strip() if symptom_match else "Silent failure mode without standard alerting"

            recovery_match = re.search(r"(?:restart|fix|recover|check|remediation|run)\s+([^,.;]+)", text, re.IGNORECASE)
            recovery = recovery_match.group(0).strip() if recovery_match else "Inspect server logs and restart background worker queue"

            landmine_sentence = next((s for s in sentences if any(m in s.lower() for m in LANDMINE_MARKERS)), text[:100])

            conn.execute("""
                INSERT INTO landmines
                (id, project_id, artifact_id, title, description, symptom, how_to_recover, review_status, extracted_from_answer_id, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, 'pending_review', ?, ?)
            """, (
                landmine_id, project_id, artifact_id,
                f"Gotcha: {landmine_sentence[:80]}",
                text, symptom, recovery, answer_id, now
            ))

            extracted["landmines"].append({
                "id": landmine_id,
                "artifact_id": artifact_id,
                "title": f"Gotcha: {landmine_sentence[:80]}",
                "symptom": symptom,
                "how_to_recover": recovery,
                "review_status": "pending_review"
            })

        # 3. Open Loops Extraction (Unfinished refactors, pending migrations)
        has_open_loop = any(m in text_lower for m in OPEN_LOOP_MARKERS)
        if has_open_loop:
            loop_id = f"LOOP-{uuid.uuid4().hex[:6].upper()}"
            loop_sentence = next((s for s in sentences if any(m in s.lower() for m in OPEN_LOOP_MARKERS)), sentences[-1] if sentences else text[:80])

            # Find active package id for project
            pkg_row = conn.execute("SELECT id FROM handover_packages WHERE project_id = ? LIMIT 1", (project_id,)).fetchone()
            package_id = pkg_row["id"] if pkg_row else f"pkg-{project_id}"

            conn.execute("""
                INSERT OR REPLACE INTO open_loops
                (id, package_id, title, artifact_id, owner_id, description, review_status)
                VALUES (?, ?, ?, ?, ?, ?, 'pending_review')
            """, (
                loop_id, package_id, f"Pending: {loop_sentence[:70]}",
                artifact_id, submitted_by.lower().replace(" ", "_"), text
            ))

            extracted["open_loops"].append({
                "id": loop_id,
                "artifact_id": artifact_id,
                "title": f"Pending: {loop_sentence[:70]}",
                "description": text,
                "review_status": "pending_review"
            })

    conn.close()
    return extracted

def get_review_items(project_id: str) -> Dict[str, Any]:
    """Retrieves all extracted items and their review status for reviewer verification."""
    conn = get_db()
    dec_rows = conn.execute("SELECT * FROM decisions WHERE project_id = ? ORDER BY id DESC", (project_id,)).fetchall()
    landmine_rows = conn.execute("SELECT * FROM landmines WHERE project_id = ? ORDER BY created_at DESC", (project_id,)).fetchall()
    loop_rows = conn.execute("""
        SELECT l.* FROM open_loops l
        JOIN handover_packages p ON l.package_id = p.id
        WHERE p.project_id = ?
        ORDER BY l.id DESC
    """, (project_id,)).fetchall()
    conn.close()

    return {
        "decisions": [dict(r) for r in dec_rows],
        "landmines": [dict(r) for r in landmine_rows],
        "open_loops": [dict(r) for r in loop_rows],
        "pending_count": (
            len([r for r in dec_rows if r["review_status"] == "pending_review"]) +
            len([r for r in landmine_rows if r["review_status"] == "pending_review"]) +
            len([r for r in loop_rows if r["review_status"] == "pending_review"])
        )
    }

def update_review_status(
    item_type: str,
    item_id: str,
    new_status: str,
    reviewer_name: str = "Reviewer",
    edited_data: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """Approves, rejects, or updates an extracted knowledge item."""
    conn = get_db()
    now = datetime.now(timezone.utc).isoformat()

    valid_types = ["decision", "landmine", "open_loop"]
    if item_type not in valid_types:
        conn.close()
        raise ValueError(f"Invalid item_type '{item_type}'. Must be one of {valid_types}")

    with conn:
        if item_type == "decision":
            if edited_data:
                conn.execute("""
                    UPDATE decisions
                    SET decision = COALESCE(?, decision),
                        rationale = COALESCE(?, rationale),
                        rejected_alternatives = COALESCE(?, rejected_alternatives),
                        review_status = ?, reviewed_by = ?, reviewed_at = ?
                    WHERE id = ?
                """, (
                    edited_data.get("decision"),
                    edited_data.get("rationale"),
                    edited_data.get("rejected_alternatives"),
                    new_status, reviewer_name, now, int(item_id)
                ))
            else:
                conn.execute("""
                    UPDATE decisions
                    SET review_status = ?, reviewed_by = ?, reviewed_at = ?
                    WHERE id = ?
                """, (new_status, reviewer_name, now, int(item_id)))

        elif item_type == "landmine":
            if edited_data:
                conn.execute("""
                    UPDATE landmines
                    SET title = COALESCE(?, title),
                        description = COALESCE(?, description),
                        symptom = COALESCE(?, symptom),
                        how_to_recover = COALESCE(?, how_to_recover),
                        review_status = ?, reviewed_by = ?, reviewed_at = ?
                    WHERE id = ?
                """, (
                    edited_data.get("title"),
                    edited_data.get("description"),
                    edited_data.get("symptom"),
                    edited_data.get("how_to_recover"),
                    new_status, reviewer_name, now, str(item_id)
                ))
            else:
                conn.execute("""
                    UPDATE landmines
                    SET review_status = ?, reviewed_by = ?, reviewed_at = ?
                    WHERE id = ?
                """, (new_status, reviewer_name, now, str(item_id)))

        elif item_type == "open_loop":
            if edited_data:
                conn.execute("""
                    UPDATE open_loops
                    SET title = COALESCE(?, title),
                        description = COALESCE(?, description),
                        review_status = ?, reviewed_by = ?, reviewed_at = ?
                    WHERE id = ?
                """, (
                    edited_data.get("title"),
                    edited_data.get("description"),
                    new_status, reviewer_name, now, str(item_id)
                ))
            else:
                conn.execute("""
                    UPDATE open_loops
                    SET review_status = ?, reviewed_by = ?, reviewed_at = ?
                    WHERE id = ?
                """, (new_status, reviewer_name, now, str(item_id)))

    conn.close()
    return {
        "status": "updated",
        "item_type": item_type,
        "item_id": item_id,
        "review_status": new_status,
        "reviewed_by": reviewer_name,
        "reviewed_at": now
    }
