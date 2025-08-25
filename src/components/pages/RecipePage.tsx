import { useState, useEffect } from "react";
import { useI18n } from "@/hooks/useI18n";
import { ChevronDown, ChevronUp, ChefHat, Clock, Users, Leaf, Zap, BookOpen, Star, Menu, X, Play } from "lucide-react";
import { recipes, Recipe } from "@/data/recipes";
import { StorageService } from "@/services/apiService";
import { cn } from "@/lib/utils";

type Language = 'en' | 'fr' | 'ar';

interface RecipePageProps {
  selectedRecipeId?: number | null;
}

export default function RecipePage({ selectedRecipeId }: RecipePageProps) {
  const { t } = useI18n();
  const [selectedLanguage, setSelectedLanguage] = useState<Language>('en');
  const [expandedRecipe, setExpandedRecipe] = useState<number | null>(null);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [favorites, setFavorites] = useState<number[]>([]);

  // Load favorites on component mount
  useEffect(() => {
    setFavorites(StorageService.getFavoriteRecipes());
  }, []);

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
    // Count as received/viewed recipe
    StorageService.markRecipeReceived(recipe.id);
  };

  // Extract leaf ingredients from recipe and add to detected leaves
  const handleUseRecipe = (recipe: Recipe) => {
    // Extract leaf types from recipe ingredients
    const leafTypes = extractLeafTypesFromRecipe(recipe);
    
    // Add each leaf type to detected leaves
    leafTypes.forEach(leafType => {
      StorageService.addDetectedLeaf(leafType);
    });
    
    // Increment scans for each leaf type used
    for (let i = 0; i < leafTypes.length; i++) {
      StorageService.incrementScans();
    }
    
    // Show success message
    alert(`Recipe used! Added ${leafTypes.length} leaf types to your impact calculations.`);
  };

  // Handle favorite toggle with state update
  const handleToggleFavorite = (recipeId: number) => {
    const newFavorited = StorageService.toggleFavoriteRecipe(recipeId);
    
    // Update local state
    if (newFavorited) {
      setFavorites(prev => [...prev, recipeId]);
    } else {
      setFavorites(prev => prev.filter(id => id !== recipeId));
    }
  };

  // Extract leaf types from recipe ingredients
  const extractLeafTypesFromRecipe = (recipe: Recipe): string[] => {
    const ingredients = recipe.ingredients.en.join(' ').toLowerCase();
    const leafTypes: string[] = [];
    
    // Define leaf type keywords and their mappings
    const leafKeywords = {
      'onion': 'onion',
      'garlic': 'garlic', 
      'leek': 'leek',
      'chive': 'chive',
      'scallion': 'scallion',
      'shallot': 'shallot',
      'wild garlic': 'wild garlic',
      'ramp': 'ramp',
      'green onion': 'green onion',
      'carrot': 'carrot',
      'beet': 'beet',
      'radish': 'radish',
      'turnip': 'turnip',
      'parsley': 'parsley',
      'cilantro': 'cilantro',
      'mint': 'mint',
      'basil': 'basil',
      'thyme': 'thyme',
      'oregano': 'oregano',
      'sage': 'sage'
    };
    
    // Check for each leaf type in ingredients
    Object.entries(leafKeywords).forEach(([keyword, leafType]) => {
      if (ingredients.includes(keyword)) {
        leafTypes.push(leafType);
      }
    });
    
    // If no specific leaves found, add a generic "onion" (since most recipes use onion leaves)
    if (leafTypes.length === 0) {
      leafTypes.push('onion');
    }
    
    return leafTypes;
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
    <div className="h-screen flex overflow-hidden">
      {/* Sidebar */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-40 w-80 bg-background/95 backdrop-blur-xl border-r border-border flex flex-col transform transition-transform duration-300 ease-in-out",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full",
        "lg:translate-x-0 lg:border-r lg:border-border"
      )}>
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-foreground">{t('recipes.title')}</h2>
            </div>
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="lg:hidden p-2 rounded-lg hover:bg-muted/50 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            {t('recipes.selectHint')}
          </p>
        </div>

        {/* Recipe List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {recipes.map((recipe) => (
            <button
              key={recipe.id}
              onClick={() => handleRecipeSelect(recipe)}
              className={cn(
                "w-full p-4 rounded-2xl text-left transition-all duration-300 hover:shadow-lg relative",
                selectedRecipe?.id === recipe.id
                  ? "glass bg-primary/10 border border-primary/20"
                  : "glass hover:bg-muted/30"
              )}
            >
              {/* Favorite Star Indicator */}
              <div className="absolute top-2 right-2">
                {favorites.includes(recipe.id) && (
                  <Star className="w-4 h-4 text-yellow-400 fill-current" />
                )}
              </div>
              
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
                    {recipe.nutrition.antioxidant_score} • {recipe.ingredients[selectedLanguage].length} {t('recipes.ingredientsCount')}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:pl-80">
        {/* Mobile Header */}
        <div className="p-4 border-b border-border sticky top-12 z-20 bg-background/95 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 rounded-lg hover:bg-muted/50 transition-colors"
            >
              <Menu className="w-6 h-6" />
            </button>
            <h1 className="text-lg font-bold text-foreground">{t('recipes.title')}</h1>
            <div className="w-10"></div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 p-4 lg:p-6 overflow-y-auto">
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
                  {t('recipes.traditionalSubtitle')}
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
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {lang.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              {/* Recipe Content */}
              <div className="max-w-4xl mx-auto">
                {expandedRecipe === selectedRecipe.id ? (
                  <div className="space-y-6">
                    {/* Recipe Image */}
                    <div className="aspect-video rounded-3xl overflow-hidden bg-gradient-organic">
                      <img
                        src={getRecipeImage(selectedRecipe.title.en)}
                        alt={selectedRecipe.title.en}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          target.nextElementSibling?.classList.remove('hidden');
                        }}
                      />
                      <div className="w-full h-full flex items-center justify-center hidden">
                        <ChefHat className="w-24 h-24 text-primary/50" />
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
                          <div className="text-center p-3 bg-background/50 rounded-xl">
                            <div className="text-lg font-bold text-primary">
                              {selectedRecipe.nutrition.proteins_g}g
                            </div>
                            <div className="text-xs text-muted-foreground">{t('recipes.card.proteins')}</div>
                          </div>
                          <div className="text-center p-3 bg-background/50 rounded-xl">
                            <div className="text-lg font-bold text-accent">
                              {selectedRecipe.nutrition.polyphenols_mg}mg
                            </div>
                            <div className="text-xs text-muted-foreground">{t('recipes.card.polyphenols')}</div>
                          </div>
                          <div className="text-center p-3 bg-background/50 rounded-xl">
                            <div className="text-lg font-bold text-secondary">
                              {selectedRecipe.nutrition.flavonoids_mg}mg
                            </div>
                            <div className="text-xs text-muted-foreground">{t('recipes.card.flavonoids')}</div>
                          </div>
                        </div>
                      </div>

                      {/* Recipe Content */}
                      <div className="p-6 space-y-6">
                        {/* Ingredients */}
                        <div>
                          <div className="flex items-center gap-2 mb-3">
                            <BookOpen className="w-5 h-5 text-primary" />
                            <h4 className="font-semibold text-foreground">{t('recipes.ingredients')}</h4>
                          </div>
                          <div className="space-y-2">
                            {selectedRecipe.ingredients[selectedLanguage].map((ingredient, index) => (
                              <div
                                key={index}
                                className="flex gap-3 p-3 rounded-lg bg-background/50"
                              >
                                <div className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold">
                                  {index + 1}
                                </div>
                                <p className="text-sm text-foreground leading-relaxed">{ingredient}</p>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Instructions */}
                        <div>
                          <div className="flex items-center gap-2 mb-3">
                            <ChefHat className="w-5 h-5 text-primary" />
                            <h4 className="font-semibold text-foreground">{t('recipes.instructions')}</h4>
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
                            <h4 className="font-semibold text-foreground">{t('recipes.nutritionalProfile')}</h4>
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            <div className="text-center p-3 bg-background/50 rounded-xl">
                              <div className="text-sm font-semibold text-primary">
                                {selectedRecipe.nutrition.proteins_g}g
                              </div>
                              <div className="text-xs text-muted-foreground">{t('recipes.card.proteins')}</div>
                            </div>
                            <div className="text-center p-3 bg-background/50 rounded-xl">
                              <div className="text-sm font-semibold text-accent">
                                {selectedRecipe.nutrition.fats_g}g
                              </div>
                              <div className="text-xs text-muted-foreground">{t('recipes.nutrition.fats')}</div>
                            </div>
                            <div className="text-center p-3 bg-background/50 rounded-xl">
                              <div className="text-sm font-semibold text-secondary">
                                {selectedRecipe.nutrition.moisture_percent}%
                              </div>
                              <div className="text-xs text-muted-foreground">{t('recipes.nutrition.moisture')}</div>
                            </div>
                            <div className="text-center p-3 bg-background/50 rounded-xl">
                              <div className="text-sm font-semibold text-primary">
                                {selectedRecipe.nutrition.ash_g}g
                              </div>
                              <div className="text-xs text-muted-foreground">{t('recipes.nutrition.ash')}</div>
                            </div>
                          </div>
                        </div>

                        {/* Recipe Actions */}
                        <div className="flex items-center justify-center gap-3 p-4 bg-background/30 rounded-xl">
                          <button
                            onClick={() => handleUseRecipe(selectedRecipe)}
                            className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                            aria-label="Use Recipe"
                          >
                            <Play className="w-4 h-4" />
                            <span className="text-sm font-medium">{t('recipes.useRecipe')}</span>
                          </button>
                          
                          <button
                            onClick={() => handleToggleFavorite(selectedRecipe.id)}
                            className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-muted/60 transition-colors border border-muted"
                            aria-label="Toggle Favorite"
                          >
                            <Star
                              className={cn(
                                "w-5 h-5",
                                favorites.includes(selectedRecipe.id)
                                  ? "text-yellow-400 fill-current"
                                  : "text-muted-foreground"
                              )}
                            />
                            <span className="text-sm text-muted-foreground">
                              {favorites.includes(selectedRecipe.id) ? t('recipes.favorited') : t('recipes.addToFavorites')}
                            </span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center">
                    <button
                      onClick={() => toggleRecipe(selectedRecipe.id)}
                      className="px-6 py-3 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-colors"
                    >
                      {t('recipes.viewFull')}
                    </button>
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
                {t('recipes.selectRecipe')}
              </h2>
              <p className="text-muted-foreground max-w-md">
                {t('recipes.emptyHint')}
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
