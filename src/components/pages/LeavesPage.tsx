import { useState, useEffect, useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useI18n } from "@/hooks/useI18n";
import { Leaf, Search, ArrowLeft } from "lucide-react";
import { leaves as staticLeaves } from "@/data/leaves";
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

interface LeafInfo {
  id: any;
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
  gallery_images?: string[];
}

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

export default function LeavesPage() {
  const [searchParams] = useSearchParams();
  const selectedLeafId = searchParams.get('leafId');
  const navigate = useNavigate();
  const { t } = useI18n();
  const [leaves, setLeaves] = useState<LeafInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedLeaf, setSelectedLeaf] = useState<LeafInfo | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState<Language>('en');
  const [query, setQuery] = useState("");

  useEffect(() => {
    const fetchLeaves = async () => {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('leaves')
        .select('*')
        .order('name->en');
      if (error) {
        console.error('Error fetching leaves:', error);
        setLeaves(staticLeaves);
      } else {
        const fallbackData = (data && data.length > 0) ? data : staticLeaves;
        setLeaves(fallbackData);
      }
      setIsLoading(false);
    };
    fetchLeaves();
  }, []);

  useEffect(() => {
    if (selectedLeafId) {
      const source = leaves.length > 0 ? leaves : staticLeaves;
      const found = source.find((l: any) => String(l.id) === selectedLeafId);
      if (found) {
        setSelectedLeaf(found);
        Analytics.trackLeafView(found.id);
      }
    } else {
      setSelectedLeaf(null);
    }
  }, [selectedLeafId, leaves]);

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

  const extraBioByFr: Record<string, { classes: string[]; molecules: string[]; activities: string[] }> = useMemo(() => {
    const out: Record<string, { classes: string[]; molecules: string[]; activities: string[] }> = {};
    try {
      const keys = Object.keys(bioActivitiesRaw as any);
      if (keys.length > 0) {
        const text = keys[0].toLowerCase();
        if (text.includes("feuilles d'oignon") || text.includes("feuilles d’oignon") || text.includes("oignon")) {
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
    if (typeof leaf.id === 'number') {
      return mapById[leaf.id] || null;
    }
    const nameFr = leaf.name.fr.toLowerCase().replace(/\u2019/g, "'");
    const reverseMap: Record<string, string> = {
      "feuilles d'oignon": "oignon", "feuille d'oignon": "oignon", "oignon": "oignon",
      "feuille de fenouil": "fenouil", "fenouil": "fenouil",
      "feuille de carotte": "carotte", "carotte": "carotte",
      "feuille de chou rave": "chou rave", "chou rave": "chou rave",
      "feuille de betterave rouge": "betterave rouge", "betterave rouge": "betterave rouge",
      "feuille de radis": "radis", "radis": "radis",
      "feuille de poireau": "poireau", "poireau": "poireau",
      "feuille de navet": "navet", "navet": "navet",
      "feuille d'artichaut": "artichaut", "feuille d’artichaut": "artichaut", "artichaut": "artichaut"
    };
    return reverseMap[nameFr] || null;
  };

  const filtered = leaves.filter(l =>
    l.name.en.toLowerCase().includes(query.toLowerCase()) ||
    l.name.fr.toLowerCase().includes(query.toLowerCase()) ||
    l.aliases.some(a => a.toLowerCase().includes(query.toLowerCase()))
  );

  const getLeafImage = (leaf: LeafInfo) => {
    if (leaf.image_url) return leaf.image_url;
    if (leaf.gallery_images && leaf.gallery_images.length > 0) return leaf.gallery_images[0];
    const filename = leaf.name.en
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '-');
    return `/images/leaves/${filename}/1.png`;
  };

  // ── Detail View ──
  if (selectedLeaf) {
    return (
      <div>
        <div className="max-w-4xl mx-auto px-4 md:px-8 py-6">
          <button
            onClick={() => navigate('/leaves')}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to leaves
          </button>

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
            <div className="mx-auto mb-4 w-full max-w-xl aspect-video rounded-3xl overflow-hidden bg-gradient-organic border border-primary/20 shadow-2xl shadow-primary/10">
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
          <div className="flex justify-center mb-6">
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
              { metric: "Proteins (%)", value: parseNum(nut?.["Protéines (%)"]) ?? 0 },
              { metric: "Calcium mg/100g", value: parseNum(nut?.["Calcium (mg/100g)"]) ?? 0 },
              { metric: "Potassium mg/100g", value: parseNum(nut?.["Potassium (mg/100g)"]) ?? 0 },
              { metric: "Magnesium mg/100g", value: parseNum(nut?.["Magnésium (mg/100g)"]) ?? 0 },
            ];
            const radarData = [
              { name: "Polyphenols", score: parseNum(bio?.["Polyphénols_Totaux_mg_100g"]) ?? 0 },
              { name: "Flavonoids", score: parseNum(bio?.["Flavonoïdes_Totaux_mg_100g"]) ?? 0 },
              {
                name: "Bioactives",
                score:
                  parseNum(bio?.["Composés_Bioactifs_Totaux"]) ??
                  parseNum(bio?.["Composés_Bioactifs_Totaux_mg_100g"]) ??
                  0,
              },
            ];

            return (
              <div className="grid md:grid-cols-2 gap-4 mb-6">
                <div className="glass rounded-3xl p-4 border border-primary/10 shadow-lg shadow-primary/5">
                  <h4 className="font-semibold mb-2 text-foreground drop-shadow-sm">{t('leaves.keyNutrients')}</h4>
                  <ChartContainer
                    config={{ value: { label: "Value", color: "hsl(var(--primary))" } }}
                    className="h-64"
                  >
                    <BarChart data={barData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="metric" hide />
                      <YAxis hide />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="value" fill="var(--color-value)" radius={[8, 8, 8, 8]} isAnimationActive />
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
                <div className="glass rounded-3xl p-4 border border-accent/10 shadow-lg shadow-accent/5">
                  <h4 className="font-semibold mb-2 text-foreground drop-shadow-sm">{t('leaves.bioactiveDensity')}</h4>
                  <ChartContainer
                    config={{ score: { label: "Score", color: "hsl(var(--accent))" } }}
                    className="h-64"
                  >
                    <RadarChart data={radarData} outerRadius={90}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="name" />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Radar name="score" dataKey="score" stroke="var(--color-score)" fill="var(--color-score)" fillOpacity={0.4} isAnimationActive />
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
            {selectedLeaf.highlights.proteins_percent !== undefined && (
              <div className="text-center p-4 bg-background/30 backdrop-blur-md rounded-xl border border-primary/20 shadow-lg shadow-primary/10">
                <div className="text-lg font-bold text-primary drop-shadow-sm">{selectedLeaf.highlights.proteins_percent}%</div>
                <div className="text-xs text-muted-foreground">{t('leaves.highlight.proteins')}</div>
              </div>
            )}
            {selectedLeaf.highlights.polyphenols_mg_per_100g !== undefined && (
              <div className="text-center p-4 bg-background/30 backdrop-blur-md rounded-xl border border-accent/20 shadow-lg shadow-accent/10">
                <div className="text-lg font-bold text-accent drop-shadow-sm">{selectedLeaf.highlights.polyphenols_mg_per_100g} mg</div>
                <div className="text-xs text-muted-foreground">{t('leaves.highlight.polyphenolsPer100g')}</div>
              </div>
            )}
            {selectedLeaf.highlights.flavonoids_mg_per_100g !== undefined && (
              <div className="text-center p-4 bg-background/30 backdrop-blur-md rounded-xl border border-secondary/20 shadow-lg shadow-secondary/10">
                <div className="text-lg font-bold text-secondary drop-shadow-sm">{selectedLeaf.highlights.flavonoids_mg_per_100g} mg</div>
                <div className="text-xs text-muted-foreground">{t('leaves.highlight.flavonoidsPer100g')}</div>
              </div>
            )}
            {selectedLeaf.highlights.calcium_mg_per_100g !== undefined && (
              <div className="text-center p-4 bg-background/30 backdrop-blur-md rounded-xl border border-foreground/10 shadow-lg shadow-foreground/5">
                <div className="text-lg font-bold text-foreground drop-shadow-sm">{selectedLeaf.highlights.calcium_mg_per_100g} mg</div>
                <div className="text-xs text-muted-foreground">{t('leaves.highlight.calciumPer100g')}</div>
              </div>
            )}
            {selectedLeaf.highlights.antioxidant_classification && (
              <div className="text-center p-4 bg-background/30 backdrop-blur-md rounded-xl border border-primary/20 shadow-lg shadow-primary/10">
                <div className="text-sm font-semibold text-primary drop-shadow-sm">{selectedLeaf.highlights.antioxidant_classification}</div>
                <div className="text-xs text-muted-foreground">Antioxidant classification</div>
              </div>
            )}
          </div>

          {/* Summary */}
          <div className="glass rounded-3xl p-5 border border-primary/10 shadow-xl shadow-primary/10 mb-6">
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
              <div className="glass rounded-3xl p-5 border border-accent/10 shadow-xl shadow-accent/10 mb-6">
                <h4 className="font-semibold mb-3 text-foreground drop-shadow-sm">{t('leaves.keyCompounds')}</h4>
                <CompoundsBubbleSimulation compounds={moleculeList} />
              </div>
            ) : null;
          })()}

          {/* Activities */}
          {(() => {
            const frKey = getFrKeyForLeaf(selectedLeaf);
            const extra = frKey ? extraBioByFr[frKey] : null;
            if (!extra?.activities?.length) return null;
            return (
              <div className="glass rounded-3xl p-5 border border-secondary/10 shadow-xl shadow-secondary/10 mb-6">
                <h4 className="font-semibold mb-3 text-foreground drop-shadow-sm">{t('leaves.mainBioactivities')}</h4>
                <div className="flex flex-wrap gap-2">
                  {extra.activities.map((a, i) => (
                    <span key={i} className="px-3 py-1.5 rounded-full text-xs bg-accent/20 text-accent border border-accent/30 shadow-sm">
                      {a}
                    </span>
                  ))}
                </div>
              </div>
            );
          })()}

          {/* Safety */}
          {selectedLeaf.safety && (
            <div className="glass rounded-3xl p-5 border border-orange-500/20 shadow-xl shadow-orange-500/10 mb-6">
              <h4 className="font-semibold mb-2 text-foreground drop-shadow-sm">{t('leaves.safety')}</h4>
              <p className="text-sm text-muted-foreground">{selectedLeaf.safety}</p>
            </div>
          )}

          {/* Gallery */}
          <LeafGallery
            leafId={selectedLeaf.id}
            leafName={selectedLeaf.name.en}
            galleryImages={selectedLeaf.gallery_images}
            className=""
          />
        </div>
      </div>
    );
  }

  // ── Grid View ──
  return (
    <div>
      <div className="px-3 md:px-6 pt-6 pb-4">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-5">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-1">{t('leaves.title') || 'Leaves'}</h1>
            <p className="text-sm text-muted-foreground">
              {filtered.length} species
            </p>
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('leaves.searchPlaceholder') || 'Search leaves...'}
              className="w-full bg-background border border-border rounded-xl py-2.5 pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all"
            />
          </div>
        </div>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {!isLoading && (
        <div className="px-3 md:px-6 pb-12">
          {filtered.length === 0 ? (
            <div className="text-center py-12">
              <Leaf className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No leaves found</h3>
              <p className="text-muted-foreground">Try adjusting your search term.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
              {filtered.map((leaf) => (
                <div
                  key={leaf.id}
                  className="group cursor-pointer"
                  onClick={() => navigate('/leaves?leafId=' + leaf.id)}
                >
                  <div className="bg-background border border-border rounded-2xl overflow-hidden hover:shadow-xl hover:border-primary/20 transition-all duration-300 hover:-translate-y-1">
                    <div className="w-full aspect-[4/3] relative overflow-hidden">
                      <img
                        src={getLeafImage(leaf)}
                        alt={leaf.name.en}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    </div>
                    <div className="p-3">
                      <h3 className="font-semibold text-sm text-foreground leading-tight line-clamp-2 group-hover:text-primary transition-colors">
                        {leaf.name[selectedLanguage]}
                      </h3>
                      <p className="text-[10px] text-muted-foreground mt-1 line-clamp-1">
                        {leaf.aliases.slice(0, 2).join(', ')}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
