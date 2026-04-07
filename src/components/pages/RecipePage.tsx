import { useState, useEffect, useRef } from "react";
import { logger } from '@/lib/logger';
import { useI18n } from "@/hooks/useI18n";
import { ChevronDown, ChevronUp, ChefHat, Clock, Users, Leaf, Zap, BookOpen, Star, Menu, X, Play, Loader2 } from "lucide-react";
import { recipes as staticRecipes } from "@/data/recipes";
import { supabase } from "@/lib/supabaseClient";
import { Analytics } from "@/services/analyticsEventService";
import { APIService } from "@/services/apiService";
import { ImpactService } from "@/services/impactService";
import { cn } from "@/lib/utils";
import { MasonryGallery } from "@/components/ui/MasonryGallery";

type Language = 'en' | 'fr' | 'ar';

// Define types locally or import
interface RecipeTitle {
  fr: string;
  en: string;
  ar: string;
}

interface RecipeIngredients {
  fr: string[];
  en: string[];
  ar: string[];
}

interface RecipeSteps {
  fr: string[];
  en: string[];
  ar: string[];
}

interface RecipeNutrition {
  proteins_g: number;
  fats_g: number;
  ash_g: number;
  moisture_percent: number;
  polyphenols_mg: number;
  flavonoids_mg: number;
  antioxidant_score: string;
}

