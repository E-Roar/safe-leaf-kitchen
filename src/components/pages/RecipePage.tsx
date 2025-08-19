import { useState, useEffect } from "react";
import { ChevronDown, ChevronUp, ChefHat, Clock, Users, Leaf, Zap, BookOpen, Star, Menu, X } from "lucide-react";
import { recipes, Recipe } from "@/data/recipes";
import { cn } from "@/lib/utils";

type Language = 'en' | 'fr' | 'ar';

interface RecipePageProps {
  selectedRecipeId?: number | null;
}

export default function RecipePage({ selectedRecipeId }: RecipePageProps) {
  const [selectedLanguage, setSelectedLanguage] = useState<Language>('en');
  const [expandedRecipe, setExpandedRecipe] = useState<number | null>(null);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleRecipe = (recipeId: number) => {
    setExpandedRecipe(expandedRecipe === recipeId ? null : recipeId);
  };

  const getNutritionColor = (score: string) => {
    switch (score.toLowerCase()) {
      case 'très élevé':
      case 'very high':
        return 'text-emerald-400';
      case 'élevé':
      case 'high':
        return 'text-green-400';
      case 'modéré':
      case 'moderate':
        return 'text-yellow-400';
      default:
        return 'text-muted-foreground';
    }
  };

  const getRecipeImage = (recipeTitle: string) => {
    // Convert recipe title to filename format
    const filename = recipeTitle
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '-');
    return `/images/recipes/${filename}.png`;
  };

  const handleRecipeSelect = (recipe: Recipe) => {
    setSelectedRecipe(recipe);
    setExpandedRecipe(recipe.id);
    setIsSidebarOpen(false);
  };

  // Auto-select recipe when selectedRecipeId is provided
  useEffect(() => {
    if (selectedRecipeId) {
      const recipe = recipes.find(r => r.id === selectedRecipeId);
      if (recipe) {
        setSelectedRecipe(recipe);
        setExpandedRecipe(recipe.id);
      }
    }
  }, [selectedRecipeId]);

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-40 w-80 bg-background/95 backdrop-blur-xl border-r border-border transform transition-transform duration-300 ease-in-out",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full",
        "lg:relative lg:translate-x-0 lg:border-r lg:border-border"
      )}>
        <div className="flex flex-col h-full">
          {/* Sidebar Header */}
          <div className="p-6 border-b border-border">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-foreground">Recipe Menu</h2>
              <button
                onClick={() => setIsSidebarOpen(false)}
                className="lg:hidden p-2 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Select a recipe to view details
            </p>
          </div>

          {/* Recipe List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {recipes.map((recipe) => (
              <button
                key={recipe.id}
                onClick={() => handleRecipeSelect(recipe)}
                className={cn(
                  "w-full p-4 rounded-2xl text-left transition-all duration-300 hover:shadow-lg",
                  selectedRecipe?.id === recipe.id
                    ? "glass bg-primary/10 border border-primary/20"
                    : "glass hover:bg-muted/30"
                )}
              >
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-xl overflow-hidden bg-gradient-organic flex items-center justify-center">
                    <img
                      src={getRecipeImage(recipe.title.en)}
                      alt={recipe.title.en}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        // Fallback to icon if image fails to load
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        target.nextElementSibling?.classList.remove('hidden');
                      }}
                    />
                    <ChefHat className="w-8 h-8 text-primary hidden" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground text-sm line-clamp-2">
                      {recipe.title[selectedLanguage]}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      {recipe.nutrition.antioxidant_score} • {recipe.ingredients[selectedLanguage].length} ingredients
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Mobile Header */}
        <div className="lg:hidden p-4 border-b border-border">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 rounded-lg hover:bg-muted/50 transition-colors"
            >
              <Menu className="w-6 h-6" />
            </button>
            <h1 className="text-lg font-bold text-foreground">Recipes</h1>
            <div className="w-10"></div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 p-4 lg:p-6">
          {selectedRecipe ? (
            <div className="space-y-6">
              {/* Recipe Header */}
              <div className="text-center mb-8">
                <div className="flex items-center justify-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-gradient-primary rounded-full flex items-center justify-center">
                    <ChefHat className="w-6 h-6 text-primary-foreground" />
                  </div>
                </div>
                <h1 className="text-3xl font-bold text-foreground mb-2">
                  {selectedRecipe.title[selectedLanguage]}
                </h1>
                <p className="text-muted-foreground max-w-md mx-auto">
                  Traditional Moroccan recipe with fresh, nutritious leaves
                </p>
              </div>

              {/* Language Selector */}
              <div className="flex justify-center mb-6">
                <div className="glass rounded-2xl p-1 flex">
                  {(['en', 'fr', 'ar'] as Language[]).map((lang) => (
                    <button
                      key={lang}
                      onClick={() => setSelectedLanguage(lang)}
                      className={cn(
                        "px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300",
                        selectedLanguage === lang
                          ? "bg-primary text-primary-foreground shadow-lg"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                      )}
                    >
                      {lang === 'en' ? 'English' : lang === 'fr' ? 'Français' : 'العربية'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Recipe Image */}
              <div className="flex justify-center mb-6">
                <div className="w-full max-w-md h-64 rounded-3xl overflow-hidden bg-gradient-organic">
                  <img
                    src={getRecipeImage(selectedRecipe.title.en)}
                    alt={selectedRecipe.title[selectedLanguage]}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      // Fallback to placeholder if image fails to load
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      target.nextElementSibling?.classList.remove('hidden');
                    }}
                  />
                  <div className="w-full h-full flex items-center justify-center hidden">
                    <div className="text-center">
                      <ChefHat className="w-16 h-16 text-primary mx-auto mb-4" />
                      <p className="text-muted-foreground">Recipe Image</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recipe Details */}
              <div className="glass rounded-3xl overflow-hidden">
                {/* Recipe Header */}
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          <span>30 min</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          <span>4 servings</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Leaf className="w-4 h-4" />
                          <span className={getNutritionColor(selectedRecipe.nutrition.antioxidant_score)}>
                            {selectedRecipe.nutrition.antioxidant_score}
                          </span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => toggleRecipe(selectedRecipe.id)}
                      className="p-2 rounded-full hover:bg-muted/50 transition-colors"
                    >
                      {expandedRecipe === selectedRecipe.id ? (
                        <ChevronUp className="w-5 h-5 text-primary" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-primary" />
                      )}
                    </button>
                  </div>

                  {/* Quick Nutrition Preview */}
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    <div className="text-center p-3 bg-gradient-organic rounded-xl">
                      <div className="text-lg font-bold text-primary">
                        {selectedRecipe.nutrition.proteins_g}g
                      </div>
                      <div className="text-xs text-muted-foreground">Protein</div>
                    </div>
                    <div className="text-center p-3 bg-gradient-organic rounded-xl">
                      <div className="text-lg font-bold text-accent">
                        {selectedRecipe.nutrition.polyphenols_mg}mg
                      </div>
                      <div className="text-xs text-muted-foreground">Polyphenols</div>
                    </div>
                    <div className="text-center p-3 bg-gradient-organic rounded-xl">
                      <div className="text-lg font-bold text-secondary">
                        {selectedRecipe.nutrition.flavonoids_mg}mg
                      </div>
                      <div className="text-xs text-muted-foreground">Flavonoids</div>
                    </div>
                  </div>
                </div>

                {/* Expanded Content */}
                {expandedRecipe === selectedRecipe.id && (
                  <div className="border-t border-border/50 bg-gradient-organic">
                    <div className="p-6 space-y-6">
                      {/* Ingredients */}
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <BookOpen className="w-5 h-5 text-primary" />
                          <h4 className="font-semibold text-foreground">Ingredients</h4>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {selectedRecipe.ingredients[selectedLanguage].map((ingredient, index) => (
                            <div
                              key={index}
                              className="flex items-center gap-2 p-2 rounded-lg bg-background/50"
                            >
                              <div className="w-2 h-2 bg-primary rounded-full"></div>
                              <span className="text-sm text-foreground">{ingredient}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Instructions */}
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <ChefHat className="w-5 h-5 text-primary" />
                          <h4 className="font-semibold text-foreground">Instructions</h4>
                        </div>
                        <div className="space-y-3">
                          {selectedRecipe.steps[selectedLanguage].map((step, index) => (
                            <div
                              key={index}
                              className="flex gap-3 p-3 rounded-lg bg-background/50"
                            >
                              <div className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold">
                                {index + 1}
                              </div>
                              <p className="text-sm text-foreground leading-relaxed">{step}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Detailed Nutrition */}
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <Zap className="w-5 h-5 text-primary" />
                          <h4 className="font-semibold text-foreground">Nutritional Profile</h4>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          <div className="text-center p-3 bg-background/50 rounded-xl">
                            <div className="text-sm font-semibold text-primary">
                              {selectedRecipe.nutrition.proteins_g}g
                            </div>
                            <div className="text-xs text-muted-foreground">Proteins</div>
                          </div>
                          <div className="text-center p-3 bg-background/50 rounded-xl">
                            <div className="text-sm font-semibold text-accent">
                              {selectedRecipe.nutrition.fats_g}g
                            </div>
                            <div className="text-xs text-muted-foreground">Fats</div>
                          </div>
                          <div className="text-center p-3 bg-background/50 rounded-xl">
                            <div className="text-sm font-semibold text-secondary">
                              {selectedRecipe.nutrition.moisture_percent}%
                            </div>
                            <div className="text-xs text-muted-foreground">Moisture</div>
                          </div>
                          <div className="text-center p-3 bg-background/50 rounded-xl">
                            <div className="text-sm font-semibold text-primary">
                              {selectedRecipe.nutrition.ash_g}g
                            </div>
                            <div className="text-xs text-muted-foreground">Ash</div>
                          </div>
                        </div>
                      </div>

                      {/* Recipe Rating */}
                      <div className="flex items-center justify-center gap-2 p-4 bg-background/30 rounded-xl">
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={cn(
                                "w-5 h-5",
                                star <= 4 ? "text-yellow-400 fill-current" : "text-muted-foreground"
                              )}
                            />
                          ))}
                        </div>
                        <span className="text-sm text-muted-foreground ml-2">4.2/5</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Empty State */
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="w-24 h-24 bg-gradient-primary rounded-full flex items-center justify-center mb-6">
                <ChefHat className="w-12 h-12 text-primary-foreground" />
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-2">
                Select a Recipe
              </h2>
              <p className="text-muted-foreground max-w-md">
                Choose a recipe from the sidebar to view its details, ingredients, and cooking instructions.
              </p>
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
