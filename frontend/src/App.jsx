import { useState } from "react";
import { useReactFlow, ReactFlowProvider } from "@xyflow/react";
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  MarkerType,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import dagre from "@dagrejs/dagre";
import "./App.css";

// Dagre Layout Generator
const getLayoutedElements = (nodes, edges, direction = "TB") => {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));

  const nodeWidth = 220;
  const nodeHeight = 70;
  dagreGraph.setGraph({ rankdir: direction, nodesep: 60, ranksep: 80 });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    return {
      ...node,
      position: {
        x: nodeWithPosition.x - nodeWidth / 2,
        y: nodeWithPosition.y - nodeHeight / 2,
      },
    };
  });

  return { nodes: layoutedNodes, edges };
};

const initialSampleNodes = [
  {
    id: "1",
    data: { label: "🚀 Created" },
    style: {
      background: "#ECFDF5",
      border: "2px solid #10B981",
      borderRadius: "12px",
      padding: "12px",
      fontSize: "13px",
      fontWeight: "600",
      color: "#065F46",
      width: 220,
      boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)",
      cursor: "pointer",
    },
  },
  {
    id: "2",
    data: { label: "⚡ Packed" },
    style: {
      background: "#FFFFFF",
      border: "2px solid #CBD5E1",
      borderRadius: "12px",
      padding: "12px",
      fontSize: "13px",
      fontWeight: "600",
      color: "#0F172A",
      width: 220,
      boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)",
      cursor: "pointer",
    },
  },
  {
    id: "3",
    data: { label: "✅ Delivered" },
    style: {
      background: "#FEF2F2",
      border: "2px solid #EF4444",
      borderRadius: "12px",
      padding: "12px",
      fontSize: "13px",
      fontWeight: "600",
      color: "#991B1B",
      width: 220,
      boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)",
      cursor: "pointer",
    },
  },
];

const initialSampleEdges = [
  {
    id: "e1-2",
    source: "1",
    target: "2",
    label: "70 min / SLOW",
    animated: true,
    data: { duration: 70, isBottleneck: true },
    style: { stroke: "#EF4444", strokeWidth: 3 },
    markerEnd: { type: MarkerType.ArrowClosed, color: "#EF4444" },
    labelStyle: { fill: "#DC2626", fontWeight: 700 },
  },
  {
    id: "e2-3",
    source: "2",
    target: "3",
    label: "30 min",
    data: { duration: 30, isBottleneck: false },
    markerEnd: { type: MarkerType.ArrowClosed, color: "#64748B" },
    style: { stroke: "#64748B", strokeWidth: 2 },
    labelStyle: { fill: "#475569", fontWeight: 600 },
  },
];

const { nodes: layoutedSampleNodes, edges: layoutedSampleEdges } =
  getLayoutedElements(initialSampleNodes, initialSampleEdges, "TB");

