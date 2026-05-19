import { useState, useEffect } from "react";
import { Heart, MessageCircle, Bookmark, Search, TrendingUp, Loader2, ChefHat, Plus, Share2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { CommunityService } from "@/services/communityService";
import type { CommunityRecipe, RecipeCategory } from "@/types/community";
import CreateRecipeModal from "@/components/features/CreateRecipeModal";
import AuthModal from "@/components/auth/AuthModal";
import { useAuth } from "@/contexts/AuthContext";


// Species emoji map
const SPECIES_EMOJI: Record<string, string> = {
  'onion': '🧅', 'oignon': '🧅', 'beetroot': '🥬', 'betterave': '🥬',
  'radish': '🌱', 'radis': '🌱', 'fennel': '🌿', 'fenouil': '🌿',
  'turnip': '🥕', 'navet': '🥕', 'carrot': '🥕', 'carotte': '🥕',
  'artichoke': '🌺', 'artichaut': '🌺', 'kohlrabi': '🥦', 'chou-rave': '🥦',
  'leek': '🧅', 'poireau': '🧅',
};

const GRADIENTS = [
  "from-emerald-400 to-green-600", "from-pink-400 to-rose-600",
  "from-lime-400 to-emerald-600", "from-yellow-400 to-amber-600",
  "from-orange-400 to-red-600", "from-teal-400 to-cyan-600",
  "from-violet-400 to-purple-600", "from-green-400 to-teal-600",
  "from-sky-400 to-indigo-600", "from-fuchsia-400 to-pink-600",
];

const HEIGHTS = ["h-52", "h-64", "h-44", "h-56", "h-48", "h-60", "h-44", "h-52"];

function getSpeciesEmoji(title: string): string {
  const t = title.toLowerCase();
  for (const [key, emoji] of Object.entries(SPECIES_EMOJI)) {
    if (t.includes(key)) return emoji;
  }
  return '🌿';
}

function formatCount(n: number): string {
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
  return n.toString();
}

export default function CommunityHubPage() {
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'trending' | 'latest' | 'saved'>('trending');
  const [recipes, setRecipes] = useState<CommunityRecipe[]>([]);
  const [categories, setCategories] = useState<RecipeCategory[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Fetch initial data
  const loadData = async () => {
    setIsLoading(true);
    const [recipeData, categoryData] = await Promise.all([
      CommunityService.getRecipes({ 
        categoryId: selectedCategoryId || undefined,
        status: activeTab === 'latest' ? 'all' : 'approved' 
      }),
      CommunityService.getCategories()
    ]);
    setRecipes(recipeData);
    setCategories(categoryData);
    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [selectedCategoryId, activeTab]);

  const filtered = recipes.filter(r => {
    if (activeTab === 'saved') return false; // TODO: wire to user saved list
    if (search.trim()) {
      const q = search.toLowerCase();
      const title = (r.title?.fr || r.title?.en || '').toLowerCase();
      const step = (r.steps?.fr?.[0] || '').toLowerCase();
      const region = (r.region || '').toLowerCase();
      return title.includes(q) || step.includes(q) || region.includes(q);
    }
    return true;
  });

  const handleRecipeClick = (recipeId: string) => {
    window.dispatchEvent(new CustomEvent('navigateToDiscussion', { detail: { recipeId } }));
  };

  const handleShareClick = () => {
    if (!user) {
      setIsAuthModalOpen(true);
      return;
    }
    setIsCreateModalOpen(true);
  };

  return (
    <div className="pt-16 min-h-screen">
      {/* Header */}
      <div className="px-4 md:px-8 pt-6 pb-4 max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-5">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-1">Community Hub</h1>
            <p className="text-sm text-muted-foreground">
              Discover and share traditional Moroccan recipes using local leaves
            </p>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input 
                value={search} 
                onChange={e => setSearch(e.target.value)} 
                placeholder="Search by recipe, region..."
                className="w-full bg-background border border-border rounded-xl py-2.5 pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all"
              />
            </div>
            <button 
              onClick={handleShareClick}
              className="bg-primary text-primary-foreground p-2.5 rounded-xl shadow-lg shadow-primary/20 hover:-translate-y-1 transition-all active:scale-95 sm:hidden"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filters and Tabs */}
        <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center mb-6">
          <div className="flex gap-1.5 bg-muted/50 p-1 rounded-xl border border-border w-fit">
            {([
              { id: 'trending' as const, label: 'Trending', icon: TrendingUp },
              { id: 'latest' as const, label: 'Latest', icon: MessageCircle },
              { id: 'saved' as const, label: 'Saved', icon: Bookmark },
            ]).map(tab => (
              <button 
                key={tab.id} 
                onClick={() => setActiveTab(tab.id)}
                className={cn("flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all",
                  activeTab === tab.id ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <tab.icon className="w-3.5 h-3.5" /> {tab.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 w-full md:w-auto no-scrollbar">
            <button
              onClick={() => setSelectedCategoryId(null)}
              className={cn(
                "whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-medium transition-all",
                !selectedCategoryId ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"
              )}
            >
              All
            </button>
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategoryId(cat.id)}
                className={cn(
                  "whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 transition-all",
                  selectedCategoryId === cat.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"
                )}
              >
                <span>{cat.emoji}</span>
                <span>{cat.name_en}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="text-center py-12">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary mb-4" />
          <p className="text-muted-foreground text-sm">Loading community recipes...</p>
        </div>
      )}

      {/* Pinterest Masonry Grid */}
      {!isLoading && (
        <div className="px-4 md:px-8 pb-12 max-w-7xl mx-auto relative">
          
          {/* Desktop Share Button */}
          <button 
            onClick={handleShareClick}
            className="fixed bottom-24 right-8 z-30 hidden sm:flex items-center gap-2 bg-primary text-primary-foreground px-6 py-4 rounded-[2rem] shadow-2xl shadow-primary/40 hover:-translate-y-2 transition-all active:scale-95 group font-bold"
          >
            <Share2 className="w-5 h-5 group-hover:rotate-12 transition-transform" />
            Share Traditional Recipe
          </button>

          {filtered.length === 0 ? (
            <div className="text-center py-12">
              <ChefHat className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-20" />
              <h3 className="text-lg font-semibold mb-2">No recipes found</h3>
              <p className="text-muted-foreground text-sm">Try adjusting your filters or search query.</p>
            </div>
          ) : (
            <div className="columns-2 sm:columns-3 lg:columns-4 xl:columns-5 gap-4">
              {filtered.map((post, idx) => (
                <div key={post.id} className="break-inside-avoid mb-4 group cursor-pointer" onClick={() => handleRecipeClick(post.id)}>
                  <div className="bg-background border border-border rounded-2xl overflow-hidden hover:shadow-xl hover:border-primary/20 transition-all duration-300 hover:-translate-y-1">
                    {/* Visual Header */}
                    <div className={cn("w-full relative overflow-hidden flex items-center justify-center", HEIGHTS[idx % HEIGHTS.length])}>
                      <div className={cn("absolute inset-0 bg-gradient-to-br opacity-90", GRADIENTS[idx % GRADIENTS.length])} />
                      <span className="relative text-5xl drop-shadow-lg">{getSpeciesEmoji(post.title?.fr || post.title?.en || '')}</span>

                      <button className="absolute top-3 right-3 w-8 h-8 bg-black/20 backdrop-blur-md rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all transform scale-90 group-hover:scale-100 hover:bg-black/40">
                        <Bookmark className="w-3.5 h-3.5 text-white" />
                      </button>

                      <div className="absolute bottom-3 left-3 flex flex-wrap gap-1.5">
                        {post.author?.role === 'chef' && (
                          <div className="bg-amber-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider shadow-sm">Chef</div>
                        )}
                        {post.region && (
                          <div className="bg-black/30 backdrop-blur-sm text-white text-[10px] font-medium px-2 py-0.5 rounded-md border border-white/10">{post.region}</div>
                        )}
                      </div>
                    </div>

                    {/* Card Content */}
                    <div className="p-3.5">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-[10px] shrink-0 border border-border overflow-hidden">
                          {post.author?.avatar_url ? (
                            <img src={post.author.avatar_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <span>{post.author?.avatar_emoji || '👤'}</span>
                          )}
                        </div>
                        <span className="text-[11px] font-medium text-foreground truncate">
                          {post.author?.display_name || 'Anonymous User'}
                        </span>
                      </div>

                      <h3 className="font-semibold text-sm text-foreground leading-tight mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                        {post.title?.en || post.title?.fr}
                      </h3>
                      
                      <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/50">
                        <div className="flex items-center gap-3">
                          <button className="flex items-center gap-1 text-muted-foreground hover:text-red-500 transition-colors">
                            <Heart className={cn("w-3.5 h-3.5", post.is_liked_by_me && "fill-red-500 text-red-500")} />
                            <span className="text-[10px] font-mono">{formatCount(post.likes_count)}</span>
                          </button>
                          <button className="flex items-center gap-1 text-muted-foreground hover:text-primary transition-colors">
                            <MessageCircle className="w-3.5 h-3.5" />
                            <span className="text-[10px] font-mono">{formatCount(post.comments_count)}</span>
                          </button>
                        </div>
                        {post.prep_time_minutes && (
                          <span className="text-[10px] text-muted-foreground font-medium">{post.prep_time_minutes}m</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      <CreateRecipeModal 
        isOpen={isCreateModalOpen} 
        onClose={() => setIsCreateModalOpen(false)} 
        onSuccess={loadData}
      />
      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
      />
    </div>
  );
}
