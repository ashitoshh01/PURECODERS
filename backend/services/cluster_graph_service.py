"""
Echo Clustered Architecture & Knowledge Risk Graph Service
Generates domain-clustered dependency graphs for system architecture visualization,
supporting both the reference mainframe CardDemo architecture and live workspace codebases.
"""

from typing import Dict, Any, List, Optional
import os
import re
from datetime import datetime, timezone
from database import get_db
from services.risk_engine import calculate_project_risk

def build_carddemo_dataset() -> Dict[str, Any]:
    """
    Returns the high-fidelity CardDemo architecture knowledge graph
    matching the AWS Blu Age / IBM CardDemo reference architecture shown in the reference photo.
    """
    system_name = "CardDemo"
    description = "AWS Blu Age / IBM CardDemo Mainframe Modernization Knowledge & Tacit Risk Graph"

    clusters = [
        {
            "id": "data_stores",
            "name": "Data stores",
            "description": "Central VSAM KSDS/ESDS data sets, DB2 tables, and sequential files",
            "color": "#059669", # Rich Dark Emerald Green
            "border_color": "#047857",
            "category": "storage",
        },
        {
            "id": "acct_cust",
            "name": "Account & Customer Mgmt",
            "description": "CICS online transactions for customer profiles, account balances, and updates",
            "color": "#0284C7", # Rich Ocean Blue
            "border_color": "#0369A1",
            "category": "online",
        },
        {
            "id": "card_mgmt",
            "name": "Card Mgmt",
            "description": "Credit card lifecycle, issuance, updates, and cardholder search",
            "color": "#D97706", # Rich Dark Amber
            "border_color": "#B45309",
            "category": "online",
        },
        {
            "id": "txn_bill",
            "name": "Transactions & Bill...",
            "description": "Transaction processing, transaction history inquiry, and bill payment services",
            "color": "#0284C7", # Rich Dark Cyan / Blue
            "border_color": "#075985",
            "category": "online",
        },
        {
            "id": "core_batch",
            "name": "Core Batch",
            "description": "Nightly reconciliation, interest compounding, and end-of-cycle batch jobs",
            "color": "#C026D3", # Rich Deep Fuchsia / Magenta
            "border_color": "#A21CAF",
            "category": "batch",
        },
        {
            "id": "batch_infra",
            "name": "Batch Infra & Utilities",
            "description": "Common batch framework, sort routines, formatters, and environment setup",
            "color": "#7C3AED", # Rich Deep Purple / Violet
            "border_color": "#6D28D9",
            "category": "batch_utility",
        },
        {
            "id": "db2_ext",
            "name": "Db2 Extension (Txn Types...)",
            "description": "Db2 relational store extensions for custom transaction types and category rules",
            "color": "#0369A1", # Rich Deep Ocean Blue
            "border_color": "#0C4A6E",
            "category": "extension",
        },
        {
            "id": "user_sec",
            "name": "User Security Admin",
            "description": "RACF / CICS user authentication, signon, access authorization, and user profiles",
            "color": "#2563EB", # Rich Royal Blue
            "border_color": "#1D4ED8",
            "category": "security",
        },
        {
            "id": "reporting",
            "name": "Reporting",
            "description": "Batch transaction reports, cardholder statements, and audit print utilities",
            "color": "#4F46E5", # Rich Deep Indigo
            "border_color": "#3730A3",
            "category": "reporting",
        },
        {
            "id": "ims_mq",
            "name": "IMS/MQ Extension (Pending ...)",
            "description": "Asynchronous messaging bridge for external payment network authorization",
            "color": "#DB2777", # Rich Dark Pink / Rose
            "border_color": "#BE185D",
            "category": "messaging",
        },
    ]

    # Node definitions
    # Programs & Components
    raw_nodes = [
        # Data stores (Green Cluster - Central Dense Region)
        {"id": "DS-CUSTDAT", "name": "CUSTDAT", "title": "CUSTDAT — Customer Master VSAM KSDS", "cluster": "data_stores", "type": "data_store", "crit": 5, "doc": 0.3, "risk": 0.42, "bus": False, "owner": "Aarav (Lead)", "oc": 0.65},
        {"id": "DS-ACCTDAT", "name": "ACCTDAT", "title": "ACCTDAT — Account Master VSAM KSDS", "cluster": "data_stores", "type": "data_store", "crit": 5, "doc": 0.25, "risk": 0.58, "bus": True, "owner": "Aarav (Lead)", "oc": 0.85},
        {"id": "DS-CARDDAT", "name": "CARDDAT", "title": "CARDDAT — Card Master Index VSAM", "cluster": "data_stores", "type": "data_store", "crit": 5, "doc": 0.35, "risk": 0.45, "bus": False, "owner": "Aarav (Lead)", "oc": 0.70},
        {"id": "DS-TRANSACT", "name": "TRANSACT", "title": "TRANSACT — Transaction History VSAM", "cluster": "data_stores", "type": "data_store", "crit": 5, "doc": 0.2, "risk": 0.62, "bus": True, "owner": "Aarav (Lead)", "oc": 0.88},
        {"id": "DS-CCXREF", "name": "CCXREF", "title": "CCXREF — Card to Account Cross Reference", "cluster": "data_stores", "type": "data_store", "crit": 4, "doc": 0.4, "risk": 0.35, "bus": False, "owner": "Priya", "oc": 0.40},
        {"id": "DS-DISCGRP", "name": "DISCGRP", "title": "DISCGRP — Disclosure Group Master", "cluster": "data_stores", "type": "data_store", "crit": 3, "doc": 0.5, "risk": 0.18, "bus": False, "owner": "Rohan", "oc": 0.30},
        {"id": "DS-SECUSER", "name": "SECUSER", "title": "SECUSER — Security User Directory", "cluster": "data_stores", "type": "data_store", "crit": 4, "doc": 0.6, "risk": 0.22, "bus": False, "owner": "Neha", "oc": 0.35},
        {"id": "DS-DB2TXN", "name": "DB2_TXN", "title": "DB2_TXN — Relational Transaction Types", "cluster": "data_stores", "type": "data_store", "crit": 4, "doc": 0.4, "risk": 0.38, "bus": False, "owner": "Aarav (Lead)", "oc": 0.75},
        {"id": "DS-DALYRECN", "name": "DALYRECN", "title": "DALYRECN — Daily Reconciliation File", "cluster": "data_stores", "type": "data_store", "crit": 4, "doc": 0.2, "risk": 0.48, "bus": True, "owner": "Aarav (Lead)", "oc": 0.82},
        {"id": "DS-TRNXFILE", "name": "TRNXFILE", "title": "TRNXFILE — Raw Transaction Feed", "cluster": "data_stores", "type": "data_store", "crit": 4, "doc": 0.3, "risk": 0.36, "bus": False, "owner": "Meera", "oc": 0.45},
        {"id": "DS-STMTFILE", "name": "STMTFILE", "title": "STMTFILE — Monthly Statement Staging", "cluster": "data_stores", "type": "data_store", "crit": 3, "doc": 0.5, "risk": 0.20, "bus": False, "owner": "Rohan", "oc": 0.35},
        {"id": "DS-XREFFILE", "name": "XREFFILE", "title": "XREFFILE — Cross Reference Backup", "cluster": "data_stores", "type": "data_store", "crit": 3, "doc": 0.6, "risk": 0.15, "bus": False, "owner": "Priya", "oc": 0.25},
        {"id": "DS-BATCHCTL", "name": "BATCHCTL", "title": "BATCHCTL — Batch Checkpoint Control File", "cluster": "data_stores", "type": "data_store", "crit": 4, "doc": 0.15, "risk": 0.55, "bus": True, "owner": "Aarav (Lead)", "oc": 0.90},
        {"id": "DS-AUDITLOG", "name": "AUDITLOG", "title": "AUDITLOG — Compliance Audit Journal", "cluster": "data_stores", "type": "data_store", "crit": 3, "doc": 0.7, "risk": 0.12, "bus": False, "owner": "Neha", "oc": 0.20},
        {"id": "DS-MQQUEUE", "name": "MQ_QUEUE", "title": "MQ_QUEUE — Inbound Authorization Queue", "cluster": "data_stores", "type": "data_store", "crit": 4, "doc": 0.2, "risk": 0.42, "bus": False, "owner": "Aarav (Lead)", "oc": 0.70},
        {"id": "DS-RATESTBL", "name": "RATES_TBL", "title": "RATES_TBL — Tiered Interest Rate Table", "cluster": "data_stores", "type": "data_store", "crit": 4, "doc": 0.3, "risk": 0.38, "bus": False, "owner": "Meera", "oc": 0.50},
        {"id": "DS-FEESTBL", "name": "FEES_TBL", "title": "FEES_TBL — Penalty & Overdraft Schedule", "cluster": "data_stores", "type": "data_store", "crit": 3, "doc": 0.4, "risk": 0.24, "bus": False, "owner": "Rohan", "oc": 0.40},
        {"id": "DS-REPTARCH", "name": "REPTARCH", "title": "REPTARCH — Report Archive GDG", "cluster": "data_stores", "type": "data_store", "crit": 2, "doc": 0.8, "risk": 0.08, "bus": False, "owner": "Priya", "oc": 0.15},

        # Account & Customer Mgmt (Prominent Blue Cluster at bottom)
        {"id": "MOD-COACTUPC", "name": "COACTUPC", "title": "COACTUPC — Account Update Screen & Logic", "cluster": "acct_cust", "type": "cics_program", "crit": 5, "doc": 0.1, "risk": 0.76, "bus": True, "owner": "Aarav (Lead)", "oc": 0.92},
        {"id": "MOD-COACTVWC", "name": "COACTVWC", "title": "COACTVWC — Account View Inquiry Service", "cluster": "acct_cust", "type": "cics_program", "crit": 4, "doc": 0.3, "risk": 0.45, "bus": False, "owner": "Aarav (Lead)", "oc": 0.70},
        {"id": "MOD-COCRDSLC", "name": "COCRDSLC", "title": "COCRDSLC — Credit Card Select & Filter", "cluster": "acct_cust", "type": "cics_program", "crit": 4, "doc": 0.4, "risk": 0.32, "bus": False, "owner": "Meera", "oc": 0.50},

        # Card Mgmt (Amber Cluster)
        {"id": "MOD-COCRDUPC", "name": "COCRDUPC", "title": "COCRDUPC — Card Details Update Program", "cluster": "card_mgmt", "type": "cics_program", "crit": 4, "doc": 0.25, "risk": 0.52, "bus": True, "owner": "Aarav (Lead)", "oc": 0.85},
        {"id": "MOD-COCRDLIC", "name": "COCRDLIC", "title": "COCRDLIC — Card List Pagination Service", "cluster": "card_mgmt", "type": "cics_program", "crit": 3, "doc": 0.5, "risk": 0.22, "bus": False, "owner": "Priya", "oc": 0.40},
        {"id": "MOD-COBIL00C", "name": "COBIL00C", "title": "COBIL00C — Card Bill Payment Ingestion", "cluster": "card_mgmt", "type": "cics_program", "crit": 4, "doc": 0.2, "risk": 0.58, "bus": True, "owner": "Aarav (Lead)", "oc": 0.86},

        # Transactions & Billing (Sky Blue Cluster)
        {"id": "MOD-COTRN00C", "name": "COTRN00C", "title": "COTRN00C — Transaction List Browser", "cluster": "txn_bill", "type": "cics_program", "crit": 4, "doc": 0.35, "risk": 0.38, "bus": False, "owner": "Meera", "oc": 0.55},
        {"id": "MOD-COTRN01C", "name": "COTRN01C", "title": "COTRN01C — Transaction Detail Inspector", "cluster": "txn_bill", "type": "cics_program", "crit": 4, "doc": 0.4, "risk": 0.32, "bus": False, "owner": "Rohan", "oc": 0.45},
        {"id": "MOD-COTRN02C", "name": "COTRN02C", "title": "COTRN02C — Transaction Add / Adjustment Entry", "cluster": "txn_bill", "type": "cics_program", "crit": 5, "doc": 0.15, "risk": 0.69, "bus": True, "owner": "Aarav (Lead)", "oc": 0.90},

        # Core Batch (Fuchsia / Magenta Cluster)
        {"id": "MOD-CBTRN01C", "name": "CBTRN01C", "title": "CBTRN01C — Daily Transaction Posting Batch", "cluster": "core_batch", "type": "batch_job", "crit": 5, "doc": 0.1, "risk": 0.74, "bus": True, "owner": "Aarav (Lead)", "oc": 0.94},
        {"id": "MOD-CBTRN02C", "name": "CBTRN02C", "title": "CBTRN02C — Daily Interest Calculation Engine", "cluster": "core_batch", "type": "batch_job", "crit": 5, "doc": 0.2, "risk": 0.62, "bus": True, "owner": "Aarav (Lead)", "oc": 0.84},
        {"id": "MOD-CBACT04C", "name": "CBACT04C", "title": "CBACT04C — Account Billing Cycle Run", "cluster": "core_batch", "type": "batch_job", "crit": 5, "doc": 0.18, "risk": 0.65, "bus": True, "owner": "Aarav (Lead)", "oc": 0.88},
        {"id": "MOD-CBEXPORT", "name": "CBEXPORT", "title": "CBEXPORT — Core DB2 Data Warehouse Extractor", "cluster": "core_batch", "type": "batch_job", "crit": 4, "doc": 0.3, "risk": 0.44, "bus": False, "owner": "Rohan", "oc": 0.60},
        {"id": "MOD-CBIMPORT", "name": "CBIMPORT", "title": "CBIMPORT — Merchant Inbound Batch Ingestion", "cluster": "core_batch", "type": "batch_job", "crit": 4, "doc": 0.35, "risk": 0.40, "bus": False, "owner": "Meera", "oc": 0.55},
        {"id": "MOD-CBACT01C", "name": "CBACT01C", "title": "CBACT01C — Customer Balance Rollup", "cluster": "core_batch", "type": "batch_job", "crit": 3, "doc": 0.5, "risk": 0.25, "bus": False, "owner": "Priya", "oc": 0.40},

        # Batch Infra & Utilities (Purple Cluster at top)
        {"id": "MOD-UTLINIT", "name": "UTLINIT", "title": "UTLINIT — JCL Environment Init & Parm Scan", "cluster": "batch_infra", "type": "batch_util", "crit": 4, "doc": 0.4, "risk": 0.30, "bus": False, "owner": "Rohan", "oc": 0.45},
        {"id": "MOD-UTLSORT", "name": "UTLSORT", "title": "UTLSORT — DFSORT Multi-key Formatter", "cluster": "batch_infra", "type": "batch_util", "crit": 3, "doc": 0.6, "risk": 0.18, "bus": False, "owner": "Priya", "oc": 0.35},
        {"id": "MOD-UTLBACK", "name": "UTLBACK", "title": "UTLBACK — Automated VSAM Snapshot Utility", "cluster": "batch_infra", "type": "batch_util", "crit": 4, "doc": 0.3, "risk": 0.45, "bus": False, "owner": "Aarav (Lead)", "oc": 0.70},
        {"id": "MOD-UTLLOG", "name": "UTLLOG", "title": "UTLLOG — Centralized Batch Run Logger", "cluster": "batch_infra", "type": "batch_util", "crit": 3, "doc": 0.7, "risk": 0.12, "bus": False, "owner": "Meera", "oc": 0.30},
        {"id": "MOD-UTLNOTIF", "name": "UTLNOTIF", "title": "UTLNOTIF — Job Completion Notification Hook", "cluster": "batch_infra", "type": "batch_util", "crit": 2, "doc": 0.8, "risk": 0.08, "bus": False, "owner": "Neha", "oc": 0.20},
        {"id": "MOD-UTLARCH", "name": "UTLARCH", "title": "UTLARCH — GDG Tape Archive Rotator", "cluster": "batch_infra", "type": "batch_util", "crit": 3, "doc": 0.5, "risk": 0.22, "bus": False, "owner": "Rohan", "oc": 0.40},
        {"id": "MOD-UTLINDEX", "name": "UTLINDEX", "title": "UTLINDEX — Alternate Index (AIX) Rebuild", "cluster": "batch_infra", "type": "batch_util", "crit": 4, "doc": 0.2, "risk": 0.54, "bus": True, "owner": "Aarav (Lead)", "oc": 0.84},

        # Db2 Extension (Ocean Blue Cluster)
        {"id": "MOD-COTRTUC", "name": "COTRTUC", "title": "COTRTUC — Db2 Transaction Code Validator", "cluster": "db2_ext", "type": "db2_program", "crit": 4, "doc": 0.3, "risk": 0.42, "bus": False, "owner": "Rohan", "oc": 0.65},
        {"id": "MOD-COTBTUPC", "name": "COTBTUPC", "title": "COTBTUPC — Db2 Category Rule Processor", "cluster": "db2_ext", "type": "db2_program", "crit": 4, "doc": 0.25, "risk": 0.50, "bus": True, "owner": "Aarav (Lead)", "oc": 0.82},

        # User Security Admin (Sky Blue Cluster)
        {"id": "MOD-COUSR00C", "name": "COUSR00C", "title": "COUSR00C — CICS User Signon & Password Check", "cluster": "user_sec", "type": "security_program", "crit": 5, "doc": 0.3, "risk": 0.55, "bus": True, "owner": "Aarav (Lead)", "oc": 0.85},
        {"id": "MOD-COUSR01C", "name": "COUSR01C", "title": "COUSR01C — Security Role Permission Matrix", "cluster": "user_sec", "type": "security_program", "crit": 4, "doc": 0.5, "risk": 0.28, "bus": False, "owner": "Neha", "oc": 0.45},
        {"id": "MOD-COUSR02C", "name": "COUSR02C", "title": "COUSR02C — User Admin Profile Maintenance", "cluster": "user_sec", "type": "security_program", "crit": 3, "doc": 0.6, "risk": 0.19, "bus": False, "owner": "Priya", "oc": 0.35},

        # Reporting (Indigo Cluster)
        {"id": "MOD-CBTRN03C", "name": "CBTRN03C", "title": "CBTRN03C — Daily Transaction Detail Report", "cluster": "reporting", "type": "report_program", "crit": 3, "doc": 0.4, "risk": 0.28, "bus": False, "owner": "Rohan", "oc": 0.45},
        {"id": "MOD-CORPT00C", "name": "CORPT00C", "title": "CORPT00C — Statement Generation Engine", "cluster": "reporting", "type": "report_program", "crit": 4, "doc": 0.35, "risk": 0.40, "bus": False, "owner": "Meera", "oc": 0.60},

        # IMS/MQ Extension (Pink Cluster)
        {"id": "MOD-CQTRN01", "name": "CQTRN01", "title": "CQTRN01 — Inbound MQ Payment Trigger", "cluster": "ims_mq", "type": "mq_program", "crit": 4, "doc": 0.1, "risk": 0.68, "bus": True, "owner": "Aarav (Lead)", "oc": 0.90},
        {"id": "MOD-CQMSG01", "name": "CQMSG01", "title": "CQMSG01 — Dead Letter & Exception Handler", "cluster": "ims_mq", "type": "mq_program", "crit": 3, "doc": 0.2, "risk": 0.46, "bus": False, "owner": "Aarav (Lead)", "oc": 0.72},
        {"id": "MOD-CQACT01", "name": "CQACT01", "title": "CQACT01 — Asynchronous Account Notification Bridge", "cluster": "ims_mq", "type": "mq_program", "crit": 3, "doc": 0.3, "risk": 0.35, "bus": False, "owner": "Meera", "oc": 0.48},
    ]

    # Map raw nodes into formatted nodes with radius and colors
    nodes = []
    for r in raw_nodes:
        is_high = r["risk"] >= 0.30
        is_critical = r["risk"] >= 0.50
        tier = "critical" if is_critical else ("high" if is_high else ("medium" if r["risk"] >= 0.15 else "low"))
        
        # Radius sizing: data stores are moderately sized, programs scale with criticality and risk
        if r["type"] == "data_store":
            base_r = 18 + (r["crit"] * 2.2)
        else:
            base_r = 16 + (r["crit"] * 3.5) + (r["risk"] * 14)

        # Look up cluster color
        cluster_obj = next((c for c in clusters if c["id"] == r["cluster"]), None)
        c_color = cluster_obj["color"] if cluster_obj else "#475569"
        c_border = cluster_obj.get("border_color", "#334155") if cluster_obj else "#334155"

        nodes.append({
            "id": r["id"],
            "name": r["name"],
            "title": r["title"],
            "cluster_id": r["cluster"],
            "cluster_name": cluster_obj["name"] if cluster_obj else r["cluster"],
            "type": r["type"],
            "criticality": r["crit"],
            "doc_coverage": r["doc"],
            "doc_gap": round(1.0 - r["doc"], 2),
            "risk_score": r["risk"],
            "risk_pct": round(r["risk"] * 100, 1),
            "risk_tier": tier,
            "bus_factor_one": r["bus"],
            "primary_owner": r["owner"],
            "ownership_concentration": r["oc"],
            "radius": round(base_r, 1),
            "color": c_color,
            "border_color": c_border,
            "is_data_store": r["type"] == "data_store",
        })

    # High-density inter-module and central data-store dependency edges
    raw_edges = [
        # Account & Customer -> Data Stores
        ("MOD-COACTUPC", "DS-ACCTDAT", "updates_master"),
        ("MOD-COACTUPC", "DS-CUSTDAT", "reads_customer"),
        ("MOD-COACTUPC", "DS-CCXREF", "checks_cross_ref"),
        ("MOD-COACTVWC", "DS-ACCTDAT", "queries_account"),
        ("MOD-COACTVWC", "DS-CUSTDAT", "queries_customer"),
        ("MOD-COCRDSLC", "DS-CARDDAT", "queries_card"),
        ("MOD-COCRDSLC", "DS-CCXREF", "resolves_account"),

        # Card Mgmt -> Data Stores
        ("MOD-COCRDUPC", "DS-CARDDAT", "updates_card"),
        ("MOD-COCRDUPC", "DS-CCXREF", "validates_link"),
        ("MOD-COCRDLIC", "DS-CARDDAT", "paginates_cards"),
        ("MOD-COBIL00C", "DS-ACCTDAT", "credits_balance"),
        ("MOD-COBIL00C", "DS-TRANSACT", "records_payment"),

        # Transactions & Billing -> Data Stores
        ("MOD-COTRN00C", "DS-TRANSACT", "lists_transactions"),
        ("MOD-COTRN01C", "DS-TRANSACT", "reads_single_txn"),
        ("MOD-COTRN02C", "DS-TRANSACT", "inserts_transaction"),
        ("MOD-COTRN02C", "DS-ACCTDAT", "verifies_credit_limit"),
        ("MOD-COTRN02C", "DS-DB2TXN", "validates_txn_type"),

        # Core Batch -> Data Stores (Heavy multi-store connections)
        ("MOD-CBTRN01C", "DS-TRNXFILE", "reads_daily_feed"),
        ("MOD-CBTRN01C", "DS-TRANSACT", "posts_transactions"),
        ("MOD-CBTRN01C", "DS-ACCTDAT", "updates_daily_balances"),
        ("MOD-CBTRN01C", "DS-DALYRECN", "writes_reconciliation"),
        ("MOD-CBTRN02C", "DS-ACCTDAT", "compounds_interest"),
        ("MOD-CBTRN02C", "DS-RATESTBL", "reads_tier_rates"),
        ("MOD-CBACT04C", "DS-ACCTDAT", "cycles_billing"),
        ("MOD-CBACT04C", "DS-STMTFILE", "stages_statements"),
        ("MOD-CBACT04C", "DS-FEESTBL", "applies_penalty_fees"),
        ("MOD-CBEXPORT", "DS-TRANSACT", "extracts_history"),
        ("MOD-CBEXPORT", "DS-DB2TXN", "syncs_warehouse"),
        ("MOD-CBIMPORT", "DS-TRNXFILE", "loads_settlement"),
        ("MOD-CBACT01C", "DS-ACCTDAT", "rolls_up_totals"),

        # Batch Infra Utilities -> Data Stores & Programs
        ("MOD-UTLBACK", "DS-ACCTDAT", "snapshots_vsam"),
        ("MOD-UTLBACK", "DS-CARDDAT", "snapshots_vsam"),
        ("MOD-UTLBACK", "DS-CUSTDAT", "snapshots_vsam"),
        ("MOD-UTLINDEX", "DS-CCXREF", "rebuilds_aix"),
        ("MOD-UTLLOG", "DS-AUDITLOG", "writes_audit_trail"),
        ("MOD-CBTRN01C", "MOD-UTLLOG", "calls_logger"),
        ("MOD-CBACT04C", "MOD-UTLLOG", "calls_logger"),
        ("MOD-CBTRN01C", "MOD-UTLINIT", "invokes_init"),

        # Security Admin -> Data Stores
        ("MOD-COUSR00C", "DS-SECUSER", "authenticates_credentials"),
        ("MOD-COUSR01C", "DS-SECUSER", "reads_roles"),
        ("MOD-COUSR02C", "DS-SECUSER", "modifies_user_profiles"),
        ("MOD-COACTUPC", "MOD-COUSR00C", "checks_authorization"),
        ("MOD-COCRDUPC", "MOD-COUSR00C", "checks_authorization"),

        # Db2 Extension -> Central Data
        ("MOD-COTRTUC", "DS-DB2TXN", "queries_codes"),
        ("MOD-COTBTUPC", "DS-DB2TXN", "updates_batch_rules"),
        ("MOD-COTBTUPC", "DS-TRANSACT", "enriches_records"),

        # Reporting -> Data Stores
        ("MOD-CBTRN03C", "DS-TRANSACT", "summarizes_daily"),
        ("MOD-CORPT00C", "DS-STMTFILE", "formats_print_spool"),
        ("MOD-CORPT00C", "DS-REPTARCH", "archives_statements"),

        # IMS / MQ Messaging -> Data Stores & Programs
        ("MOD-CQTRN01", "DS-MQQUEUE", "dequeues_messages"),
        ("MOD-CQTRN01", "MOD-COTRN02C", "posts_online_txn"),
        ("MOD-CQMSG01", "DS-MQQUEUE", "routes_dead_letter"),
        ("MOD-CQACT01", "DS-ACCTDAT", "reads_status"),
    ]

    edges = []
    for idx, (src, tgt, rel) in enumerate(raw_edges):
        src_node = next((n for n in nodes if n["id"] == src), None)
        tgt_node = next((n for n in nodes if n["id"] == tgt), None)
        if src_node and tgt_node:
            is_inter = src_node["cluster_id"] != tgt_node["cluster_id"]
            is_ds = src_node["is_data_store"] or tgt_node["is_data_store"]
            edges.append({
                "id": f"edge-card-{idx+1:03d}",
                "source": src,
                "target": tgt,
                "relation": rel,
                "is_inter_cluster": is_inter,
                "is_data_store": is_ds,
            })

    high_risk_nodes = [n["id"] for n in nodes if n["risk_score"] >= 0.30]
    bus_factor_violations = [n["id"] for n in nodes if n["bus_factor_one"]]

    return {
        "system_name": system_name,
        "description": description,
        "dataset_type": "carddemo",
        "clusters": clusters,
        "nodes": nodes,
        "edges": edges,
        "summary": {
            "total_nodes": len(nodes),
            "total_clusters": len(clusters),
            "total_edges": len(edges),
            "high_risk_count": len(high_risk_nodes),
            "bus_factor_count": len(bus_factor_violations),
            "data_store_count": len([n for n in nodes if n["is_data_store"]]),
            "primary_leaver": "Aarav (Lead Engineer)",
        }
    }


