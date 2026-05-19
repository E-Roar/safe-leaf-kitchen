import { useState, useEffect } from "react";
import { Heart, MessageCircle, Share2, Star, Send, Clock, Users, Leaf, Bookmark, ChefHat, Store, Coffee, ChevronRight, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { CommunityService } from "@/services/communityService";
import { useAuth } from "@/contexts/AuthContext";
import AuthModal from "@/components/auth/AuthModal";
import type { CommunityRecipe, RecipeComment } from "@/types/community";
import { toast } from "sonner";

interface RecipeDiscussionPageProps {
  recipeId?: string | null;
}

const INGREDIENTS = [
  { name: 'Fresh Spinach', amount: '200g', coop: 'Agrinova Green Coop', price: '3 MAD', icon: '🥬' },
  { name: 'Feta Cheese', amount: '100g', coop: 'Local Market', price: '15 MAD', icon: '🧀' },
  { name: 'Pine Nuts', amount: '30g', coop: 'Atlas Harvest', price: '8 MAD', icon: '🌰' },
  { name: 'Lemon', amount: '1 whole', coop: 'Souss Valley Greens', price: '2 MAD', icon: '🍋' },
  { name: 'Olive Oil', amount: '3 tbsp', coop: 'Agrinova Green Coop', price: '5 MAD', icon: '🫒' },
  { name: 'Garlic', amount: '2 cloves', coop: 'Local Market', price: '1 MAD', icon: '🧄' },
];

const RESTAURANT_VERSIONS = [
  { name: 'Le Marrakech Organic', twist: 'Adds argan oil dressing and roasted almonds, served on a warm flatbread.', price: '85 MAD', rating: 4.9 },
  { name: 'Oasis Roots Cafe', twist: 'Uses baby kale instead of spinach, with a turmeric-tahini drizzle.', price: '65 MAD', rating: 4.7 },
  { name: 'Dar El Feuille', twist: 'Traditional presentation in a tagine bowl with preserved lemon and olives.', price: '75 MAD', rating: 4.8 },
];

export default function RecipeDiscussionPage({ recipeId }: RecipeDiscussionPageProps) {
  const { user } = useAuth();
  const [recipe, setRecipe] = useState<CommunityRecipe | null>(null);
  const [comments, setComments] = useState<RecipeComment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<'ingredients' | 'restaurants' | 'discussion'>('discussion');

  const fetchData = async () => {
    if (!recipeId) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    const allRecipes = await CommunityService.getRecipes();
    const found = allRecipes.find(r => r.id === recipeId);
    
    if (found) {
      setRecipe(found);
      const commentData = await CommunityService.getComments(recipeId);
      setComments(commentData);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [recipeId]);

  const handleLike = async () => {
    if (!recipe) return;
    if (!user) {
      setIsAuthModalOpen(true);
      return;
    }
    
    const success = await CommunityService.likeRecipe(recipe.id, user.id);
    if (success) {
      setRecipe(prev => prev ? { ...prev, likes_count: prev.likes_count + 1, is_liked_by_me: true } : null);
      toast.success("Recipe liked!");
    }
  };

  const handleSendComment = async () => {
    if (!recipe || !newComment.trim()) return;
    if (!user) {
      setIsAuthModalOpen(true);
      return;
    }

    const comment = await CommunityService.addComment(recipe.id, user.id, newComment);
    if (comment) {
      setComments(prev => [...prev, comment]);
      setNewComment("");
      setRecipe(prev => prev ? { ...prev, comments_count: prev.comments_count + 1 } : null);
      toast.success("Comment posted!");
    }
  };

  if (isLoading) {
    return (
      <div className="pt-24 flex flex-col items-center justify-center min-h-[50vh]">
        <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Loading recipe details...</p>
      </div>
    );
  }

  if (!recipe) {
    return (
      <div className="pt-24 px-4 text-center">
        <ChefHat className="w-16 h-16 mx-auto text-muted-foreground mb-4 opacity-20" />
        <h2 className="text-xl font-bold">Recipe not found</h2>
        <p className="text-muted-foreground">Select a recipe from the Community Hub to join the discussion.</p>
      </div>
    );
  }

  return (
    <div className="pt-14 min-h-screen">
      <div className="max-w-6xl mx-auto px-4 md:px-8 py-6">

        {/* Hero + Recipe Info */}
        <div className="grid lg:grid-cols-2 gap-8 mb-8">
          {/* Visual Placeholder */}
          <div className="rounded-3xl overflow-hidden border border-border h-72 md:h-96 relative group shadow-2xl">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-400 to-green-600 opacity-90" />
            <div className="absolute inset-0 flex items-center justify-center text-8xl">
              {recipe.title?.en?.toLowerCase().includes('spinach') ? '🥬' : '🌿'}
            </div>
            
            <div className="absolute top-4 left-4 flex gap-2">
              <span className="bg-background/90 backdrop-blur-md text-foreground text-[10px] uppercase tracking-wider font-bold px-3 py-1 rounded-full border border-border shadow-sm">
                {recipe.category?.name_en || 'Recipe'}
              </span>
              {recipe.region && (
                <span className="bg-primary text-primary-foreground text-[10px] uppercase tracking-wider font-bold px-3 py-1 rounded-full shadow-sm">
                  {recipe.region}
                </span>
              )}
            </div>
          </div>

          {/* Info */}
          <div className="flex flex-col justify-center">
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3 leading-tight">
              {recipe.title?.en || recipe.title?.fr}
            </h1>
            <div className="flex items-center gap-2 mb-6">
              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center border border-border overflow-hidden">
                {recipe.author?.avatar_url ? (
                   <img src={recipe.author.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span>{recipe.author?.avatar_emoji || '👤'}</span>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                By <span className="font-semibold text-foreground">{recipe.author?.display_name || 'Community Member'}</span> · {new Date(recipe.created_at).toLocaleDateString()}
              </p>
            </div>

            <div className="flex flex-wrap gap-3 mb-6">
              {recipe.prep_time_minutes && (
                <div className="flex items-center gap-2 text-xs font-semibold bg-muted/50 border border-border px-4 py-2 rounded-2xl">
                  <Clock className="w-4 h-4 text-orange-500" /> {recipe.prep_time_minutes} min
                </div>
              )}
              {recipe.servings && (
                <div className="flex items-center gap-2 text-xs font-semibold bg-muted/50 border border-border px-4 py-2 rounded-2xl">
                  <Users className="w-4 h-4 text-blue-500" /> {recipe.servings} servings
                </div>
              )}
              <div className="flex items-center gap-2 text-xs font-semibold bg-muted/50 border border-border px-4 py-2 rounded-2xl">
                <Leaf className="w-4 h-4 text-green-500" /> Traditional
              </div>
            </div>

            <div className="flex gap-3 mb-8">
              <button 
                onClick={handleLike}
                className={cn(
                  "flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-bold border transition-all shadow-sm", 
                  recipe.is_liked_by_me 
                    ? "bg-red-500 border-red-500 text-white" 
                    : "bg-background border-border hover:bg-muted"
                )}
              >
                <Heart className={cn("w-4 h-4", recipe.is_liked_by_me && "fill-current")} /> 
                {recipe.likes_count}
              </button>
              <button className="px-6 py-3 rounded-2xl text-sm font-bold border border-border bg-background hover:bg-muted transition-all flex items-center gap-2 shadow-sm">
                <Bookmark className="w-4 h-4" /> Save
              </button>
              <button className="p-3 rounded-2xl border border-border bg-background hover:bg-muted transition-all shadow-sm">
                <Share2 className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-muted/30 p-6 rounded-3xl border border-border">
              <h4 className="text-xs uppercase tracking-widest font-bold text-muted-foreground mb-2">History & Benefits</h4>
              <p className="text-foreground/90 text-sm leading-relaxed">
                {recipe.background_history || "This traditional recipe has been passed down through generations. It utilizes the fresh, seasonal leaves found in the Moroccan landscape."}
              </p>
              {recipe.known_benefits && (
                <p className="mt-4 text-sm text-primary font-medium flex items-center gap-2">
                  <Star className="w-4 h-4 fill-current" /> {recipe.known_benefits}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Section Tabs */}
        <div className="flex gap-1 bg-muted/50 p-1 rounded-2xl border border-border w-fit mb-8">
          {([
            { id: 'discussion' as const, label: 'Discussion', icon: MessageCircle },
            { id: 'ingredients' as const, label: 'Ingredients & Sources', icon: Store },
            { id: 'restaurants' as const, label: 'Restaurants', icon: Coffee },
          ]).map(tab => (
            <button 
              key={tab.id} 
              onClick={() => setActiveSection(tab.id)} 
              className={cn(
                "flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold transition-all", 
                activeSection === tab.id ? "bg-background text-foreground shadow-md" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <tab.icon className="w-4 h-4" /> {tab.label}
            </button>
          ))}
        </div>

        {/* Content Sections */}
        <div className="max-w-4xl">
          {activeSection === 'discussion' && (
            <div className="bg-background border border-border rounded-3xl overflow-hidden shadow-xl">
              <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-muted/20">
                <h2 className="font-bold text-sm flex items-center gap-2">
                  <MessageCircle className="w-4 h-4 text-primary" /> 
                  Comments
                  <span className="bg-primary/10 text-primary text-[10px] px-2 py-0.5 rounded-full font-bold">
                    {comments.length}
                  </span>
                </h2>
              </div>

              <div className="p-6 space-y-6 max-h-[600px] overflow-y-auto no-scrollbar">
                {comments.length === 0 ? (
                  <div className="text-center py-12">
                    <MessageCircle className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-20" />
                    <p className="text-muted-foreground text-sm">No comments yet. Be the first to start the discussion!</p>
                  </div>
                ) : (
                  comments.map(comment => (
                    <div key={comment.id} className="flex gap-4 group">
                      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-sm shrink-0 border border-border shadow-sm overflow-hidden">
                        {comment.author?.avatar_url ? (
                          <img src={comment.author.avatar_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <span>{comment.author?.avatar_emoji || '👤'}</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="bg-muted/40 p-4 rounded-3xl rounded-tl-none border border-border group-hover:bg-muted/60 transition-colors">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-bold text-xs">{comment.author?.display_name || 'User'}</span>
                            <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                              {comment.author?.role || 'Member'}
                            </span>
                            <span className="text-[10px] text-muted-foreground ml-auto">
                              {new Date(comment.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-sm text-foreground/80 leading-relaxed">{comment.content}</p>
                        </div>
                        <div className="flex gap-4 mt-2 ml-2 text-[11px] font-bold text-muted-foreground">
                          <button className="hover:text-red-500 transition-colors flex items-center gap-1.5">
                            <Heart className="w-3.5 h-3.5" /> 0
                          </button>
                          <button className="hover:text-primary transition-colors">Reply</button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="p-4 bg-muted/20 border-t border-border">
                <div className="flex gap-3 bg-background border border-border rounded-2xl p-1.5 shadow-inner">
                  <input 
                    type="text" 
                    value={newComment} 
                    onChange={e => setNewComment(e.target.value)} 
                    onKeyDown={e => e.key === 'Enter' && handleSendComment()}
                    placeholder="Share your thoughts or variations..." 
                    className="flex-1 bg-transparent border-none py-2 px-3 text-sm focus:outline-none" 
                  />
                  <button 
                    onClick={handleSendComment}
                    disabled={!newComment.trim()}
                    className={cn(
                      "p-2.5 rounded-xl transition-all shrink-0 shadow-md", 
                      newComment.trim() ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                    )}
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Static sections remain with improved styling */}
          {activeSection === 'ingredients' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="grid sm:grid-cols-2 gap-4">
                {INGREDIENTS.map((item, i) => (
                  <div key={i} className="bg-background border border-border rounded-2xl p-4 hover:shadow-lg transition-all group flex items-start gap-4">
                    <span className="text-3xl bg-muted p-2 rounded-xl group-hover:scale-110 transition-transform">{item.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-1">
                        <h4 className="font-bold text-sm">{item.name}</h4>
                        <span className="text-xs font-black text-primary">{item.price}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mb-3">{item.amount}</p>
                      <div className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 w-fit px-2 py-0.5 rounded-lg uppercase tracking-wider">
                        <Store className="w-3 h-3" /> {item.coop}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeSection === 'restaurants' && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
              {RESTAURANT_VERSIONS.map((r, i) => (
                <div key={i} className="bg-background border border-border rounded-3xl p-6 hover:shadow-xl transition-all cursor-pointer group flex gap-6">
                  <div className="w-16 h-16 bg-amber-500/10 text-amber-600 rounded-2xl flex items-center justify-center shrink-0 group-hover:bg-amber-500 group-hover:text-white transition-all duration-300">
                    <Coffee className="w-8 h-8" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-bold text-lg group-hover:text-amber-600 transition-colors">{r.name}</h4>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="flex items-center gap-1 text-xs font-bold bg-yellow-500/10 text-yellow-600 px-2 py-1 rounded-lg">
                          <Star className="w-3 h-3 fill-current" /> {r.rating}
                        </span>
                        <span className="font-black text-foreground">{r.price}</span>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed italic">"{r.twist}"</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:translate-x-1 transition-transform mt-6" />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </div>
  );
}
