import { useState } from "react";
import { Heart, MessageCircle, Share2, Star, Send, Clock, Users, Leaf, Bookmark, MoreHorizontal, Store, Coffee, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

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

const COMMENTS = [
  { id: 1, user: "Amine", badge: "Top Chef", avatar: "🧑‍🍳", text: "The spinach leaves were so tender when blanched. I added a hint of nutmeg — game changer!", time: "2h ago", likes: 12 },
  { id: 2, user: "Sara", badge: "Member", avatar: "👩‍🌾", text: "Can I substitute the spinach with beet leaves? I have a lot from my garden.", time: "5h ago", likes: 4,
    replies: [
      { id: 21, user: "Youssef", badge: "Expert", avatar: "👨‍🔬", text: "Yes! Blanch them 2 min longer to reduce oxalates. Works great.", time: "4h ago", likes: 8 }
    ]
  },
  { id: 3, user: "Nadia", badge: "Nutritionist", avatar: "💚", text: "Great iron content in this recipe. Pair with vitamin C (lemon) for better absorption.", time: "1d ago", likes: 23 },
];

export default function RecipeDiscussionPage() {
  const [newComment, setNewComment] = useState("");
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [likes, setLikes] = useState(342);
  const [activeSection, setActiveSection] = useState<'ingredients' | 'restaurants' | 'discussion'>('ingredients');

  const handleLike = () => { setLikes(l => liked ? l - 1 : l + 1); setLiked(!liked); };

  return (
    <div className="pt-14 min-h-screen">
      <div className="max-w-6xl mx-auto px-4 md:px-8 py-6">

        {/* Hero + Recipe Info */}
        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          {/* Image */}
          <div className="rounded-2xl overflow-hidden border border-border h-64 md:h-80 relative group">
            <img
              src="/images/recipe_salad.png"
              alt="Fresh Spinach & Feta Salad"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
            />
            <div className="absolute top-4 left-4 flex gap-2">
              <span className="bg-background/90 backdrop-blur-sm text-foreground text-xs font-semibold px-2.5 py-1 rounded-lg border border-border flex items-center gap-1">
                <Leaf className="w-3 h-3 text-green-500" /> Vegan
              </span>
              <span className="bg-amber-500 text-white text-xs font-semibold px-2.5 py-1 rounded-lg">
                Trending
              </span>
            </div>
            <div className="absolute top-4 right-4 bg-background/90 backdrop-blur-sm px-2.5 py-1 rounded-lg flex items-center gap-1 text-xs font-bold border border-border">
              <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" /> 4.9
            </div>
          </div>

          {/* Info */}
          <div className="flex flex-col justify-center">
            <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">Fresh Spinach & Feta Salad</h1>
            <p className="text-sm text-muted-foreground mb-4">By <span className="font-medium text-foreground">Chef Kamal</span> · 2 days ago</p>

            <div className="flex flex-wrap gap-2 mb-4">
              <div className="flex items-center gap-1.5 text-xs font-medium bg-muted px-3 py-1.5 rounded-lg"><Clock className="w-3.5 h-3.5 text-orange-500" /> 15 min</div>
              <div className="flex items-center gap-1.5 text-xs font-medium bg-muted px-3 py-1.5 rounded-lg"><Users className="w-3.5 h-3.5 text-blue-500" /> 2 servings</div>
              <div className="flex items-center gap-1.5 text-xs font-medium bg-muted px-3 py-1.5 rounded-lg"><Leaf className="w-3.5 h-3.5 text-green-500" /> High Iron</div>
            </div>

            <div className="flex gap-2 mb-5">
              <button onClick={handleLike} className={cn("flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border transition-all", liked ? "bg-red-50 border-red-200 text-red-600 dark:bg-red-950/30 dark:border-red-900" : "bg-background border-border hover:bg-muted")}>
                <Heart className={cn("w-4 h-4", liked && "fill-current")} /> {likes}
              </button>
              <button onClick={() => setSaved(!saved)} className={cn("flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border transition-all", saved ? "bg-primary/10 border-primary/30 text-primary" : "bg-background border-border hover:bg-muted")}>
                <Bookmark className={cn("w-4 h-4", saved && "fill-current")} /> Save
              </button>
              <button className="px-4 py-2 rounded-xl text-sm font-semibold border border-border bg-background hover:bg-muted transition-all flex items-center gap-2">
                <Share2 className="w-4 h-4" /> Share
              </button>
            </div>

            <p className="text-foreground/80 text-sm leading-relaxed">
              A refreshing salad using fresh local spinach leaves. Rich in iron, calcium, and antioxidants. The secret is a light lemon-garlic massage to break down the fibrous texture before adding crumbled feta and toasted pine nuts.
            </p>
          </div>
        </div>

        {/* Section Tabs */}
        <div className="flex gap-1 bg-muted/50 p-1 rounded-xl border border-border w-fit mb-6">
          {([
            { id: 'ingredients' as const, label: 'Ingredients & Sources', icon: Store },
            { id: 'restaurants' as const, label: 'Restaurant Versions', icon: Coffee },
            { id: 'discussion' as const, label: 'Discussion', icon: MessageCircle },
          ]).map(tab => (
            <button key={tab.id} onClick={() => setActiveSection(tab.id)} className={cn("flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all", activeSection === tab.id ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}>
              <tab.icon className="w-3.5 h-3.5" /> {tab.label}
            </button>
          ))}
        </div>

        {/* Ingredients from Cooperatives */}
        {activeSection === 'ingredients' && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground mb-2">All ingredients are sourced from our partner cooperatives for maximum freshness and traceability.</p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {INGREDIENTS.map((item, i) => (
                <div key={i} className="bg-background border border-border rounded-xl p-4 hover:shadow-md hover:border-primary/20 transition-all group cursor-pointer">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">{item.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <h4 className="font-semibold text-sm">{item.name}</h4>
                        <span className="text-xs font-bold text-primary">{item.price}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">{item.amount}</p>
                      <div className="flex items-center gap-1 mt-2">
                        <Store className="w-3 h-3 text-emerald-500" />
                        <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400">{item.coop}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl p-4 flex items-center gap-3 mt-4">
              <Store className="w-5 h-5 text-emerald-500 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">Total cost: ~34 MAD</p>
                <p className="text-xs text-emerald-600/80 dark:text-emerald-400/70">Sourced from 3 local cooperatives · Supports sustainable farming</p>
              </div>
            </div>
          </div>
        )}

        {/* Restaurant Versions */}
        {activeSection === 'restaurants' && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground mb-2">These partner restaurants serve their own creative take on this recipe.</p>
            {RESTAURANT_VERSIONS.map((r, i) => (
              <div key={i} className="bg-background border border-border rounded-xl p-5 hover:shadow-md hover:border-amber-500/20 transition-all cursor-pointer group flex gap-4">
                <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-xl flex items-center justify-center shrink-0 group-hover:bg-amber-500 group-hover:text-white transition-colors">
                  <Coffee className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-1">
                    <h4 className="font-semibold group-hover:text-amber-600 transition-colors">{r.name}</h4>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="flex items-center gap-0.5 text-xs font-semibold"><Star className="w-3 h-3 text-yellow-500 fill-yellow-500" /> {r.rating}</span>
                      <span className="font-bold text-sm">{r.price}</span>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">{r.twist}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity mt-3 shrink-0" />
              </div>
            ))}
          </div>
        )}

        {/* Discussion */}
        {activeSection === 'discussion' && (
          <div className="bg-background border border-border rounded-2xl overflow-hidden max-w-2xl">
            <div className="px-4 py-3 border-b border-border flex items-center justify-between">
              <h2 className="font-semibold text-sm flex items-center gap-2">
                <MessageCircle className="w-4 h-4 text-primary" /> Discussion
                <span className="bg-muted text-muted-foreground text-[10px] px-1.5 py-0.5 rounded font-bold">24</span>
              </h2>
              <button className="p-1 hover:bg-muted rounded-lg transition-colors"><MoreHorizontal className="w-4 h-4 text-muted-foreground" /></button>
            </div>

            <div className="p-4 space-y-4 max-h-[500px] overflow-y-auto">
              {COMMENTS.map(comment => (
                <div key={comment.id} className="space-y-3">
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm shrink-0 border border-border">{comment.avatar}</div>
                    <div className="flex-1 min-w-0">
                      <div className="bg-muted/50 p-3 rounded-xl rounded-tl-sm border border-border">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-xs">{comment.user}</span>
                          <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-medium">{comment.badge}</span>
                          <span className="text-[10px] text-muted-foreground ml-auto">{comment.time}</span>
                        </div>
                        <p className="text-xs text-foreground/80 leading-relaxed">{comment.text}</p>
                      </div>
                      <div className="flex gap-4 mt-1.5 ml-1 text-[11px] font-medium text-muted-foreground">
                        <button className="hover:text-red-500 transition-colors flex items-center gap-1"><Heart className="w-3 h-3" /> {comment.likes}</button>
                        <button className="hover:text-primary transition-colors">Reply</button>
                      </div>
                    </div>
                  </div>
                  {comment.replies?.map(reply => (
                    <div key={reply.id} className="flex gap-3 ml-10">
                      <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-xs shrink-0 border border-border">{reply.avatar}</div>
                      <div className="flex-1 min-w-0">
                        <div className="bg-muted/30 p-2.5 rounded-xl rounded-tl-sm border border-border">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-xs">{reply.user}</span>
                            <span className="text-[10px] bg-accent/10 text-accent px-1.5 py-0.5 rounded font-medium">{reply.badge}</span>
                            <span className="text-[10px] text-muted-foreground ml-auto">{reply.time}</span>
                          </div>
                          <p className="text-xs text-foreground/80 leading-relaxed">{reply.text}</p>
                        </div>
                        <div className="flex gap-4 mt-1.5 ml-1 text-[11px] font-medium text-muted-foreground">
                          <button className="hover:text-red-500 transition-colors flex items-center gap-1"><Heart className="w-3 h-3" /> {reply.likes}</button>
                          <button className="hover:text-primary transition-colors">Reply</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>

            <div className="p-3 border-t border-border">
              <div className="flex gap-2">
                <input type="text" value={newComment} onChange={e => setNewComment(e.target.value)} placeholder="Add a comment..." className="flex-1 bg-muted border border-border rounded-xl py-2.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all" />
                <button className={cn("p-2.5 rounded-xl transition-all shrink-0", newComment.trim() ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
