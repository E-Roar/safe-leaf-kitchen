import { useState, useEffect, useMemo } from "react";
import { useI18n } from "@/hooks/useI18n";
import { X, Menu, Leaf, Search, Star } from "lucide-react";
// import { leaves, LeafInfo } from "@/data/leaves"; // Removed static import
import { supabase } from "@/lib/supabaseClient";
import { Analytics } from "@/services/analyticsEventService";
import { cn } from "@/lib/utils";
import { LeafGallery } from "@/components/ui/LeafGallery";
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

// Define Interface locally or import from a shared type file
interface LeafInfo {
  id: any; // Allow UUID or number
  name: { en: string; fr: string };
  aliases: string[];
  highlights: {
    proteins_percent?: number;
    antioxidant_classification?: string;
    calcium_mg_per_100g?: number;
    flavonoids_mg_per_100g?: number;
    polyphenols_mg_per_100g?: number;
  };
  compounds?: string[];
  safety?: string;
  summary: string;
  image_url?: string;
  gallery_images?: string[]; // Add gallery_images support
}

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
  const { t } = useI18n();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [leaves, setLeaves] = useState<LeafInfo[]>([]); // Dynamic state
  const [isLoading, setIsLoading] = useState(true);
  const [selectedLeaf, setSelectedLeaf] = useState<LeafInfo | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState<Language>('en');
  const [query, setQuery] = useState("");

  // Fetch leaves from Supabase
  useEffect(() => {
    const fetchLeaves = async () => {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('leaves')
        .select('*')
        .order('name->en'); // Order by English name

      if (error) {
        console.error('Error fetching leaves:', error);
      } else {
        console.log('Fetched leaves:', data); // Debug
        setLeaves(data || []);
        // Select first leaf if none selected and not loading
        if (data && data.length > 0 && !selectedLeaf) {
          // If selectedLeafId is passed via props, find it
          if (selectedLeafId) {
            const found = data.find((l: any) => l.id === selectedLeafId);
            if (found) setSelectedLeaf(found);
            else setSelectedLeaf(data[0]);
          } else {
            setSelectedLeaf(data[0]);
          }
        }
      }
      setIsLoading(false);
    };

    fetchLeaves();
  }, [selectedLeafId]); // Re-run if ID prop changes (though logic handles internal check)

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
    } catch { }
    return out;
  }, []);

  const parseNum = (val: unknown): number | null => {
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


  const filtered = leaves.filter(l =>
    l.name.en.toLowerCase().includes(query.toLowerCase()) ||
    l.name.fr.toLowerCase().includes(query.toLowerCase()) ||
    l.aliases.some(a => a.toLowerCase().includes(query.toLowerCase()))
  );

  const getLeafImage = (leaf: LeafInfo) => {
    if (leaf.image_url) return leaf.image_url;
    if (leaf.gallery_images && leaf.gallery_images.length > 0) return leaf.gallery_images[0];

    // Fallback to local files for legacy/default items
    const filename = leaf.name.en
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '-');
    return `/images/leaves/${filename}/1.png`;
  };

  const Card = ({ leaf }: { leaf: LeafInfo }) => (
    <button
      onClick={() => { setSelectedLeaf(leaf); setIsSidebarOpen(false); Analytics.trackLeafView(leaf.id); }}
      className={cn(
        "w-full rounded-2xl text-left transition-all duration-300 hover:shadow-lg hover:shadow-primary/10 relative border backdrop-blur-sm overflow-hidden flex flex-col h-full",
        selectedLeaf?.id === leaf.id
          ? "glass bg-primary/10 border-primary/30 shadow-lg shadow-primary/20"
          : "glass hover:bg-primary/5 border-primary/10 hover:border-primary/20"
      )}
    >
      <div className="absolute top-2 right-2 z-10">
        <Star className="w-4 h-4 text-yellow-400 opacity-0" />
      </div>
      <div className="w-full aspect-[4/3] relative bg-gradient-organic">
        <img
          src={getLeafImage(leaf)}
          alt={leaf.name.en}
          className="w-full h-full object-cover"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
            (target.nextElementSibling as HTMLElement)?.classList.remove('hidden');
          }}
        />
        <Leaf className="w-8 h-8 text-primary hidden absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
      </div>
      <div className="p-3 flex-1 flex flex-col">
        <h3 className="font-semibold text-foreground text-sm line-clamp-2 leading-tight">
          {leaf.name[selectedLanguage]}
        </h3>
        <p className="text-[10px] text-muted-foreground mt-1 line-clamp-1">
          {leaf.aliases.slice(0, 2).join(', ')}
        </p>
      </div>
    </button>
  );

  return (
    <div className="h-screen flex overflow-hidden">
      {/* Sidebar */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-40 w-full sm:w-80 bg-background/90 backdrop-blur-2xl border-r border-primary/20 shadow-2xl shadow-primary/10 flex flex-col transform transition-transform duration-300 ease-in-out",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full",
        "lg:translate-x-0 lg:border-r lg:border-primary/20"
      )}>
        <div className="p-4 border-b border-primary/20 bg-background/20 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-foreground drop-shadow-sm">{t('leaves.title')}</h2>
            </div>
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="lg:hidden p-2 rounded-lg hover:bg-primary/10 hover:shadow-primary/20 transition-all duration-200 border border-transparent hover:border-primary/20"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="relative mt-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('leaves.searchPlaceholder')}
              className="w-full pl-9 pr-3 py-2 bg-background/30 backdrop-blur-sm border border-primary/20 rounded-xl text-sm focus:outline-none focus:border-primary/40 focus:shadow-primary/20 focus:shadow-sm transition-all duration-200"
            />
          </div>
        </div>

        {/* Leaf List - Responsive Grid */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-2 gap-3">
            {filtered.map((leaf) => (
              <Card key={leaf.id} leaf={leaf} />
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:pl-80">
        {/* Mobile Header */}
        <div className="p-4 border-b border-primary/20 sticky top-12 z-20 bg-background/90 backdrop-blur-xl shadow-lg shadow-primary/5">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 rounded-lg hover:bg-primary/10 hover:shadow-primary/20 transition-all duration-200 border border-transparent hover:border-primary/20"
            >
              <Menu className="w-6 h-6" />
            </button>
            <h1 className="text-lg font-bold text-foreground drop-shadow-sm">{t('leaves.title')}</h1>
            <div className="w-10"></div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 p-4 lg:p-6 overflow-y-auto">
          {selectedLeaf ? (
            <div className="max-w-4xl mx-auto space-y-6">
              {/* Header */}
              <div className="text-center mb-2">
                <div className="flex items-center justify-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-gradient-primary rounded-full flex items-center justify-center shadow-lg shadow-primary/30 border border-primary/20">
                    <Leaf className="w-6 h-6 text-primary-foreground drop-shadow-sm" />
                  </div>
                </div>
                <h1 className="text-3xl font-bold text-foreground mb-2 drop-shadow-sm">
                  {selectedLeaf.name[selectedLanguage]}
                </h1>
                <div className="mx-auto mb-4 w-full max-w-xl aspect-video rounded-3xl overflow-hidden bg-gradient-organic border border-primary/20 shadow-2xl shadow-primary/10 hover:shadow-primary/20 transition-all duration-300">
                  <img
                    src={getLeafImage(selectedLeaf)}
                    alt={selectedLeaf.name.en}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                    }}
                  />
                </div>
                <p className="text-muted-foreground">
                  {selectedLeaf.aliases.join(' • ')}
                </p>
              </div>

              {/* Language Toggle */}
              <div className="flex justify-center">
                <div className="glass rounded-2xl p-1 flex border border-primary/20 shadow-lg shadow-primary/10 backdrop-blur-md">
                  {(['en', 'fr'] as Language[]).map((lang) => (
                    <button
                      key={lang}
                      onClick={() => setSelectedLanguage(lang)}
                      className={cn(
                        "px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300",
                        selectedLanguage === lang
                          ? "bg-primary text-primary-foreground shadow-sm shadow-primary/30"
                          : "text-muted-foreground hover:text-foreground hover:bg-primary/10"
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
                    <div className="glass rounded-3xl p-4 border border-primary/10 shadow-lg shadow-primary/5 hover:shadow-primary/10 transition-all duration-300">
                      <h4 className="font-semibold mb-2 text-foreground drop-shadow-sm">{t('leaves.keyNutrients')}</h4>
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
                    <div className="glass rounded-3xl p-4 border border-accent/10 shadow-lg shadow-accent/5 hover:shadow-accent/10 transition-all duration-300">
                      <h4 className="font-semibold mb-2 text-foreground drop-shadow-sm">{t('leaves.bioactiveDensity')}</h4>
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
                          {t('leaves.antioxidantClass')}: <span className="text-foreground font-medium">{bio["Classification_Antioxydante_CORRIGÉ"] || bio["Classification_Antioxydante_y"]}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* Highlights */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {selectedLeaf.highlights.proteins_percent !== undefined && (
                  <div className="text-center p-4 bg-background/30 backdrop-blur-md rounded-xl border border-primary/20 shadow-lg shadow-primary/10 hover:shadow-primary/20 hover:border-primary/30 transition-all duration-300">
                    <div className="text-lg font-bold text-primary drop-shadow-sm">
                      {selectedLeaf.highlights.proteins_percent}%
                    </div>
                    <div className="text-xs text-muted-foreground">{t('leaves.highlight.proteins')}</div>
                  </div>
                )}
                {selectedLeaf.highlights.polyphenols_mg_per_100g !== undefined && (
                  <div className="text-center p-4 bg-background/30 backdrop-blur-md rounded-xl border border-accent/20 shadow-lg shadow-accent/10 hover:shadow-accent/20 hover:border-accent/30 transition-all duration-300">
                    <div className="text-lg font-bold text-accent drop-shadow-sm">
                      {selectedLeaf.highlights.polyphenols_mg_per_100g} mg
                    </div>
                    <div className="text-xs text-muted-foreground">{t('leaves.highlight.polyphenolsPer100g')}</div>
                  </div>
                )}
                {selectedLeaf.highlights.flavonoids_mg_per_100g !== undefined && (
                  <div className="text-center p-4 bg-background/30 backdrop-blur-md rounded-xl border border-secondary/20 shadow-lg shadow-secondary/10 hover:shadow-secondary/20 hover:border-secondary/30 transition-all duration-300">
                    <div className="text-lg font-bold text-secondary drop-shadow-sm">
                      {selectedLeaf.highlights.flavonoids_mg_per_100g} mg
                    </div>
                    <div className="text-xs text-muted-foreground">{t('leaves.highlight.flavonoidsPer100g')}</div>
                  </div>
                )}
                {selectedLeaf.highlights.calcium_mg_per_100g !== undefined && (
                  <div className="text-center p-4 bg-background/30 backdrop-blur-md rounded-xl border border-foreground/10 shadow-lg shadow-foreground/5 hover:shadow-foreground/10 hover:border-foreground/20 transition-all duration-300">
                    <div className="text-lg font-bold text-foreground drop-shadow-sm">
                      {selectedLeaf.highlights.calcium_mg_per_100g} mg
                    </div>
                    <div className="text-xs text-muted-foreground">{t('leaves.highlight.calciumPer100g')}</div>
                  </div>
                )}
                {selectedLeaf.highlights.antioxidant_classification && (
                  <div className="text-center p-4 bg-background/30 backdrop-blur-md rounded-xl border border-primary/20 shadow-lg shadow-primary/10 hover:shadow-primary/20 hover:border-primary/30 transition-all duration-300">
                    <div className="text-sm font-semibold text-primary drop-shadow-sm">
                      {selectedLeaf.highlights.antioxidant_classification}
                    </div>
                    <div className="text-xs text-muted-foreground">Antioxidant classification</div>
                  </div>
                )}
              </div>

              {/* Summary */}
              <div className="glass rounded-3xl p-5 border border-primary/10 shadow-xl shadow-primary/10 hover:shadow-primary/20 hover:border-primary/20 transition-all duration-300">
                <h4 className="font-semibold mb-2 text-foreground drop-shadow-sm">{t('leaves.summary')}</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">{selectedLeaf.summary}</p>
              </div>

              {/* Compounds */}
              {(() => {
                const frKey = getFrKeyForLeaf(selectedLeaf);
                const extra = frKey ? extraBioByFr[frKey] : null;
                const compounds = selectedLeaf.compounds || [];
                const moleculeList = extra?.molecules?.length ? extra.molecules : compounds;
                return moleculeList && moleculeList.length > 0 ? (
                  <div className="glass rounded-3xl p-5 border border-accent/10 shadow-xl shadow-accent/10 hover:shadow-accent/20 hover:border-accent/20 transition-all duration-300">
                    <h4 className="font-semibold mb-3 text-foreground drop-shadow-sm">{t('leaves.keyCompounds')}</h4>
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
                  <div className="glass rounded-3xl p-5 border border-secondary/10 shadow-xl shadow-secondary/10 hover:shadow-secondary/20 hover:border-secondary/20 transition-all duration-300">
                    <h4 className="font-semibold mb-3 text-foreground drop-shadow-sm">{t('leaves.mainBioactivities')}</h4>
                    <div className="flex flex-wrap gap-2">
                      {extra.activities.map((a, i) => (
                        <span key={i} className="px-3 py-1.5 rounded-full text-xs bg-accent/20 text-accent border border-accent/30 shadow-sm hover:shadow-accent/20 hover:bg-accent/30 transition-all duration-200">
                          {a}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {/* Safety */}
              {selectedLeaf.safety && (
                <div className="glass rounded-3xl p-5 border border-orange-500/20 shadow-xl shadow-orange-500/10 hover:shadow-orange-500/20 hover:border-orange-500/30 transition-all duration-300">
                  <h4 className="font-semibold mb-2 text-foreground drop-shadow-sm">{t('leaves.safety')}</h4>
                  <p className="text-sm text-muted-foreground">{selectedLeaf.safety}</p>
                </div>
              )}

              {/* Leaf Gallery - Pinterest-style Masonry */}
              <LeafGallery
                leafId={selectedLeaf.id}
                leafName={selectedLeaf.name.en}
                galleryImages={selectedLeaf.gallery_images}
                className=""
              />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="w-24 h-24 bg-gradient-primary rounded-full flex items-center justify-center mb-6">
                <Leaf className="w-12 h-12 text-primary-foreground" />
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-2">{t('leaves.selectLeaf')}</h2>
              <p className="text-muted-foreground max-w-md">{t('leaves.selectLeafHint')}</p>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Sidebar Overlay */}
      {
        isSidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-30 lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )
      }
    </div>
  );
}


