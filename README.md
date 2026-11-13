# Echo — Knowledge-Risk Engine for Seamless Team Handovers

[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688?style=flat&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat&logo=react&logoColor=black)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?style=flat&logo=vite&logoColor=white)](https://vitejs.dev)
[![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?style=flat&logo=tailwind-css&logoColor=white)](https://tailwindcss.com)
[![SQLite](https://img.shields.io/badge/SQLite-Persistent_DB-003B57?style=flat&logo=sqlite&logoColor=white)](https://www.sqlite.org)
[![ASI:One](https://img.shields.io/badge/ASI:One-AI_Engine-8A2BE2?style=flat)](https://asi1.ai)

> **When a key engineer resigns, most teams summarize what they wrote down. Echo discovers what only they know.**  
> Echo continuously scans codebases, commit histories, and ownership graphs to compute deterministic knowledge-risk scores, generate evidence-backed exit interviews, create customized successor packages, and provide a grounded AI copilot.

---

## 🌟 Key Features

### 1. 🗺️ Continuous Knowledge-Risk Mapping
- **Deterministic Risk Scoring:** Calculates risk using transparent, explainable metrics (ownership concentration, staleness, criticality, documentation coverage, and dependency coupling).
- **Bus-Factor Warnings:** Automatically flags critical artifacts with single-owner vulnerabilities.
- **Planted Gap Detection:** Catches undocumented logic and implicit dependencies before they turn into production incidents.

### 2. 📝 Evidence-Driven Exit Interviews
- **Context-Aware Questioning:** Instead of generic HR forms, Echo generates questions directly from commit messages, pull requests, and undocumented code changes.
- **Automated Decision Extraction:** Captures leaver answers and converts them into searchable architectural decision records (ADRs).

### 3. 📦 Personalized Handover Packages
- **Tailored Onboarding Paths:** Builds structured 2-week ramps for successors (e.g. Meera stepping into Aarav's role).
- **Landmine Registry:** Maps high-risk files directly to the captured exit-interview evidence.
- **Who-to-Ask Directory:** Pinpoints the best domain experts for uncovered topics.

### 4. 💬 Ask Echo (AI Copilot)
- **Grounded ASI:One Q&A:** Answers engineering questions with explicit citations to files, commits, and interview answers.
- **Honesty Fallback:** Never hallucinates passwords, tokens, or undocumented facts — when evidence is missing, it explicitly admits it and suggests the right teammate to ask.
- **Concise by Design:** Delivers direct, fluff-free technical answers under 100 words.

### 5. 🔌 Native Git & GitHub Scanner
- Ingests real Git repositories, commits, and author graphs dynamically alongside the seeded demo projects.

---

## 🏗️ Architecture & Tech Stack

```
ECHO/
├── backend/
│   ├── fixtures/          # Demo seed data (Aarav resignation scenario)
│   ├── services/          # Risk engine, interview generator, ASI:One & Git connectors
│   ├── database.py        # SQLite schema & persistent storage
│   ├── main.py            # FastAPI REST API endpoints
│   └── requirements.txt   # Backend dependencies
├── frontend/
│   ├── src/
│   │   ├── components/    # Risk Map, Exit Interview, Handover & Ask Echo UI
│   │   ├── api.js         # API client & backend proxy handler
│   │   ├── App.jsx        # Root application & tab router
│   │   └── main.jsx       # React DOM entry point
│   ├── package.json       # Frontend dependencies (React 19, Lucide, Tailwind v4)
│   └── vite.config.js     # Dev server configuration & proxy
├── .env.example           # Environment template (ASI:One & GitHub tokens)
├── run.sh                 # Linux/macOS unified startup script
└── README.md
```

---

## 🚀 Quickstart

### Prerequisites
- **Python:** 3.10 or higher
- **Node.js:** 18 or higher (with npm)
- **Git**

---

### Step 1: Clone & Configure Environment

```bash
git clone https://github.com/niharikav25/PURECODERS.git
cd PURECODERS

# Copy environment template
cp .env.example .env
```

*(On Windows PowerShell, use `Copy-Item .env.example .env`)*

#### Optional: Add your API Keys in `.env`
Echo runs fully offline with seeded SQLite data. To enable live AI answers and GitHub imports:
- `ASI1_API_KEY`: Get an API key from [ASI:One Dashboard](https://asi1.ai/dashboard/api-keys).
- `GITHUB_TOKEN`: Personal Access Token for scanning private GitHub repos.

---

### Step 2: Running on Windows (PowerShell)

Open **two** PowerShell terminals:

#### Terminal 1 — Backend (FastAPI):
```powershell
cd backend

# Create & activate virtual environment
python -m venv .venv
.\.venv\Scripts\Activate.ps1

# Install dependencies
python -m pip install -r requirements.txt

# Start FastAPI server
python -m uvicorn main:app --reload --port 8000
```
- **Backend API & Swagger Docs:** [http://localhost:8000/docs](http://localhost:8000/docs)
- **Health Check:** [http://localhost:8000/api/health](http://localhost:8000/api/health)

#### Terminal 2 — Frontend (React 19 + Vite):
```powershell
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```
- **Echo UI:** [http://localhost:3000](http://localhost:3000)

---

### Step 3: Running on macOS / Linux (or Git Bash)

You can launch both services together with one command:

```bash
chmod +x run.sh
./run.sh
```

Or run individually:

```bash
# Terminal 1: Backend
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000

# Terminal 2: Frontend
cd frontend
npm install
npm run dev
```

---

## 🔌 Core API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Health check & service status |
| `GET` | `/api/risk-map` | Deterministic risk scores, bus-factor warnings & gap alerts |
| `GET` | `/api/artifacts` | Complete artifact catalog with knowledge graph edges |
| `GET` | `/api/interview/questions` | Evidence-based interview questions for departing engineer |
| `POST` | `/api/interview/answers` | Submit answers; extracts decision logs automatically |
| `GET` | `/api/handover` | Successor handover roadmap, landmines & domain contacts |
| `POST` | `/api/ask` | Retrieval-grounded Q&A with citations and honesty fallback |
| `POST` | `/api/github/scan` | Live GitHub repository scan & ownership ingestion |
| `POST` | `/api/reset` | Resets answers and restores clean demo state |

---

## 🔒 Security & Privacy

- **No Secrets in Version Control:** `.env` and `*.db` are ignored by `.gitignore`.
- **Honesty Guardrails:** The copilot strictly refuses to invent credentials, secrets, or undocumented data.
- **Local-First SQLite:** Stores knowledge graphs, artifacts, and decisions locally without mandatory cloud vendor lock-in.