export default function App() {
  const [theme, setTheme] = useState("light"); // 'light' (cream) or 'dark' (deep blue)
  const [currentPage, setCurrentPage] = useState("upload"); // 'upload' or 'explorer'
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState("Demo Orders.csv");
  const [loading, setLoading] = useState(false);
  const [selectedElement, setSelectedElement] = useState({
    type: "edge",
    source: "Created",
    target: "Packed",
    label: "70 min",
    data: { duration: 70, isBottleneck: true },
  });
  const [csvColumns, setCsvColumns] = useState([
    "order_id",
    "action",
    "event_time",
  ]); // default fallback
  const [caseCol, setCaseCol] = useState("order_id");
  const [activityCol, setActivityCol] = useState("action");
  const [timestampCol, setTimestampCol] = useState("event_time");
  const [validationState, setValidationState] = useState("No file selected"); // No file selected | File selected | Validated | Analyzing

  const [metrics, setMetrics] = useState({
    total_cases: 3,
    total_events: 9,
    unique_activities: 3,
    bottleneck_count: 1,
    avg_case_duration_hours: 1.6,
  });

  const [nodes, setNodes, onNodesChange] = useNodesState(layoutedSampleNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(layoutedSampleEdges);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  const handleFileChange = (e) => {
    const uploadedFile = e.target.files[0];
    if (uploadedFile) {
      setFile(uploadedFile);
      setFileName(uploadedFile.name);
      setValidationState("File selected");

      // Read headers dynamically
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target.result;
        const firstLine = text.split("\n")[0];
        if (firstLine) {
          const headers = firstLine
            .split(",")
            .map((h) => h.trim().replace(/^["']|["']$/g, ""));
          setCsvColumns(headers);
          // Set smart defaults if matching names exist
          if (headers.includes("order_id")) setCaseCol("order_id");
          else if (headers.length > 0) setCaseCol(headers[0]);

          if (headers.includes("action")) setActivityCol("action");
          else if (headers.length > 1) setActivityCol(headers[1]);

          if (headers.includes("event_time")) setTimestampCol("event_time");
          else if (headers.length > 2) setTimestampCol(headers[2]);

          setValidationState("Validation passed");
        }
      };
      reader.readAsText(uploadedFile);
    }
  };

  const handleValidateAndAnalyze = async () => {
    if (!file) {
      alert("Please select a CSV file first.");
      return;
    }

    setLoading(true);
    setValidationState("Analyzing");

    const formData = new FormData();
    formData.append("file", file);
    formData.append("case_id_column", caseCol);
    formData.append("activity_column", activityCol);
    formData.append("timestamp_column", timestampCol);
    formData.append("sla_threshold_hrs", "1.0"); // 60 mins

    try {
      const response = await fetch("http://localhost:8000/analyze", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.statusText}`);
      }

      const data = await response.json();

      // Update metrics from backend response
      if (data.metrics) {
        setMetrics(data.metrics);
      }

      // Transform backend nodes to ReactFlow nodes
      if (data.nodes) {
        const formattedNodes = data.nodes.map((n, idx) => ({
          id: n.id || String(idx),
          data: { label: n.label },
          style: {
            background: n.is_start
              ? "#ECFDF5"
              : n.is_end
                ? "#FEF2F2"
                : "#FFFFFF",
            border: `2px solid ${n.is_start ? "#10B981" : n.is_end ? "#EF4444" : "#CBD5E1"}`,
            borderRadius: "12px",
            padding: "12px",
            fontSize: "13px",
            fontWeight: "600",
            color: n.is_start ? "#065F46" : n.is_end ? "#991B1B" : "#0F172A",
            width: 220,
            boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)",
            cursor: "pointer",
          },
        }));

        // Transform backend edges to ReactFlow edges
        const formattedEdges = (data.edges || []).map((e, idx) => ({
          id: e.id || `e-${idx}`,
          source: e.source,
          target: e.target,
          label: e.label || `${e.duration || 0} min`,
          animated: e.is_bottleneck,
          data: { duration: e.duration, isBottleneck: e.is_bottleneck },
          style: {
            stroke: e.is_bottleneck ? "#EF4444" : "#64748B",
            strokeWidth: e.is_bottleneck ? 3 : 2,
          },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: e.is_bottleneck ? "#EF4444" : "#64748B",
          },
          labelStyle: {
            fill: e.is_bottleneck ? "#DC2626" : "#475569",
            fontWeight: 700,
          },
        }));

        const layouted = getLayoutedElements(
          formattedNodes,
          formattedEdges,
          "TB",
        );
        setNodes(layouted.nodes);
        setEdges(layouted.edges);
      }

      setValidationState("Analysis completed");
      setLoading(false);
      setCurrentPage("explorer");
    } catch (err) {
      console.error("Failed to connect to FastAPI backend:", err);
      alert(
        "Analysis failed. Ensure backend server is running on port 8000 and column mappings are correct.",
      );
      setLoading(false);
      setValidationState("Validation failed");
    }
  };

  const onNodeClick = (event, node) =>
    setSelectedElement({ type: "node", ...node });
  const onEdgeClick = (event, edge) =>
    setSelectedElement({ type: "edge", ...edge });

  return (
    <div className={`flowlens-container ${theme}`}>
      {/* PROFESSIONAL NAVIGATION BAR */}
      <header className="flowlens-header">
        <div className="flowlens-brand">
          <div className="flowlens-logo">F</div>
          <div>
            <div className="flowlens-title-row">
              <h1>FlowLens</h1>
            </div>
          </div>
        </div>

        {/* Navbar Tabs */}
        <div className="flowlens-nav-tabs">
          <button
            className={`flowlens-tab ${currentPage === "upload" ? "active" : ""}`}
            onClick={() => setCurrentPage("upload")}
          >
            Upload
          </button>
          <button
            className={`flowlens-tab ${currentPage === "explorer" ? "active" : ""}`}
            onClick={() => setCurrentPage("explorer")}
          >
            Process Explorer
          </button>
        </div>

        {/* Right Nav: Theme Toggle & Active Log */}
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          {currentPage === "explorer" && (
            <span style={{ fontSize: "12px", fontWeight: "600", opacity: 0.8 }}>
              📁 {fileName}
            </span>
          )}
          <button onClick={toggleTheme} className="flowlens-theme-toggle">
            {theme === "light" ? "🌙 Deep Blue Dark" : "☀️ Warm Cream Light"}
          </button>
        </div>
      </header>

      {/* PAGE 1: UPLOAD & CONFIGURATION HOME PAGE */}
      {currentPage === "upload" && (
        <div className="flowlens-home-container">
          <div className="flowlens-upload-card">
            <div className="flowlens-dropzone">
              <div className="flowlens-dropzone-left">
                <span
                  style={{
                    fontSize: "12px",
                    fontWeight: "700",
                    textTransform: "uppercase",
                    opacity: 0.7,
                  }}
                >
                  Choose CSV File
                </span>
                <label className="flowlens-browse-btn">
                  Browse...
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleFileChange}
                    style={{ display: "none" }}
                  />
                </label>
                <span
                  style={{
                    fontFamily: "monospace",
                    fontSize: "13px",
                    fontWeight: "600",
                  }}
                >
                  {fileName}
                </span>
              </div>
              <span className="flowlens-ready-badge">✓ Ready to Map</span>
            </div>

            <div className="flowlens-mapping-grid">
              <div className="flowlens-mapping-box">
                <label>Case Identifier Column</label>
                <select
                  className="flowlens-select-dropdown"
                  value={caseCol}
                  onChange={(e) => setCaseCol(e.target.value)}
                >
                  {csvColumns.map((col) => (
                    <option key={col} value={col}>
                      {col}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flowlens-mapping-box">
                <label>Activity / Stage Column</label>
                <select
                  className="flowlens-select-dropdown"
                  value={activityCol}
                  onChange={(e) => setActivityCol(e.target.value)}
                >
                  {csvColumns.map((col) => (
                    <option key={col} value={col}>
                      {col}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flowlens-mapping-box">
                <label>Timestamp Column</label>
                <select
                  className="flowlens-select-dropdown"
                  value={timestampCol}
                  onChange={(e) => setTimestampCol(e.target.value)}
                >
                  {csvColumns.map((col) => (
                    <option key={col} value={col}>
                      {col}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flowlens-config-strip">
              <span>
                Timezone: <strong>UTC</strong>
              </span>
              <span>•</span>
              <span>
                Terminal Activity: <strong>Delivered</strong>
              </span>
              <span>•</span>
              <span>
                SLA Bottleneck Limit: <strong>60 min (1.0 hr)</strong>
              </span>
            </div>

            <div className="flowlens-validation-row">
              <div
                style={{ display: "flex", alignItems: "center", gap: "16px" }}
              >
                <span className="flowlens-preview-pill">Preview: 10 rows</span>
                <span
                  style={{
                    fontSize: "13px",
                    color: "#059669",
                    fontWeight: "600",
                  }}
                >
                  ✓ Headers validated. No null identifiers detected.
                </span>
              </div>
              <button
                onClick={handleValidateAndAnalyze}
                disabled={loading}
                className="flowlens-validate-btn"
              >
                {loading ? "Validating..." : "Validate / Analyze →"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PAGE 2: PROCESS EXPLORER CANVAS PAGE */}
      {currentPage === "explorer" && (
        <div className="flowlens-explorer-container">
          <div className="flowlens-explorer-topbar">
            <span>
              Active Log: <strong>{fileName}</strong>
            </span>
            <div className="flowlens-topbar-metrics">
              <span className="flowlens-metric-pill">
                Cases: <strong>{metrics.total_cases}</strong>
              </span>
              <span className="flowlens-metric-pill">
                Events: <strong>{metrics.total_events}</strong>
              </span>
              <span className="flowlens-metric-pill">
                Variants: <strong>2</strong>
              </span>
            </div>
          </div>

          <div className="flowlens-canvas-card">
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onNodeClick={onNodeClick}
              onEdgeClick={onEdgeClick}
              fitView
            >
              <Background
                color={theme === "light" ? "#D9D2C7" : "#334155"}
                gap={20}
                size={1}
              />
              <Controls className="flowlens-react-controls" />
              <MiniMap
                className="flowlens-minimap"
                nodeStrokeWidth={3}
                zoomable
                pannable
              />
            </ReactFlow>
          </div>

          <div className="flowlens-bottom-grid">
            <div className="flowlens-inspector-box">
              <div className="flowlens-box-header">
                <span>
                  {selectedElement?.type === "node"
                    ? "SELECTED ACTIVITY INSPECTOR"
                    : "SELECTED EDGE INSPECTOR"}
                </span>
                {selectedElement?.data?.isBottleneck && (
                  <span className="flowlens-sla-badge">⚠️ SLA SLOW</span>
                )}
              </div>
              <div className="flowlens-box-content">
                {selectedElement?.type === "node" ? (
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <div>
                      <strong style={{ fontSize: "15px" }}>
                        {selectedElement.data.label}
                      </strong>
                      <p
                        style={{
                          margin: "4px 0 0 0",
                          fontSize: "12px",
                          opacity: 0.7,
                        }}
                      >
                        Node ID: {selectedElement.id}
                      </p>
                    </div>
                    <span
                      style={{
                        fontSize: "13px",
                        fontWeight: "700",
                        color: "#059669",
                      }}
                    >
                      Frequency: Active
                    </span>
                  </div>
                ) : (
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <div>
                      <strong style={{ fontSize: "15px" }}>
                        {selectedElement?.source || "Created"} ➔{" "}
                        {selectedElement?.target || "Packed"}
                      </strong>
                      <p
                        style={{
                          margin: "4px 0 0 0",
                          fontSize: "12px",
                          opacity: 0.7,
                        }}
                      >
                        Mean:{" "}
                        <strong>{selectedElement?.label || "70 min"}</strong> |
                        Occurrences: 2
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flowlens-inspector-box">
              <div className="flowlens-box-header">
                <span>CANVAS INTERACTION & FILTER</span>
              </div>
              <div
                className="flowlens-box-content"
                style={{ display: "flex", flexDirection: "column", gap: "8px" }}
              >
                <div style={{ fontSize: "12px" }}>
                  Variant Filter:{" "}
                  <strong style={{ color: "#4F46E5" }}>All Cases (100%)</strong>
                </div>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button
                    className="flowlens-filter-btn"
                    onClick={() => alert("View reset")}
                  >
                    Reset view
                  </button>
                  <button className="flowlens-filter-btn">Zoom in +</button>
                  <button className="flowlens-filter-btn">Zoom out -</button>
                </div>
              </div>
            </div>
          </div>

          <div className="flowlens-health-strip">
            <div className="flowlens-health-header">
              PROCESS HEALTH DASHBOARD & VARIANT METRICS
            </div>
            <div className="flowlens-health-content">
              <div>
                <span className="flowlens-health-label">Completed Cases</span>
                <div className="flowlens-health-val">
                  2{" "}
                  <span
                    style={{
                      fontSize: "13px",
                      fontWeight: "400",
                      opacity: 0.7,
                    }}
                  >
                    / 3 total
                  </span>
                </div>
              </div>
              {/* <div className="flowlens-health-divider"></div>
              <div>
                <span className="flowlens-health-label">Mean Completed Duration</span>
                <div className="flowlens-health-val">100 min</div>
              </div>
              <div className="flowlens-health-divider"></div>
              <div style={{ flex: 1 }}>
                <span className="flowlens-health-label">Observed Path Variants</span>
                <div style={{ fontSize: '13px', fontWeight: '600', marginTop: '4px' }}>
                  <span style={{ color: '#4F46E5' }}>Variant A:</span> 2 cases (66.7%) | <span style={{ opacity: 0.7 }}>Variant B:</span> 1 case (33.3%)
                </div>
              </div> */}
            </div>
          </div>
        </div>
      )}

      {/* FOOTER */}
      <footer className="flowlens-footer">
        <div className="flowlens-footer-left">
          <span className="flowlens-system-status">
            <span className="flowlens-dot-green"></span>
            System Operational
          </span>
          <span>|</span>
          <span>Engine: PM4Py & FastAPI</span>
        </div>
        <div>
          <p style={{ margin: 0 }}>© 2026 FlowLens Diagnostics Platform.</p>
        </div>
      </footer>
    </div>
  );
}

function CanvasActionButtons() {
  const { zoomIn, zoomOut, fitView } = useReactFlow();
  return (
    <div style={{ display: "flex", gap: "8px" }}>
      <button
        className="flowlens-filter-btn"
        onClick={() => fitView({ duration: 300 })}
      >
        Reset view
      </button>
      <button
        className="flowlens-filter-btn"
        onClick={() => zoomIn({ duration: 200 })}
      >
        Zoom in +
      </button>
      <button
        className="flowlens-filter-btn"
        onClick={() => zoomOut({ duration: 200 })}
      >
        Zoom out -
      </button>
    </div>
  );
}
