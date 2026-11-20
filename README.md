# Echo — Knowledge-Risk Engine for Seamless Team Handovers

[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688?style=flat&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat&logo=react&logoColor=black)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?style=flat&logo=vite&logoColor=white)](https://vitejs.dev)
[![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?style=flat&logo=tailwind-css&logoColor=white)](https://tailwindcss.com)
[![SQLite](https://img.shields.io/badge/SQLite-Persistent_DB-003B57?style=flat&logo=sqlite&logoColor=white)](https://www.sqlite.org)
[![ASI:One](https://img.shields.io/badge/ASI:One-AI_Engine-8A2BE2?style=flat)](https://asi1.ai)

> **When a key engineer resigns, most teams summarize what they wrote down. Echo discovers what only they know.**  
> Echo continuously scans codebases, commit histories, and ownership graphs to compute deterministic knowledge-risk scores, generate evidence-backed exit interviews, create customized successor packages, provide a grounded AI copilot, and continuously guard documented knowledge against code rot with **Knowledge Freshness Monitoring**.

### 🌟 Core Capabilities
- **Deterministic Knowledge-Risk Scoring:** Quantifies bus factor risks (≥80% single-author ownership), documentation gaps, and planted knowledge gaps.
- **Interactive Architecture & Cluster Topology:** Domain-clustered visual topology (CardDemo modernization visualization) mapping transactions, batch jobs, and shared data stores with visual risk halos.
- **Evidence-Backed Exit Interviews:** Auto-generates targeted questions for departing developers with audio voice transcription and structured decision extraction.
- **Continuous Knowledge Freshness Monitoring:** Cross-references documented decisions and landmines against git commits & PRs to detect parameter drift (e.g. modified timeouts/retry limits) and breaking refactors, backed by a reviewer re-verification workflow.
- **Personalized Successor Handover:** Generates progressive onboarding paths, landmines to avoid, open questions, and code ownership heatmaps.
- **Grounded Copilot (Ask Echo):** Honest AI chat powered by ASI:One that cites captured artifacts and candidly admits when answers are undocumented.

### Key Authentication Features
- **Real Backend Authentication:** Powered by FastAPI, SQLite persistence, and secure `bcrypt` salted password hashing. Passwords are never stored in plaintext.
- **Session Management:** Secure token-based session management with dual-layer delivery:
  - Signed JWT access tokens with session tracking in SQLite (`user_sessions`).
  - Automatic `echo_token` HTTP-only session cookies with CSRF-conscious `SameSite=Lax` controls.
  - Active session invalidation upon logout.
- **Role-Aware Access Control:**
  - **Project Lead / Manager (`project_lead`):** Manages project workspaces, connects repositories, invites contributors, and has administrative access.
  - **Departing Contributor (`departing_contributor`):** Assigned to prioritized exit interviews to capture critical tacit decisions before offboarding.
  - **Incoming Contributor (`incoming_contributor`):** Accesses approved handover packages, interactive onboarding pathways, and Ask Echo AI assistant.
  - **Reviewer (`reviewer`):** Verifies captured knowledge artifacts, audits decision rationale, and signs off on handover packages.
- **Protected Application Routes:** All dashboard tabs (`/`, `/risk`, `/architecture`, `/interview`, `/handover`, `/ask`, `/freshness`) require an active session. Unauthenticated requests automatically present the modern ECHO login experience.
- **Session Persistence:** Authenticated sessions persist across page refreshes via `/api/auth/me`.
- **Forgot Password Workflow:** Time-limited password reset tokens (`password_reset_tokens`) with email privacy (no account enumeration) and development-safe preview links when SMTP is not configured.
- **Quick Demo Sign-in:** Instant 1-click test credentials for evaluation across all 4 system roles.

### 👥 Benchmark Demo Test Accounts

| Role | Email | Password | Primary Workspace View |
|---|---|---|---|
| **Project Lead** | `lead@echo.dev` | `EchoLead#2026` | Risk Map & Workspace Ingestion |
| **Departing Lead** | `leaver@echo.dev` | `EchoLeaver#2026` | Exit Interview Questions |
| **Incoming Contributor** | `successor@echo.dev` | `EchoSuccessor#2026` | Handover Package & Ask Echo |
| **Reviewer** | `reviewer@echo.dev` | `EchoReviewer#2026` | Knowledge Verification & Approval |

*You can also register any new account using the Signup page!*

---

## 🚀 Quickstart

You can start both backend and frontend with a single command:

```bash
./run.sh
```

Or run them individually in two separate terminals:

### 1. Backend (FastAPI)
```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate    # On Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```
- **API Docs / Swagger:** [http://localhost:8000/docs](http://localhost:8000/docs)
- **API Health:** [http://localhost:8000/api/health](http://localhost:8000/api/health)

### 2. Frontend (React 19 + Vite + Tailwind CSS + Lucide)
```bash
cd frontend
npm install
npm run dev
```
- **Frontend UI:** [http://localhost:3000](http://localhost:3000)  
  *(Note: You can also build via `npm run build` or open [http://localhost:8000](http://localhost:8000) directly as the backend serves the built frontend).*

### 3. Run Test Suites
```bash
cd backend
# Run authentication unit and security tests
python test_auth.py

# Run end-to-end authentication and access verification
python test_e2e_verification.py

# Run native GitHub integration tests
python test_github_integration.py

# Run clustered architecture visualization tests
python test_cluster_viz.py

# Run knowledge freshness & drift detection tests
python test_freshness_monitor.py
```

---

## 📁 Project Structure

```
PURECODERS/
├── backend/
│   ├── main.py                  # FastAPI backend with authentication, risk engine & APIs
│   ├── database.py              # SQLite layer (projects, repositories, users, sessions)
│   ├── requirements.txt         # FastAPI, Uvicorn, Pydantic, Bcrypt, PyJWT
│   ├── services/
│   │   ├── auth_service.py      # Password hashing, JWTs, sessions & password reset
│   │   ├── risk_engine.py       # Deterministic knowledge-risk algorithm
│   │   ├── cluster_graph_service.py # Clustered architecture dependency graph generator
│   │   ├── freshness_service.py # Knowledge freshness tracking, parameter drift & conflict detection
│   │   ├── interview_engine.py  # Grounded interview question generation & answers
│   │   ├── github_service.py    # Native GitHub cloning, commits & AST analysis
│   │   ├── git_scanner.py       # Local git repository scanner
│   │   ├── connectors.py        # Connectors status monitoring
│   │   └── asi_service.py       # ASI:One retrieval & honest AI assistant
│   ├── fixtures/
│   │   └── demo_seed.py         # Benchmark hackathon demo seed data
│   ├── test_auth.py             # Auth unit and security tests (13 tests)
│   ├── test_e2e_verification.py # End-to-end auth and regression tests (8 tests)
│   ├── test_github_integration.py # Native GitHub integration tests (14 tests)
│   ├── test_cluster_viz.py      # Architecture cluster graph visualization tests (2 tests)
│   └── test_freshness_monitor.py # Knowledge freshness & drift detection tests (5 tests)
├── frontend/
│   ├── package.json             # Vite + React 19 dependencies
│   ├── vite.config.js           # Vite dev server & proxy
│   └── src/
│       ├── api.js               # Centralized API client with auth token headers & cookies
│       ├── App.jsx              # App shell, auth route guard, session check & routing
│       └── components/
│           ├── auth/
│           │   ├── Login.jsx           # Dark navy SaaS login with quick demo logins
│           │   ├── Signup.jsx          # Register with role selection & strength meter
│           │   ├── ForgotPassword.jsx  # Password recovery with dev preview
│           │   └── ResetPassword.jsx   # Token-based secure password reset
│           ├── layout/
│           │   ├── AppShell.jsx        # Responsive layout container
│           │   ├── Topbar.jsx          # Header with User Profile Menu & Role Switcher
│           │   └── Sidebar.jsx         # Sidebar navigation with active user footer
│           ├── risk/                   # Deterministic Risk Map & cluster topology view
│           ├── freshness/              # Knowledge Freshness Monitor & reviewer verification workflow
│           ├── interview/              # Exit Interview component
│           ├── handover/               # Handover Package component
│           └── ask/                    # Ask Echo AI assistant
├── .env.example                 # Example environment variables template
├── run.sh                       # Startup script
└── README.md                    # Project documentation
```

---

## 🔌 Authentication & Core API Endpoints

### Authentication APIs
- `POST /api/auth/register`: Register new user with full name, email, password, and role. Password is encrypted with `bcrypt`. Returns JWT and sets HTTP-only cookie.
- `POST /api/auth/login`: Authenticate with email and password. Supports "Remember me" session extension.
- `POST /api/auth/logout`: Invalidate session in database and delete HTTP-only cookies.
- `GET /api/auth/me`: Retrieve current authenticated user profile, active role, and permissions.
- `POST /api/auth/forgot-password`: Generate time-limited password recovery token. Dev-safe mode provides preview link when SMTP is unconfigured.
- `POST /api/auth/reset-password`: Reset user password using verified reset token. Invalidates all active sessions.
- `GET /api/auth/demo-users`: List default benchmark persona accounts for rapid evaluation.
- `POST /api/auth/switch-role`: Dynamically toggle current user's role perspective.

### Core Engine APIs
- `GET /api/risk-map`: Deterministic risk scores per artifact, bus-factor violations, and planted gap detection.
- `GET /api/graph/cluster-viz`: Domain-clustered architectural dependency graph with live risk halos and blast radii.
- `GET /api/artifacts`: Full artifact catalog with knowledge graph edges.
- `GET|POST /api/interview/questions`: Evidence-based questions generated for the leaver.
- `GET|POST /api/interview/answers`: Submit and retrieve answers; automatically extracts decision logs.
- `GET /api/handover`: Personalized successor package (onboarding path, landmines, open loops, who-to-ask).
- `POST /api/ask`: Retrieval-first Q&A with citations and honesty fallback ("Unknown" + suggested contact).
- `POST /api/reset`: Reset interview answers and decision logs for a clean demo run.

### Knowledge Freshness Monitor APIs
- `GET /api/freshness/overview`: Project freshness score, total monitored records, and count of records needing reverification.
- `GET /api/freshness/alerts`: List active code-drift/contradiction alerts between documentation and commits.
- `GET /api/freshness/records`: Full inventory of decisions, landmines, and docs with last-verified metadata and status.
- `POST /api/freshness/scan`: On-demand scan parsing recent commits and detecting parameter drift or breaking refactors.
- `POST /api/freshness/verify/{record_type}/{record_id}`: Re-verify record, update verification timestamp, and resolve alerts.
- `POST /api/freshness/dismiss/{alert_id}`: Dismiss a specific freshness alert.


## 🔒 Security & Privacy

- **Server-Side Role-Based Access Control (RBAC):** All administrative and mutating endpoints (`/api/projects/scan-git`, `DELETE /api/projects/{id}`, `/api/repositories/github/ingest`, `/api/connectors/*`, `/api/reset`) enforce server-side role validation via `Depends(require_roles([...]))`. Unauthorized actions return `403 Forbidden`.
- **Protected Workspace Endpoints:** All knowledge and dashboard APIs strictly enforce active authenticated session tokens (`Depends(get_current_user)`). Unauthenticated requests return `401 Unauthorized`.
- **Secure Password Hashing:** Salted `bcrypt` hashing (12 rounds) prevents plaintext exposure or dictionary attacks.
- **Dynamic Secure Session Cookies:** HTTP-only cookies automatically enable `secure=True` over HTTPS and production environments to prevent token leakage.
- **Strict SSRF & URL Validation:** GitHub and connector URLs are strictly validated for scheme (`https`), hostname (`github.com`), port (`443`), and block internal/loopback IP spaces.
- **No Secrets in Version Control:** `.env` and `*.db` are strictly ignored by `.gitignore`, and PAT/Bearer tokens are redacted from logs and API payloads.
- **Honesty Guardrails:** The copilot strictly refuses to invent credentials, secrets, or undocumented data.
- **Local-First SQLite with WAL Mode:** Stores knowledge graphs, artifacts, and decisions locally with Write-Ahead Logging (`PRAGMA journal_mode = WAL;`) for high concurrency and zero external vendor lock-in.


