import { useState } from "react";
import { Heart, MessageCircle, Bookmark, Search, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

// Pinterest uses clean, image-forward cards with minimal text overlay.
// Every card should have: image, title below, author, engagement stats.
const POSTS = [
  { id: 1, title: "Spinach & Feta Flatbread", author: "Chef Amine", likes: 1240, comments: 89, saved: 340, gradient: "from-emerald-400 to-green-600", emoji: "🥬", category: "Main Course" },
  { id: 2, title: "Beet Leaf Smoothie Bowl", author: "Sara Kitchen", likes: 892, comments: 42, saved: 215, gradient: "from-pink-400 to-rose-600", emoji: "🥗", category: "Breakfast" },
  { id: 3, title: "Kale Chips with Za'atar", author: "Healthy Bites", likes: 2560, comments: 134, saved: 890, gradient: "from-lime-400 to-emerald-600", emoji: "🌿", category: "Snack" },
  { id: 4, title: "Fennel Frond Pesto", author: "Youssef Cooks", likes: 456, comments: 23, saved: 178, gradient: "from-yellow-400 to-amber-600", emoji: "🫒", category: "Sauce" },
  { id: 5, title: "Moroccan Turnip Greens Tagine", author: "Tradition & Spice", likes: 3120, comments: 245, saved: 1200, gradient: "from-orange-400 to-red-600", emoji: "🥘", category: "Traditional" },
  { id: 6, title: "Carrot Top Chimichurri", author: "Green Chef", likes: 780, comments: 56, saved: 310, gradient: "from-teal-400 to-cyan-600", emoji: "🥕", category: "Sauce" },
  { id: 7, title: "Artichoke Leaf Tea", author: "Tea Master", likes: 1980, comments: 98, saved: 670, gradient: "from-violet-400 to-purple-600", emoji: "🍵", category: "Beverage" },
  { id: 8, title: "Crispy Leek Greens", author: "Farm Kitchen", likes: 560, comments: 34, saved: 190, gradient: "from-green-400 to-teal-600", emoji: "🧅", category: "Side Dish" },
];

// Varying heights for masonry effect
const HEIGHTS = ["h-52", "h-64", "h-44", "h-56", "h-48", "h-60", "h-44", "h-52"];

function formatCount(n: number): string {
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
  return n.toString();
}

export default function CommunityHubPage() {
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'trending' | 'latest' | 'saved'>('trending');

  return (
    <div className="pt-16 min-h-screen">
      {/* Header */}
      <div className="px-4 md:px-8 pt-6 pb-4 max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-5">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-1">Community Hub</h1>
            <p className="text-sm text-muted-foreground">Discover and share leaf-based recipes from the community</p>
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search recipes..."
              className="w-full bg-background border border-border rounded-xl py-2.5 pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all"
            />
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex gap-1.5 bg-muted/50 p-1 rounded-xl border border-border w-fit mb-6">
          {([
            { id: 'trending' as const, label: 'Trending', icon: TrendingUp },
            { id: 'latest' as const, label: 'Latest', icon: MessageCircle },
            { id: 'saved' as const, label: 'Saved', icon: Bookmark },
          ]).map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all",
                activeTab === tab.id
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <tab.icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Pinterest Masonry Grid */}
      <div className="px-4 md:px-8 pb-12 max-w-7xl mx-auto">
        <div className="columns-2 sm:columns-3 lg:columns-4 xl:columns-5 gap-4">
          {POSTS.map((post, idx) => (
            <div
              key={post.id}
              className="break-inside-avoid mb-4 group cursor-pointer"
            >
              <div className="bg-background border border-border rounded-2xl overflow-hidden hover:shadow-xl hover:border-primary/20 transition-all duration-300 hover:-translate-y-1">
                {/* Image placeholder with gradient + emoji */}
                <div className={cn("w-full relative overflow-hidden flex items-center justify-center", HEIGHTS[idx % HEIGHTS.length])}>
                  <div className={cn("absolute inset-0 bg-gradient-to-br opacity-90", post.gradient)}></div>
                  <span className="relative text-5xl">{post.emoji}</span>

                  {/* Save button - appears on hover */}
                  <button className="absolute top-3 right-3 w-8 h-8 bg-foreground/80 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all transform scale-90 group-hover:scale-100">
                    <Bookmark className="w-3.5 h-3.5 text-white" />
                  </button>

                  {/* Category pill */}
                  <div className="absolute bottom-3 left-3 bg-black/40 backdrop-blur-sm text-white text-[10px] font-semibold px-2 py-0.5 rounded-md">
                    {post.category}
                  </div>
                </div>

                {/* Card Content */}
                <div className="p-3.5">
                  <h3 className="font-semibold text-sm text-foreground leading-tight mb-1.5 line-clamp-2 group-hover:text-primary transition-colors">
                    {post.title}
                  </h3>
                  <p className="text-xs text-muted-foreground mb-3">{post.author}</p>

                  {/* Engagement Row */}
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <button className="flex items-center gap-1 hover:text-red-500 transition-colors">
                      <Heart className="w-3.5 h-3.5" />
                      <span className="text-[11px] font-medium">{formatCount(post.likes)}</span>
                    </button>
                    <button className="flex items-center gap-1 hover:text-primary transition-colors">
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span className="text-[11px] font-medium">{formatCount(post.comments)}</span>
                    </button>
                    <div className="flex-1"></div>
                    <span className="text-[11px] font-medium">{formatCount(post.saved)} saves</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