def build_workspace_dataset(project_id: str, repo_id: Optional[str] = None) -> Dict[str, Any]:
    """
    Dynamically groups artifacts from the active project workspace into
    architectural clusters with risk scores and dependency connections.
    """
    conn = get_db()
    proj = conn.execute("SELECT id, name, description FROM projects WHERE id = ?", (project_id,)).fetchone()
    system_name = proj["name"] if proj else "Workspace Architecture"
    description = proj["description"] if proj else "Knowledge Risk Graph"

    # Compute live project risk
    risk_info = calculate_project_risk(project_id, repo_id=repo_id)
    leaver = risk_info.get("leaver") or {}
    leaver_name = leaver.get("name") or "Primary Author"

    # Fetch artifacts and edges
    art_rows = conn.execute("SELECT * FROM artifacts WHERE project_id = ?", (project_id,)).fetchall()
    edge_rows = conn.execute("SELECT source, relation, target FROM graph_edges WHERE project_id = ?", (project_id,)).fetchall()
    conn.close()

    # Pre-defined architectural cluster mapping for modern multi-file workspaces
    cluster_defs = {
        "data_stores": {
            "name": "Data stores & Schemas",
            "description": "SQLite tables, database migrations, persistence repositories, and models",
            "color": "#059669",
            "border_color": "#047857",
            "category": "storage",
        },
        "frontend_ui": {
            "name": "Frontend UI & Views",
            "description": "React user interface components, views, layouts, and style systems",
            "color": "#0284C7",
            "border_color": "#0369A1",
            "category": "frontend",
        },
        "core_services": {
            "name": "Core Engines & Logic",
            "description": "Risk calculation engines, scanners, knowledge collectors, and backend services",
            "color": "#4F46E5",
            "border_color": "#3730A3",
            "category": "services",
        },
        "knowledge_handover": {
            "name": "Knowledge & Handover",
            "description": "Exit interview pipelines, handover packages, decision logs, and transition roadmaps",
            "color": "#C026D3",
            "border_color": "#A21CAF",
            "category": "handover",
        },
        "security_auth": {
            "name": "User Security & Session Admin",
            "description": "Token verification, session caches, access control, and user auth",
            "color": "#2563EB",
            "border_color": "#1D4ED8",
            "category": "security",
        },
        "api_gateway": {
            "name": "API Gateway & Routing",
            "description": "REST endpoints, route controllers, client communication bridges, and web API handlers",
            "color": "#0D9488",
            "border_color": "#0F766E",
            "category": "gateway",
        },
        "devops_infra": {
            "name": "DevOps, Tooling & Scripts",
            "description": "Dockerfiles, shell scripts, seed fixtures, build tooling, and package configurations",
            "color": "#D97706",
            "border_color": "#B45309",
            "category": "devops",
        },
        "ext_integrations": {
            "name": "External Comms & Integrations",
            "description": "Slack channels, Jira incidents, vendor communications, and webhooks",
            "color": "#E11D48",
            "border_color": "#BE123C",
            "category": "messaging",
        },
        "docs_runbooks": {
            "name": "Runbooks & Architecture Docs",
            "description": "Operational runbooks, architecture markdown documentation, PRs, and guides",
            "color": "#64748B",
            "border_color": "#475569",
            "category": "reporting",
        },
        "core_batch": {
            "name": "Core Batch & Scheduled Sync",
            "description": "Background synchronization workers, nightly jobs, and cron routines",
            "color": "#7C3AED",
            "border_color": "#6D28D9",
            "category": "batch",
        },
    }

    # Match each artifact to a sub-domain cluster
    nodes = []
    risk_artifacts_map = {a["artifact_id"]: a for a in risk_info.get("artifacts", [])}
    total_arts = len(art_rows)

    for a in art_rows:
        art_id = a["id"]
        path = (a["path"] or "").lower()
        title = (a["title"] or "").lower()
        atype = a["type"]

        # Fine-grained sub-domain classification (Option 1)
        if atype == "database_table" or any(k in path or k in title for k in ["database.py", "echo.db", "schema", "table", "store", "migration"]):
            c_id = "data_stores"
        elif any(k in path for k in ["auth", "session", "login", "signup", "password", "token", "jwt", "user_sec", "test_auth"]):
            c_id = "security_auth"
        elif any(k in path for k in ["handover", "interview"]):
            c_id = "knowledge_handover"
        elif atype in ["chat_thread", "ticket"] or any(k in path or k in title for k in ["slack", "jira", "vendor", "webhook"]):
            c_id = "ext_integrations"
        elif atype in ["document", "pull_request"] or any(k in path for k in [".md", "doc", "runbook", "guide", "pulls"]):
            c_id = "docs_runbooks"
        elif any(k in path or k in title for k in ["nightly", "cron", "batch", "sync.py", "scheduled"]):
            c_id = "core_batch"
        elif any(k in path for k in ["docker", "run.sh", "requirements", "package.json", "vite", "seed", ".env", ".gitignore", "public", "assets", "favicon"]):
            c_id = "devops_infra"
        elif any(k in path for k in ["main.py", "api.js", "routes", "controllers", "endpoint"]):
            c_id = "api_gateway"
        elif any(k in path for k in ["frontend/src/components", "frontend/src", ".jsx", ".tsx", ".css", "sidebar", "appshell"]):
            c_id = "frontend_ui"
        elif any(k in path for k in ["backend/services", "engine", "scanner", "calculator", "service_a", "service_b", "legacy_vault"]):
            c_id = "core_services"
        else:
            c_id = "core_services"

        risk_data = risk_artifacts_map.get(art_id, {})
        r_score = risk_data.get("risk_score", 0.2)
        r_pct = risk_data.get("risk_pct", round(r_score * 100, 1))
        is_bus = risk_data.get("bus_factor_one", False)
        crit = a["criticality"]
        doc = a["doc_coverage"]
        oc = (risk_data.get("components") or {}).get("ownership_concentration", 0.5)

        is_high = r_pct >= 30.0
        is_crit = r_pct >= 50.0
        tier = "critical" if is_crit else ("high" if is_high else ("medium" if r_pct >= 15.0 else "low"))

        c_info = cluster_defs.get(c_id, cluster_defs["core_services"])

        # Adaptive radius calculation (Option 2): scaled to avoid overcrowding in dense codebases
        if total_arts > 50:
            base_r = 11.5 + (crit * 1.8) + (r_score * 7.0)
        elif total_arts > 25:
            base_r = 13.5 + (crit * 2.2) + (r_score * 8.5)
        else:
            base_r = 16.0 + (crit * 3.0) + (r_score * 10.0)

        # Short clean display label
        short_label = a["title"].split("—")[0].strip()
        if "/" in short_label:
            short_label = os.path.basename(short_label)

        nodes.append({
            "id": art_id,
            "name": short_label or art_id,
            "title": a["title"],
            "cluster_id": c_id,
            "cluster_name": c_info["name"],
            "type": atype,
            "criticality": crit,
            "doc_coverage": doc,
            "doc_gap": round(1.0 - doc, 2),
            "risk_score": r_score,
            "risk_pct": r_pct,
            "risk_tier": tier,
            "bus_factor_one": is_bus,
            "primary_owner": leaver_name if oc >= 0.5 else "Team",
            "ownership_concentration": oc,
            "radius": round(base_r, 1),
            "color": c_info["color"],
            "border_color": c_info.get("border_color", "#334155"),
            "is_data_store": c_id == "data_stores",
        })

    # Always ensure at least 2 central data store nodes exist for workspace visual harmony
    data_store_nodes = [n for n in nodes if n["is_data_store"]]
    if len(data_store_nodes) < 3:
        virtual_stores = [
            {"id": "DS-PRIMARY-DB", "name": "echo.db (SQLite)", "title": "Primary SQLite Database & System Schemas", "cluster": "data_stores"},
            {"id": "DS-APP-MODELS", "name": "Artifacts & Edges", "title": "Knowledge Graph Entities & Relations Store", "cluster": "data_stores"},
            {"id": "DS-SESSION-STORE", "name": "Session Cache", "title": "User Authentication & JWT Session Registry", "cluster": "data_stores"},
        ]
        c_info = cluster_defs["data_stores"]
        for vs in virtual_stores:
            if not any(n["id"] == vs["id"] for n in nodes):
                nodes.append({
                    "id": vs["id"],
                    "name": vs["name"],
                    "title": vs["title"],
                    "cluster_id": "data_stores",
                    "cluster_name": c_info["name"],
                    "type": "database_table",
                    "criticality": 4,
                    "doc_coverage": 0.4,
                    "doc_gap": 0.6,
                    "risk_score": 0.32,
                    "risk_pct": 32.0,
                    "risk_tier": "high",
                    "bus_factor_one": False,
                    "primary_owner": leaver_name,
                    "ownership_concentration": 0.7,
                    "radius": 24.0,
                    "color": c_info["color"],
                    "is_data_store": True,
                })

    # Build active clusters list
    used_cluster_ids = set(n["cluster_id"] for n in nodes)
    clusters = []
    for cid, cinfo in cluster_defs.items():
        if cid in used_cluster_ids:
            clusters.append({
                "id": cid,
                "name": cinfo["name"],
                "description": cinfo["description"],
                "color": cinfo["color"],
                "category": cinfo["category"],
            })

    # Build edges: database graph_edges + inter-cluster connections to central data stores
    edges = []
    edge_idx = 1
    existing_pairs = set()

    node_ids = set(n["id"] for n in nodes)

    # Convert existing database graph_edges
    for e in edge_rows:
        src, rel, tgt = e["source"], e["relation"], e["target"]
        if src in node_ids and tgt in node_ids and (src, tgt) not in existing_pairs:
            src_n = next(n for n in nodes if n["id"] == src)
            tgt_n = next(n for n in nodes if n["id"] == tgt)
            edges.append({
                "id": f"edge-db-{edge_idx:03d}",
                "source": src,
                "target": tgt,
                "relation": rel,
                "is_inter_cluster": src_n["cluster_id"] != tgt_n["cluster_id"],
                "is_data_store": src_n["is_data_store"] or tgt_n["is_data_store"],
            })
            existing_pairs.add((src, tgt))
            edge_idx += 1

    # Connect modules to central data stores and between related services
    ds_nodes = [n["id"] for n in nodes if n["is_data_store"]]
    non_ds_nodes = [n for n in nodes if not n["is_data_store"]]

    for n in non_ds_nodes:
        # Connect to a data store
        target_ds = ds_nodes[hash(n["id"]) % len(ds_nodes)]
        if (n["id"], target_ds) not in existing_pairs:
            edges.append({
                "id": f"edge-synth-{edge_idx:03d}",
                "source": n["id"],
                "target": target_ds,
                "relation": "accesses_store",
                "is_inter_cluster": True,
                "is_data_store": True,
            })
            existing_pairs.add((n["id"], target_ds))
            edge_idx += 1

    # Add intra-cluster and calling links for rich topology
    grouped = {}
    for n in non_ds_nodes:
        grouped.setdefault(n["cluster_id"], []).append(n["id"])

    for cid, ids in grouped.items():
        if len(ids) > 1:
            for i in range(len(ids) - 1):
                pair = (ids[i], ids[i+1])
                if pair not in existing_pairs:
                    edges.append({
                        "id": f"edge-intra-{edge_idx:03d}",
                        "source": ids[i],
                        "target": ids[i+1],
                        "relation": "depends_on",
                        "is_inter_cluster": False,
                        "is_data_store": False,
                    })
                    existing_pairs.add(pair)
                    edge_idx += 1

    high_risk_nodes = [n["id"] for n in nodes if n["risk_score"] >= 0.30]
    bus_factor_violations = [n["id"] for n in nodes if n["bus_factor_one"]]

    return {
        "system_name": system_name,
        "description": description,
        "dataset_type": "workspace",
        "clusters": clusters,
        "nodes": nodes,
        "edges": edges,
        "summary": {
            "total_nodes": len(nodes),
            "total_clusters": len(clusters),
            "total_edges": len(edges),
            "high_risk_count": len(high_risk_nodes),
            "bus_factor_count": len(bus_factor_violations),
            "data_store_count": len(ds_nodes),
            "primary_leaver": leaver_name,
        }
    }


def get_cluster_graph_data(project_id: Optional[str] = None, dataset: str = "auto") -> Dict[str, Any]:
    """
    Main entry point for cluster visualization endpoint.
    Returns the requested or auto-selected clustered graph dataset.
    """
    if dataset == "carddemo":
        return build_carddemo_dataset()

    if dataset == "workspace":
        if not project_id:
            conn = get_db()
            first_p = conn.execute("SELECT id FROM projects ORDER BY created_at DESC LIMIT 1").fetchone()
            conn.close()
            if first_p:
                project_id = first_p["id"]
        if project_id:
            return build_workspace_dataset(project_id)

    # Auto mode: if project_id is given and has artifacts, return workspace dataset
    if project_id:
        try:
            ws_data = build_workspace_dataset(project_id)
            if ws_data["summary"]["total_nodes"] > 0:
                return ws_data
        except Exception:
            pass

    # Default to CardDemo reference dataset
    return build_carddemo_dataset()
