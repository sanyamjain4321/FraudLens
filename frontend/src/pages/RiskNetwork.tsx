import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Network, Info, User, Smartphone, Globe, ShoppingBag, Loader2 } from 'lucide-react';
import { api } from '../lib/api';

interface GraphNode {
  id: string;
  label: string;
  type: 'customer' | 'device' | 'ip' | 'merchant';
  riskScore: number;
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
  connections: number;
}
interface GraphEdge { source: string; target: string; }

const NODE_COLORS: Record<string, string> = {
  customer: '#2563eb', // blue
  device: '#ea580c',   // orange
  ip: '#7c3aed',       // violet
  merchant: '#16a34a', // green
};

export default function RiskNetwork() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [edges, setEdges] = useState<GraphEdge[]>([]);
  const [selected, setSelected] = useState<GraphNode | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const animFrameRef = useRef<number>(0);

  const buildGraph = useCallback(async () => {
    try {
      const data = await api.transactions.list({ per_page: 100 });
      const items: any[] = data.items ?? [];

      const nodeMap = new Map<string, GraphNode>();
      const edgeSet = new Set<string>();
      const edgeList: GraphEdge[] = [];

      const addNode = (id: string, type: GraphNode['type'], risk: number) => {
        if (!id) return;
        if (nodeMap.has(id)) {
          const n = nodeMap.get(id)!;
          n.riskScore = Math.max(n.riskScore, risk);
          n.connections++;
          return;
        }
        nodeMap.set(id, {
          id,
          label: id.slice(-8),
          type,
          riskScore: risk,
          connections: 1,
          x: Math.random() * 600 + 100,
          y: Math.random() * 400 + 100,
          vx: 0,
          vy: 0,
        });
      };

      const addEdge = (src: string, tgt: string) => {
        const key = [src, tgt].sort().join('→');
        if (!edgeSet.has(key)) { edgeSet.add(key); edgeList.push({ source: src, target: tgt }); }
      };

      items.forEach((t: any) => {
        const risk = t.risk_score ?? 0;
        if (t.customer_id) addNode(t.customer_id, 'customer', risk);
        if (t.device_id) {
          addNode(t.device_id, 'device', risk);
          if (t.customer_id) addEdge(t.customer_id, t.device_id);
        }
        if (t.ip_address) {
          addNode(t.ip_address, 'ip', risk);
          if (t.customer_id) addEdge(t.customer_id, t.ip_address);
        }
        if (t.merchant_name) {
          addNode(t.merchant_name, 'merchant', risk);
          if (t.customer_id) addEdge(t.customer_id, t.merchant_name);
        }
      });

      setNodes(Array.from(nodeMap.values()));
      setEdges(edgeList);
    } catch (_) {}
    finally { setLoading(false); }
  }, []);

  useEffect(() => { buildGraph(); }, [buildGraph]);

  // Force-directed simulation + canvas rendering in Light Theme
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || nodes.length === 0) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = canvas.offsetWidth;
    const H = canvas.offsetHeight;
    canvas.width = W;
    canvas.height = H;

    const localNodes: GraphNode[] = nodes.map(n => ({ ...n, x: n.x ?? Math.random() * W, y: n.y ?? Math.random() * H, vx: n.vx ?? 0, vy: n.vy ?? 0 }));
    const nodeById = new Map(localNodes.map(n => [n.id, n]));

    const filteredNodes = filter === 'all' ? localNodes : localNodes.filter(n => n.type === filter);
    const filteredIds = new Set(filteredNodes.map(n => n.id));
    const filteredEdges = edges.filter(e => filteredIds.has(e.source) && filteredIds.has(e.target));

    const onClick = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      let found: GraphNode | null = null;
      for (const n of filteredNodes) {
        const dx = (n.x ?? 0) - mx, dy = (n.y ?? 0) - my;
        if (Math.sqrt(dx*dx + dy*dy) < 16) { found = n; break; }
      }
      setSelected(found);
    };
    canvas.addEventListener('click', onClick);

    const simulate = () => {
      for (const n of filteredNodes) {
        n.vx = (n.vx ?? 0) * 0.9;
        n.vy = (n.vy ?? 0) * 0.9;
        for (const m of filteredNodes) {
          if (m === n) continue;
          const dx = (n.x ?? 0) - (m.x ?? 0), dy = (n.y ?? 0) - (m.y ?? 0);
          const dist = Math.max(Math.sqrt(dx*dx + dy*dy), 1);
          const force = 1200 / (dist * dist);
          n.vx += (dx / dist) * force;
          n.vy += (dy / dist) * force;
        }
      }
      for (const edge of filteredEdges) {
        const src = nodeById.get(edge.source), tgt = nodeById.get(edge.target);
        if (!src || !tgt) continue;
        const dx = (tgt.x ?? 0) - (src.x ?? 0), dy = (tgt.y ?? 0) - (src.y ?? 0);
        const dist = Math.max(Math.sqrt(dx*dx + dy*dy), 1);
        const force = (dist - 110) * 0.04;
        src.vx = (src.vx ?? 0) + (dx / dist) * force; src.vy = (src.vy ?? 0) + (dy / dist) * force;
        tgt.vx = (tgt.vx ?? 0) - (dx / dist) * force; tgt.vy = (tgt.vy ?? 0) - (dy / dist) * force;
      }
      for (const n of filteredNodes) {
        n.vx = (n.vx ?? 0) + (W / 2 - (n.x ?? 0)) * 0.002;
        n.vy = (n.vy ?? 0) + (H / 2 - (n.y ?? 0)) * 0.002;
        n.x = (n.x ?? W/2) + (n.vx ?? 0);
        n.y = (n.y ?? H/2) + (n.vy ?? 0);
        n.x = Math.max(20, Math.min(W - 20, n.x));
        n.y = Math.max(20, Math.min(H - 20, n.y));
      }

      // Draw Light Canvas
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, W, H);

      // Edges
      for (const edge of filteredEdges) {
        const src = nodeById.get(edge.source), tgt = nodeById.get(edge.target);
        if (!src || !tgt) continue;
        ctx.beginPath();
        ctx.moveTo(src.x ?? 0, src.y ?? 0);
        ctx.lineTo(tgt.x ?? 0, tgt.y ?? 0);
        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 1.2;
        ctx.stroke();
      }

      // Nodes
      for (const n of filteredNodes) {
        const isHighRisk = n.riskScore > 60;
        const color = isHighRisk ? '#dc2626' : NODE_COLORS[n.type];
        const radius = Math.max(8, Math.min(16, 8 + n.connections * 1.5));

        if (isHighRisk) {
          ctx.beginPath();
          ctx.arc(n.x ?? 0, n.y ?? 0, radius + 5, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(220,38,38,0.12)';
          ctx.fill();
        }

        ctx.beginPath();
        ctx.arc(n.x ?? 0, n.y ?? 0, radius, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
        ctx.strokeStyle = selected?.id === n.id ? '#0f172a' : '#ffffff';
        ctx.lineWidth = selected?.id === n.id ? 3 : 2;
        ctx.stroke();

        ctx.fillStyle = '#475569';
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(n.label, n.x ?? 0, (n.y ?? 0) + radius + 12);
      }

      animFrameRef.current = requestAnimationFrame(simulate);
    };

    animFrameRef.current = requestAnimationFrame(simulate);
    return () => {
      cancelAnimationFrame(animFrameRef.current);
      canvas.removeEventListener('click', onClick);
    };
  }, [nodes, edges, filter, selected]);

  const connectedCount = selected
    ? edges.filter(e => e.source === selected.id || e.target === selected.id).length
    : 0;

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      {/* Filters & Legend */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-1 shadow-xs">
          {['all', 'customer', 'device', 'ip', 'merchant'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1 text-xs font-bold rounded-md uppercase tracking-wider transition-colors ${filter === f ? 'bg-sky-50 text-sky-700' : 'text-slate-600 hover:bg-slate-50'}`}
            >
              {f}
            </button>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-4 text-xs font-medium text-slate-600">
          {Object.entries(NODE_COLORS).map(([type, color]) => (
            <span key={type} className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </span>
          ))}
          <span className="flex items-center gap-1.5 font-bold text-red-600">
            <span className="w-2.5 h-2.5 rounded-full bg-red-600" /> High Risk
          </span>
        </div>
      </div>

      <div className="flex gap-4 flex-col lg:flex-row">
        {/* Canvas Graph */}
        <div className="flex-1 bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs relative" style={{ height: 520 }}>
          {loading ? (
            <div className="flex items-center justify-center h-full text-slate-400 gap-2 text-xs">
              <Loader2 size={18} className="animate-spin text-sky-600" /> Building relationship graph...
            </div>
          ) : nodes.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400">
              <Network size={36} className="mb-2 text-slate-300" />
              <p className="font-semibold text-slate-600 text-xs">No graph entities detected</p>
              <p className="text-[11px] text-slate-400 mt-1">Start Traffic Lab to populate network relationships.</p>
            </div>
          ) : (
            <canvas ref={canvasRef} style={{ width: '100%', height: '100%' }} />
          )}
        </div>

        {/* Selected Entity Inspector */}
        <div className="w-full lg:w-72 bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center gap-2 mb-4 border-b border-slate-100 pb-2">
            <Info size={15} className="text-sky-600" />
            <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">Entity Details</h3>
          </div>

          {selected ? (
            <div className="space-y-3.5 text-xs">
              <div>
                <p className="text-slate-400 font-bold uppercase text-[10px]">Entity Type</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: NODE_COLORS[selected.type] }} />
                  <span className="font-bold text-slate-900 capitalize">{selected.type}</span>
                </div>
              </div>

              <div>
                <p className="text-slate-400 font-bold uppercase text-[10px]">Identifier</p>
                <p className="font-mono text-slate-900 font-semibold mt-0.5 break-all">{selected.id}</p>
              </div>

              <div>
                <p className="text-slate-400 font-bold uppercase text-[10px]">Risk Score</p>
                <p className={`text-2xl font-extrabold font-mono mt-0.5 ${
                  selected.riskScore >= 80 ? 'text-red-600' :
                  selected.riskScore >= 60 ? 'text-orange-600' :
                  selected.riskScore >= 30 ? 'text-amber-600' : 'text-emerald-600'
                }`}>{selected.riskScore.toFixed(0)}</p>
              </div>

              <div>
                <p className="text-slate-400 font-bold uppercase text-[10px]">Cluster Connections</p>
                <p className="font-bold text-slate-900 text-sm mt-0.5">{connectedCount} linked entities</p>
              </div>

              <div className="pt-2 border-t border-slate-100">
                <Link to={`/app/transactions?search=${selected.id}`} className="text-xs font-bold text-sky-600 hover:underline">
                  Filter transactions for entity →
                </Link>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-slate-400">
              <Network size={24} className="mx-auto mb-2 text-slate-300" />
              <p className="text-xs">Click any node on the graph to inspect relationship details.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
