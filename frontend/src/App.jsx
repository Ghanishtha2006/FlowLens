import React, { useState } from 'react';
import axios from 'axios';
import { ReactFlow, Background, Controls } from '@xyflow/react';
import '@xyflow/react/dist/style.css';

export default function App() {
  const [file, setFile] = useState(null);
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleUpload = async () => {
    if (!file) {
      alert("Please select a CSV event log first.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    setLoading(true);

    try {
      const response = await axios.post("http://127.0.0.1:8000/analyze", formData);
      const data = response.data;

      const formattedNodes = data.nodes.map((node, idx) => ({
        id: node.id,
        data: { label: node.label },
        position: { x: (idx % 3) * 260 + 80, y: Math.floor(idx / 3) * 160 + 60 },
        style: {
          background: node.is_start ? '#dcfce7' : node.is_end ? '#fee2e2' : '#ffffff',
          border: '2px solid #64748b',
          borderRadius: '8px',
          padding: '12px 18px',
          fontSize: '13px',
          fontWeight: '600',
          color: '#0f172a',
          minWidth: '150px',
          textAlign: 'center'
        }
      }));

      const formattedEdges = data.edges.map(edge => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        label: edge.label,
        animated: edge.is_bottleneck,
        style: {
          stroke: edge.is_bottleneck ? '#dc2626' : '#94a3b8',
          strokeWidth: edge.is_bottleneck ? 2.5 : 1.5,
        },
        labelStyle: {
          fill: edge.is_bottleneck ? '#dc2626' : '#475569',
          fontWeight: edge.is_bottleneck ? '700' : '500',
          fontSize: '12px'
        }
      }));

      setNodes(formattedNodes);
      setEdges(formattedEdges);
      setMetrics(data.metrics);
    } catch (err) {
      alert(err.response?.data?.detail || "Error connecting to backend server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column', fontFamily: 'sans-serif', background: '#f8fafc' }}>
      <header style={{ padding: '14px 28px', background: '#0f172a', color: '#ffffff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>FlowLens</h2>
          <span style={{ fontSize: '12px', color: '#94a3b8' }}>Process Mining & Bottleneck Diagnostics</span>
        </div>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <input
            type="file"
            accept=".csv"
            onChange={(e) => setFile(e.target.files[0])}
            style={{ fontSize: '13px', color: '#cbd5e1' }}
          />
          <button
            onClick={handleUpload}
            disabled={loading}
            style={{
              padding: '8px 18px',
              backgroundColor: '#2563eb',
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontWeight: 500
            }}
          >
            {loading ? "Analyzing..." : "Analyze Log"}
          </button>
        </div>
      </header>

      {metrics && (
        <div style={{ padding: '10px 28px', background: '#ffffff', borderBottom: '1px solid #e2e8f0', display: 'flex', gap: '28px', fontSize: '13px' }}>
          <div><strong>Cases:</strong> {metrics.total_cases}</div>
          <div><strong>Events:</strong> {metrics.total_events}</div>
          <div><strong>Activities:</strong> {metrics.unique_activities}</div>
          <div style={{ color: '#dc2626' }}>
            <strong>Red Edges:</strong> Bottleneck Delay (&gt; 24h)
          </div>
        </div>
      )}

      <div style={{ flex: 1 }}>
        <ReactFlow nodes={nodes} edges={edges} fitView>
          <Background color="#cbd5e1" gap={16} />
          <Controls />
        </ReactFlow>
      </div>
    </div>
  );
}