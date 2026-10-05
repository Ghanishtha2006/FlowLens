# FlowLens Frontend

The official frontend application for **FlowLens**, an enterprise-grade AI-powered process mining and workflow diagnostics platform. It provides an intuitive, high-performance user interface built to ingest event logs, visualize process maps, and flag operational bottlenecks.

## 🚀 Key Features

* **Upload & Configuration Home Page (`upload` view):**
  * Interactive file selection dropzone for enterprise CSV event logs.
  * Custom column mapping interface for **Case ID**, **Activity / Stage**, and **Timestamp**.
  * Parameter configuration strip supporting timezones, terminal activities, and SLA bottleneck limits.
  * Instant header validation check and analysis trigger.

* **Process Explorer Canvas (`explorer` view):**
  * High-performance interactive graph rendering powered by **React Flow** (`@xyflow/react`).
  * Automated top-down hierarchical node layout powered by **Dagre.js** (`@dagrejs/dagre`) to prevent overlap.
  * Color-coded node hierarchy (Start nodes in green, intermediate steps in neutral slate, and terminal/bottleneck points in crimson red with animated stroke warnings).
  * Real-time KPI Summary Banner tracking total cases, total events, unique activities, flagged bottlenecks, and average case duration.

* **Interactive Click Inspector Sidebar:**
  * Dynamic slide-out inspection drawer that opens when clicking any activity node or transition edge.
  * Deep-dive analytics displaying node frequency, case volume, execution state, and mean transition latencies.

## 📁 Folder Structure

```text
frontend/
├── public/                  # Static assets and sample data files (e.g., sample_log.csv)
├── src/                     # Source application directory
│   ├── App.jsx              # Main React view routing, state management, and React Flow canvas
│   ├── App.css              # Enterprise dark theme styling and custom component classes
│   ├── main.jsx             # React application DOM root injection
│   └── index.css            # Base Tailwind / global style configurations
├── .gitignore               # Ignored build and dependency artifacts
├── eslint.config.js         # ESLint configuration and syntax rules
├── index.html               # Single-page application root template
├── package.json             # Project dependencies, scripts, and build manifests
├── package-lock.json        # Locked dependency dependency tree
└── vite.config.js           # Vite configuration and build bundler rules

```

## 🛠️ Tech Stack & Dependencies

* **Framework:** React 18, Vite
* **Graph Engine:** React Flow (`@xyflow/react`), Dagre.js (`@dagrejs/dagre`)
* **HTTP Client:** Axios
* **Styling:** Custom Enterprise Dark Theme CSS


## 📦 Getting Started Locally

### 1. Install Dependencies

Make sure you are inside the `frontend` directory, then install the required npm packages:

```bash
npm install
```

### 2. Run the Development Server

Start the local Vite development server:

```bash
npm run dev
```

### 3. Open in Browser

Navigate to:

```text
http://localhost:5173
```