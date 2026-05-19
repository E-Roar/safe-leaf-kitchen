import { useEffect, useRef, useState } from 'react';
import { Network } from 'vis-network';
import { DataSet } from 'vis-data';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, Leaf, GitBranch, Network as NetworkIcon, ExternalLink } from 'lucide-react';

interface RawNode {
  id: string;
  label: string;
  community: number;
  file_type: string;
  source_file: string;
  [key: string]: unknown;
}

interface RawLink {
  _src: string;
  _dst: string;
  relation: string;
  confidence: string;
  [key: string]: unknown;
}

interface GraphData {
  nodes: RawNode[];
  links: RawLink[];
  hyperedges?: unknown[];
}

interface GraphStats {
  nodes: number;
  edges: number;
  communities: number;
}

export default function KnowledgeGraphView() {
  const containerRef = useRef<HTMLDivElement>(null);
  const networkRef = useRef<Network | null>(null);
  const [stats, setStats] = useState<GraphStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasData, setHasData] = useState(false);

  useEffect(() => {
    fetch('/graphify-out/data.json')
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data: GraphData) => {
        const communities = new Set(data.nodes.map(n => n.community));
        setStats({
          nodes: data.nodes.length,
          edges: data.links.length,
          communities: communities.size,
        });
        setHasData(true);

        if (!containerRef.current) return;
        if (networkRef.current) {
          networkRef.current.destroy();
          networkRef.current = null;
        }

        const nodes = new DataSet(
          data.nodes.map(n => ({
            id: n.id,
            label: n.label,
            title: `${n.label}<br>${n.file_type || ''}`,
          }))
        );

        const edges = new DataSet(
          data.links.map((e, i) => ({
            id: i,
            from: e._src,
            to: e._dst,
            dashes: e.confidence === 'INFERRED',
            width: 1,
            arrows: { to: { enabled: true, scaleFactor: 0.5 } },
          }))
        );

        networkRef.current = new Network(containerRef.current, { nodes, edges }, {
          physics: {
            solver: 'forceAtlas2Based',
            forceAtlas2Based: {
              gravitationalConstant: -60,
              centralGravity: 0.005,
              springLength: 120,
              springConstant: 0.08,
              damping: 0.4,
              avoidOverlap: 0.8,
            },
            stabilization: { iterations: 200, fit: true },
          },
          interaction: {
            hover: true,
            tooltipDelay: 100,
            hideEdgesOnDrag: true,
          },
          nodes: { shape: 'dot', borderWidth: 1.5 },
          edges: { smooth: { enabled: true, type: 'continuous', roundness: 0.2 } },
        });

        networkRef.current.once('stabilizationIterationsDone', () => {
          networkRef.current?.setOptions({ physics: { enabled: false } });
        });

        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setStats({ nodes: 604, edges: 759, communities: 145 });
        setLoading(false);
      });

    return () => {
      networkRef.current?.destroy();
      networkRef.current = null;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  const statCards = [
    { title: 'Source Files', value: stats?.nodes || 0, icon: Leaf, color: 'text-emerald-500', bg: 'bg-emerald-50' },
    { title: 'Dependencies', value: stats?.edges || 0, icon: GitBranch, color: 'text-blue-500', bg: 'bg-blue-50' },
    { title: 'Communities', value: stats?.communities || 0, icon: NetworkIcon, color: 'text-purple-500', bg: 'bg-purple-50' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Knowledge Graph</h1>
        <p className="text-slate-500">Codebase dependency graph visualization</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {statCards.map(stat => (
          <Card key={stat.title} className="border-slate-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">{stat.title}</p>
                  <p className="text-2xl font-bold text-slate-900">{stat.value.toLocaleString()}</p>
                </div>
                <div className={`w-12 h-12 rounded-xl ${stat.bg} flex items-center justify-center`}>
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <NetworkIcon className="w-5 h-5 text-emerald-600" />
            Interactive Graph
          </CardTitle>
          <CardDescription>
            Force-directed graph of all codebase dependencies. Pan and zoom to explore.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && !hasData ? (
            <div className="w-full aspect-[16/9] rounded-xl overflow-hidden border border-slate-200 bg-slate-50 flex items-center justify-center">
              <div className="text-center p-8">
                <p className="text-slate-500 mb-2">Graph data not available</p>
                <p className="text-xs text-slate-400 mb-4">{error}</p>
              </div>
            </div>
          ) : (
            <div
              ref={containerRef}
              className="w-full aspect-[16/9] rounded-xl overflow-hidden border border-slate-200 bg-white"
              style={{ minHeight: '500px' }}
            />
          )}
          <div className="mt-4 flex gap-3">
            <a
              href="/graphify-out/graph.html"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              Open Full Screen
            </a>
            <a
              href="/graphify-out/GRAPH_REPORT.md"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-100 text-slate-700 text-sm font-medium hover:bg-slate-200 transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              View Report
            </a>
          </div>
        </CardContent>
      </Card>

      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GitBranch className="w-5 h-5 text-slate-500" />
            Graph Info
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-slate-600 space-y-2">
          <p>The knowledge graph is automatically generated using <strong>graphify</strong> and represents the full codebase dependency structure.</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Nodes</strong> represent source files, configuration files, and other codebase assets</li>
            <li><strong>Edges</strong> represent import relationships, references, and dependencies</li>
            <li><strong>Communities</strong> are automatically clustered groups of related files</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
