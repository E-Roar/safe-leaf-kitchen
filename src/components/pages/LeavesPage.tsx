import { useState, useEffect, useMemo, useRef } from "react";
import { X, Menu, Leaf, Search, Star } from "lucide-react";
import { leaves, LeafInfo } from "@/data/leaves";
import { cn } from "@/lib/utils";
import nutritionRaw from "../../../tableau_nutritionnel 9 feuilles.json";
import bioactivesRaw from "../../../tableau_composes_bioactifs 9 feuilles.json";
import bioActivitiesRaw from "../../../vertopal.com_Activités biologiques et molécules bioactives présentes dans les feuilles d.json";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
} from "recharts";

// Lightweight bubbles simulation for compounds
function CompoundsBubbleSimulation({ compounds }: { compounds: string[] }) {
  return (
    <div className="w-full rounded-2xl bg-background/30 border border-border p-3">
      <div className="flex flex-wrap gap-2">
        {compounds.map((label, idx) => (
          <span
            key={idx}
            className="px-2 py-1 rounded-full text-xs bg-primary/10 text-primary border border-primary/20"
          >
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}

type Language = 'en' | 'fr';

interface LeavesPageProps {
  selectedLeafId?: number | null;
}

export default function LeavesPage({ selectedLeafId }: LeavesPageProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedLeaf, setSelectedLeaf] = useState<LeafInfo | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState<Language>('en');
  const [query, setQuery] = useState("");

  // Build lookup maps (by French leaf name as in datasets)
  const nutritionByFr: Record<string, any> = useMemo(() => {
    const map: Record<string, any> = {};
    (nutritionRaw as any[]).forEach((row) => {
      map[(row["Feuille de"] || "").toString().toLowerCase()] = row;
    });
    return map;
  }, []);

  const bioactivesByFr: Record<string, any> = useMemo(() => {
    const map: Record<string, any> = {};
    (bioactivesRaw as any[]).forEach((row) => {
      map[(row["Feuille de"] || "").toString().toLowerCase()] = row;
    });
    return map;
  }, []);

  // Parse loose bioactivities text file (currently contains onion/"oignon" section)
  const extraBioByFr: Record<string, { classes: string[]; molecules: string[]; activities: string[] }> = useMemo(() => {
    const out: Record<string, { classes: string[]; molecules: string[]; activities: string[] }> = {};
    try {
      const keys = Object.keys(bioActivitiesRaw as any);
      if (keys.length > 0) {
        const text = keys[0].toLowerCase();
        if (text.includes("feuilles d’oignon") || text.includes("feuilles d'oignon") || text.includes("oignon")) {
          out['oignon'] = {
            classes: [
              "Flavonoïdes & polyphénols",
              "Composés organosulfurés",
              "Anthocyanines",
            ],
            molecules: [
              "Quercétine", "Isorhamnétine", "Kaempférol", "Lutéoline",
              "Acides phénoliques (gallique, férulique, syringique, protocatéchique, chlorogénique, vanillique, coumarique, cinnamique, benzoïque)",
              "Cystéine sulfoxyde", "Onionin A", "Thiosulfinates", "Cépaènes", "Sulfones",
              "Cyanidine 3-glucosides", "Péonidine glucosides", "Pétunidine glucoside", "Carboxypyranocyanidine",
            ],
            activities: [
              "Antioxydante", "Anti-inflammatoire", "Antidiabétique", "Neuroprotecteur",
              "Antimicrobien", "Antithrombotique", "Cardioprotecteur", "Anticancéreuse",
            ],
          };
        }
      }
    } catch {}
    return out;
  }, []);

  const parseNum = (val: any): number | null => {
    if (val === undefined || val === null || val === "") return null;
    const n = Number(val);
    return isNaN(n) ? null : n;
  };

  // Deterministic mapping by leaf id → French dataset key
  const getFrKeyForLeaf = (leaf: LeafInfo | null): string | null => {
    if (!leaf) return null;
    const mapById: Record<number, string> = {
      1: 'oignon',
      2: 'fenouil',
      3: 'carotte',
      4: 'chou rave',
      5: 'betterave rouge',
      6: 'radis',
      7: 'poireau',
      8: 'navet',
      9: 'artichaut',
    };
    const key = mapById[leaf.id];
    return key || null;
  };

  useEffect(() => {
    if (!selectedLeaf && leaves.length > 0) {
      setSelectedLeaf(leaves[0]);
    }
  }, []);

  useEffect(() => {
    if (selectedLeafId) {
      const found = leaves.find(l => l.id === selectedLeafId);
      if (found) {
        setSelectedLeaf(found);
      }
    }
  }, [selectedLeafId]);

  const filtered = leaves.filter(l =>
    l.name.en.toLowerCase().includes(query.toLowerCase()) ||
    l.name.fr.toLowerCase().includes(query.toLowerCase()) ||
    l.aliases.some(a => a.toLowerCase().includes(query.toLowerCase()))
  );

  const Card = ({ leaf }: { leaf: LeafInfo }) => (
    <button
      onClick={() => { setSelectedLeaf(leaf); setIsSidebarOpen(false); }}
      className={cn(
        "w-full p-4 rounded-2xl text-left transition-all duration-300 hover:shadow-lg relative",
        selectedLeaf?.id === leaf.id ? "glass bg-primary/10 border border-primary/20" : "glass hover:bg-muted/30"
      )}
    >
      <div className="absolute top-2 right-2">
        <Star className="w-4 h-4 text-yellow-400 opacity-0" />
      </div>
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-xl bg-gradient-organic flex items-center justify-center">
          <Leaf className="w-8 h-8 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground text-sm line-clamp-2">
            {leaf.name[selectedLanguage]}
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            {leaf.aliases.slice(0, 3).join(', ')}
          </p>
        </div>
      </div>
    </button>
  );

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-40 w-80 bg-background/95 backdrop-blur-xl border-r border-border flex flex-col transform transition-transform duration-300 ease-in-out",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full",
        "lg:relative lg:translate-x-0 lg:border-r lg:border-border"
      )}>
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-foreground">Leaves</h2>
            </div>
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="lg:hidden p-2 rounded-lg hover:bg-muted/50 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="relative mt-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search leaves..."
              className="w-full pl-9 pr-3 py-2 bg-background/50 border border-border rounded-xl text-sm focus:outline-none"
            />
          </div>
        </div>

        {/* Leaf List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {filtered.map((leaf) => (
            <Card key={leaf.id} leaf={leaf} />
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:ml-0">
        {/* Mobile Header */}
        <div className="lg:hidden p-4 border-b border-border">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 rounded-lg hover:bg-muted/50 transition-colors"
            >
              <Menu className="w-6 h-6" />
            </button>
            <h1 className="text-lg font-bold text-foreground">Leaves</h1>
            <div className="w-10"></div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 p-4 lg:p-6">
          {selectedLeaf ? (
            <div className="max-w-4xl mx-auto space-y-6">
              {/* Header */}
              <div className="text-center mb-2">
                <div className="flex items-center justify-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-gradient-primary rounded-full flex items-center justify-center">
                    <Leaf className="w-6 h-6 text-primary-foreground" />
                  </div>
                </div>
                <h1 className="text-3xl font-bold text-foreground mb-2">
                  {selectedLeaf.name[selectedLanguage]}
                </h1>
                <p className="text-muted-foreground">
                  {selectedLeaf.aliases.join(' • ')}
                </p>
              </div>

              {/* Language Toggle */}
              <div className="flex justify-center">
                <div className="glass rounded-2xl p-1 flex">
                  {(['en', 'fr'] as Language[]).map((lang) => (
                    <button
                      key={lang}
                      onClick={() => setSelectedLanguage(lang)}
                      className={cn(
                        "px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300",
                        selectedLanguage === lang
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {lang.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              {/* Charts Section */}
              {(() => {
                const frKey = getFrKeyForLeaf(selectedLeaf);
                const nut = frKey ? nutritionByFr[frKey] : null;
                const bio = frKey ? bioactivesByFr[frKey] : null;
                const barData = [
                  {
                    metric: "Proteins (%)",
                    value: parseNum(nut?.["Protéines (%)"]) ?? 0,
                  },
                  {
                    metric: "Calcium mg/100g",
                    value: parseNum(nut?.["Calcium (mg/100g)"]) ?? 0,
                  },
                  {
                    metric: "Potassium mg/100g",
                    value: parseNum(nut?.["Potassium (mg/100g)"]) ?? 0,
                  },
                  {
                    metric: "Magnesium mg/100g",
                    value: parseNum(nut?.["Magnésium (mg/100g)"]) ?? 0,
                  },
                ];

                const radarData = [
                  {
                    name: "Polyphenols",
                    score: parseNum(bio?.["Polyphénols_Totaux_mg_100g"]) ?? 0,
                  },
                  {
                    name: "Flavonoids",
                    score: parseNum(bio?.["Flavonoïdes_Totaux_mg_100g"]) ?? 0,
                  },
                  {
                    name: "Bioactives",
                    score:
                      parseNum(bio?.["Composés_Bioactifs_Totaux"]) ??
                      parseNum(bio?.["Composés_Bioactifs_Totaux_mg_100g"]) ??
                      0,
                  },
                ];

                return (
                  <div className="grid md:grid-cols-2 gap-4">
                    {/* Bar Chart */}
                    <div className="glass rounded-3xl p-4">
                      <h4 className="font-semibold mb-2 text-foreground">Key nutrients</h4>
                      <ChartContainer
                        config={{
                          value: { label: "Value", color: "hsl(var(--primary))" },
                        }}
                        className="h-64"
                      >
                        <BarChart data={barData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="metric" hide />
                          <YAxis hide />
                          <ChartTooltip content={<ChartTooltipContent />} />
                          <Bar
                            dataKey="value"
                            fill="var(--color-value)"
                            radius={[8, 8, 8, 8]}
                            isAnimationActive
                          />
                        </BarChart>
                      </ChartContainer>
                      <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
                        {barData.map((d) => (
                          <span key={d.metric} className="px-2 py-1 bg-background/50 rounded-md">
                            {d.metric}: <span className="text-foreground font-medium">{d.value}</span>
                          </span>
                        ))}
                      </div>
                    </div>
                    {/* Radar Chart */}
                    <div className="glass rounded-3xl p-4">
                      <h4 className="font-semibold mb-2 text-foreground">Bioactive density</h4>
                      <ChartContainer
                        config={{
                          score: { label: "Score", color: "hsl(var(--accent))" },
                        }}
                        className="h-64"
                      >
                        <RadarChart data={radarData} outerRadius={90}>
                          <PolarGrid />
                          <PolarAngleAxis dataKey="name" />
                          <ChartTooltip content={<ChartTooltipContent />} />
                          <Radar
                            name="score"
                            dataKey="score"
                            stroke="var(--color-score)"
                            fill="var(--color-score)"
                            fillOpacity={0.4}
                            isAnimationActive
                          />
                        </RadarChart>
                      </ChartContainer>
                      {(bio?.["Classification_Antioxydante_CORRIGÉ"] || bio?.["Classification_Antioxydante_y"]) && (
                        <div className="text-xs mt-2 text-muted-foreground">
                          Antioxidant class: <span className="text-foreground font-medium">{bio["Classification_Antioxydante_CORRIGÉ"] || bio["Classification_Antioxydante_y"]}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* Highlights */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {selectedLeaf.highlights.proteins_percent !== undefined && (
                  <div className="text-center p-4 bg-background/50 rounded-xl">
                    <div className="text-lg font-bold text-primary">
                      {selectedLeaf.highlights.proteins_percent}%
                    </div>
                    <div className="text-xs text-muted-foreground">Proteins</div>
                  </div>
                )}
                {selectedLeaf.highlights.polyphenols_mg_per_100g !== undefined && (
                  <div className="text-center p-4 bg-background/50 rounded-xl">
                    <div className="text-lg font-bold text-accent">
                      {selectedLeaf.highlights.polyphenols_mg_per_100g} mg
                    </div>
                    <div className="text-xs text-muted-foreground">Polyphenols / 100g</div>
                  </div>
                )}
                {selectedLeaf.highlights.flavonoids_mg_per_100g !== undefined && (
                  <div className="text-center p-4 bg-background/50 rounded-xl">
                    <div className="text-lg font-bold text-secondary">
                      {selectedLeaf.highlights.flavonoids_mg_per_100g} mg
                    </div>
                    <div className="text-xs text-muted-foreground">Flavonoids / 100g</div>
                  </div>
                )}
                {selectedLeaf.highlights.calcium_mg_per_100g !== undefined && (
                  <div className="text-center p-4 bg-background/50 rounded-xl">
                    <div className="text-lg font-bold text-foreground">
                      {selectedLeaf.highlights.calcium_mg_per_100g} mg
                    </div>
                    <div className="text-xs text-muted-foreground">Calcium / 100g</div>
                  </div>
                )}
                {selectedLeaf.highlights.antioxidant_classification && (
                  <div className="text-center p-4 bg-background/50 rounded-xl">
                    <div className="text-sm font-semibold text-primary">
                      {selectedLeaf.highlights.antioxidant_classification}
                    </div>
                    <div className="text-xs text-muted-foreground">Antioxidant classification</div>
                  </div>
                )}
              </div>

              {/* Summary */}
              <div className="glass rounded-3xl p-5">
                <h4 className="font-semibold mb-2 text-foreground">Summary</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">{selectedLeaf.summary}</p>
              </div>

              {/* Compounds */}
              {(() => {
                const frKey = getFrKeyForLeaf(selectedLeaf);
                const extra = frKey ? extraBioByFr[frKey] : null;
                const compounds = selectedLeaf.compounds || [];
                const moleculeList = extra?.molecules?.length ? extra.molecules : compounds;
                return moleculeList && moleculeList.length > 0 ? (
                  <div className="glass rounded-3xl p-5">
                    <h4 className="font-semibold mb-3 text-foreground">Key compounds</h4>
                    <CompoundsBubbleSimulation compounds={moleculeList} />
                  </div>
                ) : null;
              })()}

              {/* Activities mind-map style chips */}
              {(() => {
                const frKey = getFrKeyForLeaf(selectedLeaf);
                const extra = frKey ? extraBioByFr[frKey] : null;
                if (!extra?.activities?.length) return null;
                return (
                  <div className="glass rounded-3xl p-5">
                    <h4 className="font-semibold mb-3 text-foreground">Main bioactivities</h4>
                    <div className="flex flex-wrap gap-2">
                      {extra.activities.map((a, i) => (
                        <span key={i} className="px-2 py-1 rounded-full text-xs bg-accent/10 text-accent">
                          {a}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {/* Safety */}
              {selectedLeaf.safety && (
                <div className="glass rounded-3xl p-5">
                  <h4 className="font-semibold mb-2 text-foreground">Safety</h4>
                  <p className="text-sm text-muted-foreground">{selectedLeaf.safety}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="w-24 h-24 bg-gradient-primary rounded-full flex items-center justify-center mb-6">
                <Leaf className="w-12 h-12 text-primary-foreground" />
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-2">Select a Leaf</h2>
              <p className="text-muted-foreground max-w-md">Choose a leaf from the sidebar to view its nutritional and descriptive profile.</p>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </div>
  );
}