interface Recipe {
  id: any;
  title: RecipeTitle;
  ingredients: RecipeIngredients;
  steps: RecipeSteps;
  nutrition: RecipeNutrition;
  image_url?: string;
  gallery_images?: string[]; // Phase 6: Multi-image support
}


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
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load favorites on component mount
  useEffect(() => {
    const favorites = APIService.getFavoriteRecipes();
    setFavorites(favorites.map(fav => fav.id));
  }, []);

  // Immediately set recipe from static data when selectedRecipeId is provided
  // This ensures the user sees the recipe instantly (before async Supabase fetch)
  useEffect(() => {
    if (selectedRecipeId) {
      // Always populate recipes from static data first so UI is never empty
      if (recipes.length === 0) {
        setRecipes(staticRecipes as any[]);
      }
      const found = staticRecipes.find((r: any) => r.id === selectedRecipeId);
      if (found) {
        setSelectedRecipe(found as any);
        setExpandedRecipe(found.id);
        logger.debug('Immediately selected recipe from static data:', found.title?.en);
      }
    }
  }, [selectedRecipeId]);

  // Fetch recipes from Supabase (enhances static data if available)
  useEffect(() => {
    const fetchRecipes = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('recipes')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          logger.warn('Supabase fetch failed, using static recipes:', error.message);
          setRecipes(staticRecipes as any[]);
        } else if (data && data.length > 0) {
          logger.debug('Fetched recipes from Supabase:', data.length);
          setRecipes(data);
          // Re-select the recipe from Supabase data if one was selected
          if (selectedRecipeId) {
            const found = data.find((r: any) => r.id === selectedRecipeId);
            if (found) {
              setSelectedRecipe(found);
              setExpandedRecipe(found.id);
            }
          }
        } else {
          // Empty Supabase response — keep static recipes
          logger.debug('No Supabase recipes, using static data');
          setRecipes(staticRecipes as any[]);
        }
      } catch (err) {
        logger.warn('Supabase fetch exception, using static recipes:', err);
        setRecipes(staticRecipes as any[]);
      }
      setIsLoading(false);
    };

    fetchRecipes();
  }, [selectedRecipeId]);


  const toggleRecipe = (recipeId: number) => {
    setExpandedRecipe(expandedRecipe === recipeId ? null : recipeId);
  };

  const getNutritionColor = (score: string) => {
    if (!score) return 'text-muted-foreground';
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

  const getRecipeImage = (recipe: Recipe) => {
    if (recipe.image_url) return recipe.image_url;

    // Convert recipe title to folder format
    const folderName = recipe.title.en
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '-');

    // Use the first image from the gallery folder (1.png)
    return `/images/recipes/${folderName}/1.png`;
  };

  const handleRecipeSelect = (recipe: Recipe) => {
    setSelectedRecipe(recipe);
    setExpandedRecipe(recipe.id);
    setIsSidebarOpen(false);
    // Count as received/viewed recipe
    APIService.saveRecipeView(recipe.id);
    Analytics.trackRecipeView(recipe.id);
  };

  const handleUseRecipe = (recipe: Recipe) => {
    logger.debug('Using recipe:', recipe.title.en);

    setIsSidebarOpen(false);

    // Count as received/viewed recipe
    APIService.saveRecipeView(recipe.id);

    // Extract leaf types from the recipe ingredients
    const leafTypes = extractLeafTypesFromRecipe(recipe);
    logger.debug('Extracted leaf types from recipe:', leafTypes);

    // Get impact before adding new leaves
    const impactBefore = ImpactService.getCumulativeImpact();
    logger.debug('Impact before recipe usage:', impactBefore);

    // Add the detected leaves to trigger impact calculation
    if (leafTypes.length > 0) {
      handleLeafDetection(leafTypes);

      // Immediate validation: check impact after adding leaves
      setTimeout(() => {
        const impactAfter = ImpactService.getCumulativeImpact();
        logger.debug('Impact after recipe usage:', impactAfter);

        // Verify the impact has changed
        if (impactAfter.amount_g > impactBefore.amount_g) {
          logger.debug(`✅ Impact calculations updated successfully! Added ${impactAfter.amount_g - impactBefore.amount_g}g of leaves`);
          logger.debug(`💰 Money saved: ${impactAfter.price_saved_MAD.toFixed(2)} MAD (+${(impactAfter.price_saved_MAD - impactBefore.price_saved_MAD).toFixed(2)})`);
          logger.debug(`🌱 CO2 avoided: ${impactAfter.co2e_kg_avoided.toFixed(2)} kg (+${(impactAfter.co2e_kg_avoided - impactBefore.co2e_kg_avoided).toFixed(2)})`);
        } else {
          logger.warn('⚠️  Impact calculations may not have updated properly');
        }
      }, 100); // Small delay to ensure localStorage is updated

      logger.debug('Impact calculations triggered for recipe usage');
    }

    // Provide user feedback
    logger.debug(`✨ Recipe "${recipe.title.en}" used successfully! Impact calculations updated.`);
  };

  const handleLeafDetection = (leafTypes: string[]) => {
    logger.debug('Processing leaf detection for recipe usage:', leafTypes);

    // Add each leaf type to detected leaves using exact class names
    leafTypes.forEach(leafType => {
      // Save detected leaves data - create a mock detection result with exact class name
      const mockDetection = {
        class: leafType, // Use exact class name (e.g., 'Onion Leaves')
        confidence: 1,
        x: 0,
        y: 0,
        width: 100,
        height: 100,
        detection_id: `recipe-${Date.now()}-${leafType.toLowerCase().replace(/\s+/g, '-')}`
      };

      logger.debug('Saving detected leaf for recipe usage:', mockDetection);
      APIService.saveDetectedLeaves([mockDetection]);
    });

    // Increment scans for each leaf type used
    for (let i = 0; i < leafTypes.length; i++) {
      APIService.incrementScans();
    }

    logger.debug(`Added ${leafTypes.length} leaf types to impact calculations from recipe usage`);
  };

  // Handle favorite toggle with state update
  const handleToggleFavorite = (recipeId: number) => {
    const newFavorited = APIService.toggleFavoriteRecipe(recipeId);

    // Update local state
    if (newFavorited) {
      setFavorites(prev => [...prev, recipeId]);
    } else {
      setFavorites(prev => prev.filter(id => id !== recipeId));
    }
  };

  // Extract leaf types from recipe ingredients
  const extractLeafTypesFromRecipe = (recipe: Recipe): string[] => {
    // Safety check if ingredients or en array is missing
    if (!recipe.ingredients || !recipe.ingredients.en) return [];

    const ingredients = recipe.ingredients.en.join(' ').toLowerCase();
    const leafTypes: string[] = [];

    // Define leaf type keywords and their mappings to exact class names
    const leafKeywords = {
      'onion': 'Onion Leaves',
      'onion leaves': 'Onion Leaves',
      'garlic': 'Garlic Leaves',
      'garlic leaves': 'Garlic Leaves',
      'leek': 'Leek Leaves',
      'leek leaves': 'Leek Leaves',
      'chive': 'Chive Leaves',
      'chives': 'Chive Leaves',
      'scallion': 'Scallion Leaves',
      'scallion leaves': 'Scallion Leaves',
      'shallot': 'Shallot Leaves',
      'shallot leaves': 'Shallot Leaves',
      'wild garlic': 'Garlic Leaves',
      'ramp': 'Onion Leaves', // Map to closest equivalent
      'green onion': 'Onion Leaves',
      'spring onion': 'Onion Leaves',
      'carrot': 'Onion Leaves', // Map carrot tops to closest equivalent
      'carrot leaves': 'Onion Leaves',
      'beet': 'Onion Leaves', // Map beet greens to closest equivalent
      'beet leaves': 'Onion Leaves',
      'radish': 'Onion Leaves', // Map radish greens to closest equivalent
      'radish leaves': 'Onion Leaves',
      'turnip': 'Onion Leaves', // Map turnip greens to closest equivalent
      'turnip leaves': 'Onion Leaves',
      'parsley': 'Onion Leaves', // Map herbs to closest equivalent
      'cilantro': 'Onion Leaves',
      'mint': 'Onion Leaves',
      'basil': 'Onion Leaves',
      'thyme': 'Onion Leaves',
      'oregano': 'Onion Leaves',
      'sage': 'Onion Leaves'
    };

    // Check for each leaf type in ingredients
    Object.entries(leafKeywords).forEach(([keyword, leafClassName]) => {
      if (ingredients.includes(keyword)) {
        if (!leafTypes.includes(leafClassName)) {
          leafTypes.push(leafClassName);
        }
      }
    });

    // If no specific leaves found, add a default "Onion Leaves" (since most recipes use onion leaves)
    if (leafTypes.length === 0) {
      leafTypes.push('Onion Leaves');
    }

    return leafTypes;
  };

  return (
    <div className="h-screen flex overflow-hidden">
      {/* Sidebar */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-40 w-full sm:w-80 bg-background/95 backdrop-blur-xl border-r border-border flex flex-col transform transition-transform duration-300 ease-in-out",
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

        {/* Recipe List - Responsive Grid */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-2 gap-3">
            {recipes.map((recipe) => (
              <button
                key={recipe.id}
                onClick={() => handleRecipeSelect(recipe)}
                className={cn(
                  "w-full rounded-2xl text-left transition-all duration-300 hover:shadow-lg hover:shadow-primary/10 relative border backdrop-blur-sm overflow-hidden flex flex-col h-full",
                  selectedRecipe?.id === recipe.id
                    ? "glass bg-primary/10 border-primary/30 shadow-lg shadow-primary/20"
                    : "glass hover:bg-primary/5 border-primary/10 hover:border-primary/20"
                )}
              >
                {/* Favorite Star Indicator */}
                <div className="absolute top-2 right-2 z-10">
                  {favorites.includes(recipe.id) && (
                    <Star className="w-4 h-4 text-yellow-400 fill-current drop-shadow-sm" />
                  )}
                </div>

                <div className="w-full aspect-[4/3] relative bg-gradient-organic">
                  <img
                    src={getRecipeImage(recipe)}
                    alt={recipe.title.en}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      target.nextElementSibling?.classList.remove('hidden');
                    }}
                  />
                  <ChefHat className="w-8 h-8 text-primary hidden absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
                </div>

                <div className="p-3 flex-1 flex flex-col">
                  <h3 className="font-semibold text-foreground text-sm line-clamp-2 leading-tight">
                    {recipe.title[selectedLanguage]}
                  </h3>
                  <div className="mt-auto pt-2">
                    <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <Users className="w-3 h-3" /> {recipe.ingredients[selectedLanguage].length} ingredients
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
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
                    {/* Recipe Image - Square aspect ratio */}
                    <div className="aspect-square rounded-3xl overflow-hidden bg-gradient-organic max-w-md mx-auto">
                      <img
                        src={getRecipeImage(selectedRecipe)}
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

                        {/* Recipe Gallery - Pinterest-style Masonry */}
                        <div className="mt-8">
                          <MasonryGallery
                            recipeId={selectedRecipe.id}
                            recipeTitle={selectedRecipe.title.en}
                            galleryImages={selectedRecipe.gallery_images}
                            className=""
                          />
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
            /* Favorite Recipes Ranking */
            <div className="space-y-6">
              {/* Header */}
              <div className="text-center mb-8">
                <div className="flex items-center justify-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-gradient-primary rounded-full flex items-center justify-center">
                    <Star className="w-6 h-6 text-primary-foreground" />
                  </div>
                </div>
                <h1 className="text-3xl font-bold text-foreground mb-2">
                  Favorite Recipes
                </h1>
                <p className="text-muted-foreground max-w-md mx-auto">
                  Your top-rated recipes based on usage and favorites
                </p>
              </div>

              {/* Favorite Recipes List */}
              <div className="max-w-4xl mx-auto">
                {(() => {
                  // Get favorite recipes and sort by usage
                  const favoriteRecipeIds = favorites;
                  const recipeViews = APIService.getRecipeViews();

                  // Create ranking based on favorites + view count
                  const recipeRanking = recipes
                    .map(recipe => {
                      const isFavorite = favoriteRecipeIds.includes(recipe.id);
                      const viewCount = recipeViews.filter(view => view.id === recipe.id).length;
                      const score = (isFavorite ? 100 : 0) + viewCount;
                      return { recipe, score, viewCount, isFavorite };
                    })
                    .filter(item => item.score > 0) // Only show recipes with some interaction
                    .sort((a, b) => b.score - a.score)
                    .slice(0, 6); // Top 6 recipes

                  if (recipeRanking.length === 0) {
                    return (
                      <div className="text-center py-12">
                        <ChefHat className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-foreground mb-2">No favorites yet</h3>
                        <p className="text-muted-foreground">Select recipes from the sidebar and mark them as favorites to see your ranking here.</p>
                      </div>
                    );
                  }

                  return (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {recipeRanking.map((item, index) => (
                        <button
                          key={item.recipe.id}
                          onClick={() => handleRecipeSelect(item.recipe)}
                          className="glass rounded-2xl p-4 text-left transition-all duration-300 hover:shadow-lg hover:scale-105 relative"
                        >
                          {/* Ranking Badge */}
                          <div className="absolute top-3 left-3 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">
                            {index + 1}
                          </div>

                          {/* Favorite Star */}
                          {item.isFavorite && (
                            <div className="absolute top-3 right-3">
                              <Star className="w-5 h-5 text-yellow-400 fill-current" />
                            </div>
                          )}

                          <div className="flex items-center gap-4 mt-6">
                            <div className="w-16 h-16 rounded-xl overflow-hidden bg-gradient-organic flex items-center justify-center">
                              <img
                                src={getRecipeImage(item.recipe)}
                                alt={item.recipe.title.en}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = 'none';
                                  target.nextElementSibling?.classList.remove('hidden');
                                }}
                              />
                              <ChefHat className="w-8 h-8 text-primary hidden" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-foreground text-base line-clamp-2 mb-1">
                                {item.recipe.title[selectedLanguage]}
                              </h3>
                              <div className="flex items-center gap-3 text-xs text-muted-foreground mb-2">
                                <span className={getNutritionColor(item.recipe.nutrition.antioxidant_score)}>
                                  {item.recipe.nutrition.antioxidant_score}
                                </span>
                                <span>•</span>
                                <span>{item.viewCount} views</span>
                              </div>
                              <div className="grid grid-cols-3 gap-2 text-xs">
                                <div className="text-center p-2 bg-background/50 rounded-lg">
                                  <div className="font-semibold text-primary">{item.recipe.nutrition.proteins_g}g</div>
                                  <div className="text-muted-foreground">Proteins</div>
                                </div>
                                <div className="text-center p-2 bg-background/50 rounded-lg">
                                  <div className="font-semibold text-accent">{item.recipe.nutrition.polyphenols_mg}mg</div>
                                  <div className="text-muted-foreground">Polyphenols</div>
                                </div>
                                <div className="text-center p-2 bg-background/50 rounded-lg">
                                  <div className="font-semibold text-secondary">{item.recipe.nutrition.flavonoids_mg}mg</div>
                                  <div className="text-muted-foreground">Flavonoids</div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  );
                })()
                }

                {/* Call to Action */}
                <div className="text-center mt-8 p-6 glass rounded-2xl">
                  <p className="text-muted-foreground mb-4">
                    Discover more recipes in the sidebar or try the "Use Recipe" feature to track your cooking impact!
                  </p>
                  <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4" />
                      <span>Mark favorites</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Play className="w-4 h-4" />
                      <span>Use recipes</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <ChefHat className="w-4 h-4" />
                      <span>Track impact</span>
                    </div>
                  </div>
                </div>
              </div>
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
