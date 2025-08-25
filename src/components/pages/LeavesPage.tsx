import { useState, useEffect } from "react";
import { X, Menu, Leaf, Search, Star } from "lucide-react";
import { leaves, LeafInfo } from "@/data/leaves";
import { cn } from "@/lib/utils";

type Language = 'en' | 'fr';

interface LeavesPageProps {
  selectedLeafId?: number | null;
}

export default function LeavesPage({ selectedLeafId }: LeavesPageProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedLeaf, setSelectedLeaf] = useState<LeafInfo | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState<Language>('en');
  const [query, setQuery] = useState("");

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
              {selectedLeaf.compounds && selectedLeaf.compounds.length > 0 && (
                <div className="glass rounded-3xl p-5">
                  <h4 className="font-semibold mb-2 text-foreground">Key compounds</h4>
                  <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
                    {selectedLeaf.compounds.map((c, i) => (
                      <li key={i}>{c}</li>
                    ))}
                  </ul>
                </div>
              )}

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


