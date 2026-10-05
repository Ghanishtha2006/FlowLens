import { useState } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  MarkerType,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import dagre from '@dagrejs/dagre';
import './App.css';

// Dagre Layout Generator
const getLayoutedElements = (nodes, edges, direction = 'TB') => {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));

  const nodeWidth = 240;
  const nodeHeight = 80;
  dagreGraph.setGraph({ rankdir: direction, nodesep: 80, ranksep: 100 });

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
  { id: '1', data: { label: '🚀 Created' }, style: { background: '#065F46', border: '2px solid #34D399', borderRadius: '12px', padding: '14px', fontSize: '13px', fontWeight: '600', color: '#F8FAFC', width: 240, boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)', cursor: 'pointer' } },
  { id: '2', data: { label: '⚡ Packed' }, style: { background: '#1E293B', border: '2px solid #475569', borderRadius: '12px', padding: '14px', fontSize: '13px', fontWeight: '600', color: '#F8FAFC', width: 240, boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)', cursor: 'pointer' } },
  { id: '3', data: { label: '✅ Delivered' }, style: { background: '#14532D', border: '2px solid #4ADE80', borderRadius: '12px', padding: '14px', fontSize: '13px', fontWeight: '600', color: '#F8FAFC', width: 240, boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)', cursor: 'pointer' } },
];

const initialSampleEdges = [
  { id: 'e1-2', source: '1', target: '2', label: '70 min / SLOW', animated: true, data: { duration: 70, isBottleneck: true }, style: { stroke: '#EF4444', strokeWidth: 3 }, markerEnd: { type: MarkerType.ArrowClosed, color: '#EF4444' }, labelStyle: { fill: '#F87171', fontWeight: 700 } },
  { id: 'e2-3', source: '2', target: '3', label: '30 min', data: { duration: 30, isBottleneck: false }, markerEnd: { type: MarkerType.ArrowClosed, color: '#94A3B8' }, style: { stroke: '#64748B', strokeWidth: 2 }, labelStyle: { fill: '#94A3B8', fontWeight: 600 } },
];

const { nodes: layoutedSampleNodes, edges: layoutedSampleEdges } = getLayoutedElements(initialSampleNodes, initialSampleEdges, 'TB');

export default function App() {
  const [currentPage, setCurrentPage] = useState('upload'); // 'upload' or 'explorer'
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState('orders.csv (4.2 MB)');
  const [loading, setLoading] = useState(false);
  const [selectedElement, setSelectedElement] = useState(null);
  
  const [metrics, setMetrics] = useState({
    total_cases: 3,
    total_events: 9,
    unique_activities: 3,
    bottleneck_count: 1,
    avg_case_duration_hours: 1.6
  });
  
  const [nodes, setNodes, onNodesChange] = useNodesState(layoutedSampleNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(layoutedSampleEdges);

  const handleFileChange = (e) => {
    if (e.target.files[0]) {
      setFile(e.target.files[0]);
      setFileName(e.target.files[0].name);
    }
  };

  const handleValidateAndAnalyze = async () => {
    setLoading(true);
    // Switch to Process Explorer view after short simulated validation delay
    setTimeout(() => {
      setLoading(false);
      setCurrentPage('explorer');
    }, 600);
  };

  const onNodeClick = (event, node) => setSelectedElement({ type: 'node', ...node });
  const onEdgeClick = (event, edge) => setSelectedElement({ type: 'edge', ...edge });

  return (
    <div className="flowlens-container">
      
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
            className={`flowlens-tab ${currentPage === 'upload' ? 'active' : ''}`}
            onClick={() => setCurrentPage('upload')}
          >
            Upload
          </button>
          <button 
            className={`flowlens-tab ${currentPage === 'explorer' ? 'active' : ''}`}
            onClick={() => setCurrentPage('explorer')}
          >
            Process Explorer
          </button>
          <button className="flowlens-tab">Dashboard</button>
        </div>

        {/* Right Info Header Badge */}
        <div style={{ fontSize: '12px', color: '#94A3B8' }}>
          {currentPage === 'explorer' && <span style={{ color: '#34D399', fontWeight: 'bold' }}>Active Log: {fileName}</span>}
        </div>
      </header>

      {/* PAGE 1: UPLOAD & CONFIGURATION HOME PAGE */}
      {currentPage === 'upload' && (
        <div className="flowlens-home-container">
          <div className="flowlens-upload-card">
            
            {/* Choose CSV Dropzone Box */}
            <div className="flowlens-dropzone">
              <div className="flowlens-dropzone-left">
                <span style={{ fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', color: '#94A3B8' }}>Choose CSV File</span>
                <label className="flowlens-browse-btn">
                  Browse...
                  <input type="file" accept=".csv" onChange={handleFileChange} style={{ display: 'none' }} />
                </label>
                <span style={{ fontFamily: 'monospace', fontSize: '13px', color: '#818CF8' }}>{fileName}</span>
              </div>
              <span className="flowlens-ready-badge">✓ Ready to Map</span>
            </div>

            {/* Column Mapping Selectors */}
            <div className="flowlens-mapping-grid">
              <div className="flowlens-mapping-box">
                <label>Case Identifier Column</label>
                <select className="flowlens-select-dropdown" defaultValue="order_id">
                  <option value="order_id">Case ID: order_id</option>
                </select>
              </div>
              <div className="flowlens-mapping-box">
                <label>Activity / Stage Column</label>
                <select className="flowlens-select-dropdown" defaultValue="action">
                  <option value="action">Activity: action</option>
                </select>
              </div>
              <div className="flowlens-mapping-box">
                <label>Timestamp Column</label>
                <select className="flowlens-select-dropdown" defaultValue="event_time">
                  <option value="event_time">Timestamp: event_time</option>
                </select>
              </div>
            </div>

            {/* Config Strip */}
            <div className="flowlens-config-strip">
              <span>Timezone: <strong>UTC</strong></span>
              <span>•</span>
              <span>Terminal Activity: <strong>Delivered</strong></span>
              <span>•</span>
              <span>SLA Bottleneck Limit: <strong>60 min (1.0 hr)</strong></span>
            </div>

            {/* Validation & Submit Row */}
            <div className="flowlens-validation-row">
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <span className="flowlens-preview-pill">Preview: 10 rows</span>
                <span style={{ fontSize: '13px', color: '#34D399', fontWeight: '500' }}>✓ Headers validated. No null identifiers detected.</span>
              </div>
              <button 
                onClick={handleValidateAndAnalyze}
                disabled={loading}
                className="flowlens-validate-btn"
              >
                {loading ? 'Validating...' : 'Validate / Analyze →'}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* PAGE 2: PROCESS EXPLORER CANVAS PAGE */}
      {currentPage === 'explorer' && (
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
          
          {/* Top Quick Stats Strip */}
          <div style={{ display: 'flex', gap: '24px', padding: '10px 28px', backgroundColor: '#0F172A', borderBottom: '1px solid #1E293B', fontSize: '13px' }}>
            <span>Cases: <strong style={{ color: '#818CF8' }}>{metrics.total_cases}</strong></span>
            <span>Events: <strong style={{ color: '#818CF8' }}>{metrics.total_events}</strong></span>
            <span>Variants: <strong style={{ color: '#818CF8' }}>2</strong></span>
          </div>

          {/* Main Canvas Workspace */}
          <div className="flowlens-workspace">
            <div className="flowlens-canvas-wrapper">
              <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onNodeClick={onNodeClick}
                onEdgeClick={onEdgeClick}
                fitView
              >
                <Background color="#334155" gap={24} size={1} />
                <Controls className="flowlens-react-controls" />
                <MiniMap className="flowlens-minimap" nodeStrokeWidth={3} zoomable pannable />
              </ReactFlow>
            </div>

            {/* Inspector Sidebar */}
            {selectedElement && (
              <div className="flowlens-sidebar">
                <div className="flowlens-sidebar-header">
                  <h3>{selectedElement.type === 'node' ? '🔍 Activity Inspector' : '⚡ Edge Inspector'}</h3>
                  <button onClick={() => setSelectedElement(null)} className="flowlens-close-btn">✕</button>
                </div>
                <div className="flowlens-sidebar-body">
                  {selectedElement.type === 'node' ? (
                    <div>
                      <span className="flowlens-field-label">Activity Name</span>
                      <strong className="flowlens-field-value-strong">{selectedElement.data.label}</strong>
                    </div>
                  ) : (
                    <div>
                      <span className="flowlens-field-label">Transition Path</span>
                      <strong className="flowlens-field-value-strong">{selectedElement.source} ➔ {selectedElement.target}</strong>
                      <div style={{ marginTop: '10px' }}>
                        <span className="flowlens-field-label">Mean Duration</span>
                        <span className="flowlens-field-value-red">{selectedElement.label}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
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