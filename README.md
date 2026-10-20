# FlowLens 🔍

> **Interactive Full-Stack Process Mining & Bottleneck Detection Engine**

FlowLens discovers end-to-end workflow topologies directly from raw event logs, models transition latencies, and flags operational bottlenecks using **FastAPI**, **PM4Py**, and **React Flow**[cite: 4, 7].

FlowLens operates as an in-memory, stateless analytics engine[cite: 1]. It processes event data purely in RAM using Pandas DataFrames and PM4Py, requiring zero persistent database setup, ensuring zero storage overhead, sub-second execution, and complete data privacy[cite: 1].

---

## 🛠 Tech Stack

* **Backend:** Python 3.10+, FastAPI, PM4Py, Pandas, NumPy, Uvicorn, pytest[cite: 4]
* **Frontend:** React 18 (Vite), React Flow (`@xyflow/react`), Tailwind CSS, Axios, Lucide Icons[cite: 4]
* **Architecture:** 2-Tier decoupled client-server architecture with in-memory active session caching

---

## 📁 Repository Structure & Hidden Files

```text
FlowLens/
├── .git/                      # Git version control metadata (hidden)
├── .gitignore                 # Specifies intentionally untracked files to ignore
├── backend/
│   ├── .venv/                 # Python virtual environment directory (hidden / local)
│   ├── .env                   # Environment variables (CORS, HOST, PORT) (hidden / local)
│   ├── .env.example           # Template for local environment variables
│   ├── main.py                # FastAPI server entry point and REST routes
│   ├── ingestion.py           # Pandas schema validation and chronological sorting
│   ├── mining.py              # PM4Py Directly-Follows Graph (DFG) discovery & SLA calculation
│   ├── requirements.txt       # Python dependencies
│   └── tests/
│       └── test_api.py        # Automated unit and integration assertions (pytest)
├── frontend/
│   ├── node_modules/          # Installed npm packages (local)
│   ├── .env                   # Frontend environment variables (VITE_API_URL) (hidden / local)
│   ├── .env.example           # Template for frontend environment variables
│   ├── .eslintrc.cjs          # ESLint rules and syntax checks (hidden)
│   ├── package.json           # Frontend package manifests and scripts
│   ├── package-lock.json      # Locked dependency tree
│   ├── vite.config.js         # Vite configuration and local proxy setup
│   ├── tailwind.config.js     # Tailwind CSS design system rules
│   ├── index.html             # Single-page application root HTML
│   └── src/
│       ├── App.jsx            # Main React UI orchestration & state management
│       ├── components/        # React Flow canvas, KPI cards, and upload components
│       └── index.css          # Tailwind CSS directives
└── README.md                  # Project documentation