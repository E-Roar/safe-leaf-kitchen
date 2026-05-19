import { useEffect, useRef, useState } from 'react';
import { Network } from 'vis-network';
import { DataSet } from 'vis-data';
import { supabase } from '@/lib/supabaseClient';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, Leaf, GitBranch, Network as NetworkIcon, ExternalLink, Database } from 'lucide-react';

interface GraphNode {
  id: string;
  label: string;
  group: string;
  title: string;
  shape: string;
  color: { background: string; border: string };
  size: number;
}

interface GraphEdge {
  from: string;
  to: string;
  label: string;
  dashes: boolean;
  width: number;
  color: { color: string; opacity: number };
}

const LEAF_COLOR = { background: '#d1fae5', border: '#059669' };
const RECIPE_COLOR = { background: '#fef3c7', border: '#d97706' };
const CATEGORY_COLOR = { background: '#e0e7ff', border: '#4f46e5' };
const CUISINE_COLOR = { background: '#fce7f3', border: '#db2777' };

export default function KnowledgeGraphView() {
  const containerRef = useRef<HTMLDivElement>(null);
  const networkRef = useRef<Network | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({ nodes: 0, edges: 0, communities: 0 });

  useEffect(() => {
    let destroyed = false;

    const buildGraph = async () => {
      try {
        const [recipesRes, leavesRes] = await Promise.all([
          supabase.from('recipes').select('*'),
          supabase.from('leaves').select('*'),
        ]);

        let recipes = recipesRes.data || [];
        let leaves = leavesRes.data || [];

        if (recipes.length === 0 && leaves.length === 0) {
          const { leaves: staticLeaves } = await import('@/data/leaves');
          const { recipes: staticRecipes } = await import('@/data/recipes');
          recipes = staticRecipes as any[];
          leaves = staticLeaves as any[];
        }
        const nodes: GraphNode[] = [];
        const edges: GraphEdge[] = [];

        leaves.forEach((leaf: any) => {
          nodes.push({
            id: `leaf-${leaf.id}`,
            label: leaf.name?.en || leaf.name?.fr || `Leaf ${leaf.id}`,
            group: 'leaf',
            title: `<b>${leaf.name?.en || leaf.name?.fr}</b><br>Leaf • ${leaf.highlights?.antioxidant_classification || 'N/A'}`,
            shape: 'dot',
            color: LEAF_COLOR,
            size: 20,
          });
        });

        recipes.forEach((recipe: any) => {
          const title = recipe.title?.en || recipe.title?.fr || `Recipe ${recipe.id}`;
          nodes.push({
            id: `recipe-${recipe.id}`,
            label: title,
            group: 'recipe',
            title: `<b>${title}</b><br>Recipe • ${recipe.category || 'Uncategorized'}`,
            shape: 'dot',
            color: RECIPE_COLOR,
            size: 16,
          });

          if (recipe.category) {
            const catId = `cat-${recipe.category.toLowerCase().replace(/\s+/g, '-')}`;
            if (!nodes.find(n => n.id === catId)) {
              nodes.push({
                id: catId,
                label: recipe.category,
                group: 'category',
                title: `<b>${recipe.category}</b><br>Dish Type`,
                shape: 'square',
                color: CATEGORY_COLOR,
                size: 12,
              });
            }
            edges.push({
              from: `recipe-${recipe.id}`,
              to: catId,
              label: 'type',
              dashes: false,
              width: 1,
              color: { color: '#4f46e5', opacity: 0.5 },
            });
          }

          if (recipe.origin) {
            const cuiId = `cuisine-${recipe.origin.toLowerCase().replace(/\s+/g, '-')}`;
            if (!nodes.find(n => n.id === cuiId)) {
              nodes.push({
                id: cuiId,
                label: recipe.origin,
                group: 'cuisine',
                title: `<b>${recipe.origin}</b><br>Cuisine`,
                shape: 'square',
                color: CUISINE_COLOR,
                size: 12,
              });
            }
            edges.push({
              from: `recipe-${recipe.id}`,
              to: cuiId,
              label: 'origin',
              dashes: false,
              width: 1,
              color: { color: '#db2777', opacity: 0.5 },
            });
          }

          const leafType = recipe.leafType;
          if (leafType) {
            const foundLeaf = leaves.find((l: any) =>
              l.name?.en?.toLowerCase().includes(leafType) || l.name?.fr?.toLowerCase().includes(leafType)
            );
            if (foundLeaf) {
              edges.push({
                from: `recipe-${recipe.id}`,
                to: `leaf-${foundLeaf.id}`,
                label: 'uses',
                dashes: false,
                width: 2,
                color: { color: '#059669', opacity: 0.7 },
              });
            }
          }

          if (recipe.leafIds) {
            recipe.leafIds.forEach((lid: number) => {
              if (!edges.find(e => e.from === `recipe-${recipe.id}` && e.to === `leaf-${lid}`)) {
                edges.push({
                  from: `recipe-${recipe.id}`,
                  to: `leaf-${lid}`,
                  label: 'uses',
                  dashes: false,
                  width: 2,
                  color: { color: '#059669', opacity: 0.7 },
                });
              }
            });
          }
        });

        if (destroyed) return;

        setStats({
          nodes: nodes.length,
          edges: edges.length,
          communities: new Set(nodes.map(n => n.group)).size,
        });

        if (!containerRef.current) return;
        if (networkRef.current) {
          networkRef.current.destroy();
          networkRef.current = null;
        }

        const visNodes = new DataSet(nodes.map(n => ({
          id: n.id,
          label: n.label,
          title: n.title,
          shape: n.shape,
          color: n.color,
          size: n.size,
          group: n.group,
        })));

        const visEdges = new DataSet(edges.map((e, i) => ({
          id: i,
          from: e.from,
          to: e.to,
          label: e.label,
          dashes: e.dashes,
          width: e.width,
          color: e.color,
          font: { size: 8, color: '#94a3b8', strokeWidth: 0 },
        })));

        networkRef.current = new Network(containerRef.current, { nodes: visNodes, edges: visEdges }, {
          physics: {
            solver: 'forceAtlas2Based',
            forceAtlas2Based: {
              gravitationalConstant: -80,
              centralGravity: 0.005,
              springLength: 150,
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
          nodes: { borderWidth: 2, font: { size: 10, color: '#334155' } },
          edges: { smooth: { enabled: true, type: 'continuous', roundness: 0.2 } },
          groups: {
            leaf: { shape: 'dot', color: LEAF_COLOR },
            recipe: { shape: 'dot', color: RECIPE_COLOR },
            category: { shape: 'square', color: CATEGORY_COLOR },
            cuisine: { shape: 'square', color: CUISINE_COLOR },
          },
        });

        networkRef.current.once('stabilizationIterationsDone', () => {
          networkRef.current?.setOptions({ physics: { enabled: false } });
        });

        setLoading(false);
      } catch (err: any) {
        if (!destroyed) {
          setError(err.message);
          setLoading(false);
        }
      }
    };

    buildGraph();

    return () => {
      destroyed = true;
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
    { title: 'Leaves & Recipes', value: stats.nodes, icon: Leaf, color: 'text-emerald-500', bg: 'bg-emerald-50' },
    { title: 'Relationships', value: stats.edges, icon: GitBranch, color: 'text-blue-500', bg: 'bg-blue-50' },
    { title: 'Groups', value: stats.communities, icon: NetworkIcon, color: 'text-purple-500', bg: 'bg-purple-50' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Knowledge Graph</h1>
        <p className="text-slate-500">Relationships between leaves, recipes, dish types, and cuisines</p>
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
            Force-directed graph of all leaves and recipes. Green = leaves, amber = recipes, indigo = dish types, pink = cuisines.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error ? (
            <div className="w-full aspect-[16/9] rounded-xl overflow-hidden border border-slate-200 bg-slate-50 flex items-center justify-center">
              <div className="text-center p-8">
                <p className="text-slate-500 mb-2">Could not load graph data</p>
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
        </CardContent>
      </Card>

      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GitBranch className="w-5 h-5 text-slate-500" />
            Legend
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-slate-600 space-y-2">
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-emerald-200 border-2 border-emerald-600" />
              <span>Leaf</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-amber-200 border-2 border-amber-600" />
              <span>Recipe</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-sm bg-indigo-200 border-2 border-indigo-600" />
              <span>Dish Type</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-sm bg-pink-200 border-2 border-pink-600" />
              <span>Cuisine</span>
            </div>
          </div>
          <p className="mt-2">Nodes are loaded from your actual Supabase data. Edges represent recipe-leaf relationships, dish type classifications, and cuisine origins.</p>
        </CardContent>
      </Card>
    </div>
  );
};
