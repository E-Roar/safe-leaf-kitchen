import { useState, useEffect } from "react";
import { Scan, MessageCircle, Leaf, TrendingUp, Calendar, Award, ChefHat, Zap } from "lucide-react";
import { StorageService } from "@/services/apiService";
import { recipes } from "@/data/recipes";

interface StatCard {
  title: string;
  value: string;
  icon: React.ComponentType<any>;
  color: string;
  change?: string;
}

interface LeafData {
  name: string;
  count: number;
  percentage: number;
}

export default function StatsPage() {
  const [stats, setStats] = useState({
    totalScans: 0,
    totalChats: 0,
    detectedLeaves: {} as Record<string, number>,
    recipeSuggestions: 0,
    savedConversations: 0
  });

  useEffect(() => {
    const loadStats = () => {
      setStats({
        totalScans: StorageService.getScans(),
        totalChats: StorageService.getChats(),
        detectedLeaves: StorageService.getDetectedLeaves(),
        recipeSuggestions: StorageService.getRecipeSuggestions(),
        savedConversations: StorageService.getConversationList().length
      });
    };

    loadStats();
    // Refresh stats when component becomes visible
    const interval = setInterval(loadStats, 1000);
    return () => clearInterval(interval);
  }, []);

  const topLeaves: LeafData[] = Object.entries(stats.detectedLeaves)
    .map(([name, count]) => ({
      name,
      count,
      percentage: (count / Math.max(1, Object.values(stats.detectedLeaves).reduce((a, b) => a + b, 0))) * 100
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // Calculate recipe-based metrics
  const totalRecipes = recipes.length;
  const avgProteins = recipes.reduce((sum, recipe) => sum + recipe.nutrition.proteins_g, 0) / totalRecipes;
  const avgPolyphenols = recipes.reduce((sum, recipe) => sum + recipe.nutrition.polyphenols_mg, 0) / totalRecipes;
  const avgFlavonoids = recipes.reduce((sum, recipe) => sum + recipe.nutrition.flavonoids_mg, 0) / totalRecipes;
  const highAntioxidantRecipes = recipes.filter(recipe => 
    recipe.nutrition.antioxidant_score.toLowerCase().includes('élevé') || 
    recipe.nutrition.antioxidant_score.toLowerCase().includes('high')
  ).length;

  const statCards: StatCard[] = [
    {
      title: "Total Scans",
      value: stats.totalScans.toString(),
      icon: Scan,
      color: "bg-gradient-to-br from-primary/20 to-primary/10",
      change: "+12% this week"
    },
    {
      title: "Chat Messages",
      value: stats.totalChats.toString(),
      icon: MessageCircle,
      color: "bg-gradient-to-br from-accent/20 to-accent/10",
      change: "+8% this week"
    },
    {
      title: "Available Recipes",
      value: totalRecipes.toString(),
      icon: ChefHat,
      color: "bg-gradient-to-br from-secondary/30 to-secondary/20",
      change: "Moroccan inspired"
    },
    {
      title: "High Antioxidant",
      value: highAntioxidantRecipes.toString(),
      icon: Zap,
      color: "bg-gradient-to-br from-primary/20 to-accent/10",
      change: "recipes available"
    },
    {
      title: "Recipe Suggestions",
      value: stats.recipeSuggestions.toString(),
      icon: ChefHat,
      color: "bg-gradient-to-br from-accent/20 to-secondary/10",
      change: "from chat"
    },
    {
      title: "Saved Conversations",
      value: stats.savedConversations.toString(),
      icon: MessageCircle,
      color: "bg-gradient-to-br from-secondary/20 to-accent/10",
      change: "conversations stored"
    }
  ];

  const nutritionalInsights = [
    {
      title: "Avg Proteins",
      value: `${avgProteins.toFixed(1)}g`,
      description: "per recipe",
      color: "text-primary"
    },
    {
      title: "Avg Polyphenols",
      value: `${avgPolyphenols.toFixed(0)}mg`,
      description: "per recipe",
      color: "text-accent"
    },
    {
      title: "Avg Flavonoids",
      value: `${avgFlavonoids.toFixed(1)}mg`,
      description: "per recipe",
      color: "text-secondary"
    }
  ];

  const recipeTips = [
    "🍃 Onion leaves are rich in antioxidants and perfect for traditional Moroccan dishes",
    "🥘 Msemen with onion leaves combines traditional flatbread with nutritious greens",
    "🍳 Omelettes with fresh leaves provide a quick, protein-rich meal option",
    "🌿 Dried leaf powder preserves nutrients and adds flavor to soups and sauces"
  ];

  return (
    <div className="min-h-screen p-4 space-y-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-foreground mb-2">
          Your Nutrition Journey
        </h1>
        <p className="text-muted-foreground">
          Track your discoveries and insights
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        {statCards.slice(0, 4).map((card, index) => (
          <div
            key={index}
            className={`glass rounded-2xl p-4 relative overflow-hidden ${card.color}`}
          >
            <div className="relative z-10">
              <div className="flex items-start justify-between mb-2">
                <div className={`p-2 rounded-xl bg-primary/10`}>
                  <card.icon className="w-5 h-5 text-primary" />
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-2xl font-bold text-foreground">{card.value}</p>
                <p className="text-sm text-muted-foreground">{card.title}</p>
                {card.change && (
                  <p className="text-xs text-accent font-medium">{card.change}</p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Additional Stats Row */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {statCards.slice(4, 6).map((card, index) => (
          <div
            key={index + 4}
            className={`glass rounded-2xl p-4 relative overflow-hidden ${card.color}`}
          >
            <div className="relative z-10">
              <div className="flex items-start justify-between mb-2">
                <div className={`p-2 rounded-xl bg-primary/10`}>
                  <card.icon className="w-5 h-5 text-primary" />
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-2xl font-bold text-foreground">{card.value}</p>
                <p className="text-sm text-muted-foreground">{card.title}</p>
                {card.change && (
                  <p className="text-xs text-accent font-medium">{card.change}</p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Top Detected Leaves */}
      {topLeaves.length > 0 && (
        <div className="glass rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Award className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold text-foreground">Most Scanned Leaves</h3>
          </div>
          <div className="space-y-3">
            {topLeaves.map((leaf, index) => (
              <div key={leaf.name} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                    index === 0 ? 'bg-primary text-primary-foreground' :
                    index === 1 ? 'bg-accent text-accent-foreground' :
                    'bg-secondary text-secondary-foreground'
                  }`}>
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-medium text-foreground capitalize">{leaf.name}</p>
                    <p className="text-xs text-muted-foreground">{leaf.count} scans</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-foreground">{leaf.percentage.toFixed(1)}%</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Nutritional Insights */}
      <div className="glass rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold text-foreground">Nutritional Insights</h3>
        </div>
        <div className="grid grid-cols-3 gap-4">
          {nutritionalInsights.map((insight, index) => (
            <div key={index} className="text-center">
              <p className={`text-2xl font-bold ${insight.color}`}>{insight.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{insight.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Recipe Tips */}
      <div className="glass rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <ChefHat className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold text-foreground">Recipe Insights</h3>
        </div>
        <div className="space-y-3">
          {recipeTips.map((tip, index) => (
            <div key={index} className="flex items-start gap-3 p-3 bg-gradient-organic rounded-xl">
              <div className="text-sm text-foreground leading-relaxed">{tip}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Recipe Nutrition Summary */}
      <div className="glass rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Leaf className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold text-foreground">Recipe Nutrition Summary</h3>
        </div>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Total Antioxidant Score</span>
            <span className="font-medium text-foreground">Very High</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Average Proteins</span>
            <span className="font-medium text-foreground">{avgProteins.toFixed(1)}g per recipe</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Total Polyphenols</span>
            <span className="font-medium text-foreground">{avgPolyphenols.toFixed(0)}mg per recipe</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">High Antioxidant Recipes</span>
            <span className="font-medium text-foreground">{highAntioxidantRecipes}/{totalRecipes}</span>
          </div>
        </div>
      </div>

      {/* Weekly Summary */}
      <div className="glass rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">This Week's Summary</h3>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Most Active Day</span>
            <span className="font-medium text-foreground">Wednesday</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Favorite Leaf Type</span>
            <span className="font-medium text-foreground capitalize">
              {topLeaves[0]?.name || 'No data yet'}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Average Session Time</span>
            <span className="font-medium text-foreground">3m 24s</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Recipes Available</span>
            <span className="font-medium text-foreground">{totalRecipes}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Avg Cooking Time</span>
            <span className="font-medium text-foreground">30 min</span>
          </div>
        </div>
      </div>
    </div>
  );
}