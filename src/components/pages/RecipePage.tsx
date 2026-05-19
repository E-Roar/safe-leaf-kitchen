import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { logger } from '@/lib/logger';
import { useI18n } from "@/hooks/useI18n";
import { Search, ChefHat, Star, BookOpen, Play, Loader2, ArrowLeft, Upload, Trash2, X, Image as ImageIcon } from "lucide-react";
import { recipes as staticRecipes } from "@/data/recipes";
import { supabase } from "@/lib/supabaseClient";
import { Analytics } from "@/services/analyticsEventService";
import { APIService } from "@/services/apiService";
import { UserStatsService } from "@/services/userStatsService";
import { useAuth } from "@/contexts/AuthContext";

import { cn } from "@/lib/utils";

type Language = 'en' | 'fr' | 'ar';

interface RecipeTitle { fr: string; en: string; ar: string; }
interface RecipeIngredients { fr: string[]; en: string[]; ar: string[]; }
interface RecipeSteps { fr: string[]; en: string[]; ar: string[]; }
interface RecipeNutrition {
  proteins_g: number; fats_g: number; ash_g: number;
  moisture_percent: number; polyphenols_mg: number;
  flavonoids_mg: number; antioxidant_score: string;
}

interface Recipe {
  id: any;
  title: RecipeTitle;
  ingredients: RecipeIngredients;
  steps: RecipeSteps;
  nutrition: RecipeNutrition;
  image_url?: string;
  gallery_images?: string[];
  origin?: string;
  sources?: string[];
  published?: boolean;
}

// Species emoji map for visual cards
const SPECIES_EMOJI: Record<string, string> = {
  'onion': '🧅', 'oignon': '🧅',
  'beetroot': '🥬', 'betterave': '🥬',
  'radish': '🌱', 'radis': '🌱',
  'fennel': '🌿', 'fenouil': '🌿',
  'turnip': '🥕', 'navet': '🥕',
  'carrot': '🥕', 'carotte': '🥕',
  'artichoke': '🌺', 'artichaut': '🌺',
  'kohlrabi': '🥦', 'chou-rave': '🥦',
  'leek': '🧅', 'poireau': '🧅',
};

function getSpeciesCategory(recipe: Recipe): string {
  const title = (recipe.title?.en || recipe.title?.fr || '').toLowerCase();
  const cats = ['onion','beetroot','radish','fennel','turnip','carrot','artichoke','kohlrabi','leek'];
  for (const c of cats) { if (title.includes(c)) return c; }
  // Try French
  const frCats: Record<string,string> = {'oignon':'onion','betterave':'beetroot','radis':'radish','fenouil':'fennel','navet':'turnip','carotte':'carrot','artichaut':'artichoke','chou-rave':'kohlrabi','poireau':'leek'};
  for (const [fr, en] of Object.entries(frCats)) { if (title.includes(fr)) return en; }
  return 'other';
}



export default function RecipePage() {
  const [searchParams] = useSearchParams();
  const selectedRecipeId = searchParams.get('recipeId') ? Number(searchParams.get('recipeId')) : null;
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useI18n();
  const [selectedLanguage, setSelectedLanguage] = useState<Language>('fr');
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [favorites, setFavorites] = useState<any[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [speciesFilter, setSpeciesFilter] = useState<string>('all');
  const [uploadingGallery, setUploadingGallery] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  // Load favorites
  useEffect(() => {
    const favs = APIService.getFavoriteRecipes();
    setFavorites(favs.map(fav => fav.id));
  }, []);

  // Immediately set recipe from static data when selectedRecipeId is provided
  useEffect(() => {
    if (selectedRecipeId) {
      if (recipes.length === 0) setRecipes(staticRecipes as any[]);
      const found = staticRecipes.find((r: any) => r.id === selectedRecipeId);
      if (found) {
        setSelectedRecipe(found as any);
        logger.debug('Immediately selected recipe from static data:', found.title?.en);
      }
    } else {
      setSelectedRecipe(null);
    }
  }, [selectedRecipeId]);

  // Fetch recipes from Supabase
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
          if (selectedRecipeId) {
            const found = data.find((r: any) => r.id === selectedRecipeId);
            if (found) setSelectedRecipe(found);
          }
        } else {
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

  // ── Helpers ──
  const handleRecipeSelect = (recipe: Recipe) => {
    setSelectedRecipe(recipe);
    APIService.saveRecipeView(recipe.id);
    Analytics.trackRecipeView(recipe.id);
  };

  const handleUseRecipe = (recipe: Recipe) => {
    logger.debug('Using recipe:', recipe.title.en);
    APIService.saveRecipeView(recipe.id);
    const leafTypes = extractLeafTypesFromRecipe(recipe);
    if (leafTypes.length > 0) {
      leafTypes.forEach(leafType => {
        APIService.saveDetectedLeaves([{
          class: leafType, confidence: 1, x: 0, y: 0, width: 100, height: 100
        }]);
      });
      leafTypes.forEach(() => APIService.incrementScans());
    }
    UserStatsService.recordRecipeUse(user?.id || null, recipe.id, leafTypes);
  };

  const handleToggleFavorite = (recipeId: any) => {
    const newFavorited = APIService.toggleFavoriteRecipe(recipeId);
    if (newFavorited) {
      setFavorites(prev => [...prev, recipeId]);
    } else {
      setFavorites(prev => prev.filter(id => id !== recipeId));
    }
  };

  const extractLeafTypesFromRecipe = (recipe: Recipe): string[] => {
    if (!recipe.ingredients?.en) return ['Onion Leaves'];
    const ingredients = recipe.ingredients.en.join(' ').toLowerCase();
    const leafKeywords: Record<string, string> = {
      'onion': 'Onion Leaves', 'garlic': 'Garlic Leaves', 'leek': 'Leek Leaves',
      'chive': 'Chive Leaves', 'scallion': 'Scallion Leaves',
    };
    const leafTypes: string[] = [];
    for (const [kw, cls] of Object.entries(leafKeywords)) {
      if (ingredients.includes(kw) && !leafTypes.includes(cls)) leafTypes.push(cls);
    }
    return leafTypes.length > 0 ? leafTypes : ['Onion Leaves'];
  };

  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length || !selectedRecipe) return;
    setUploadingGallery(true);
    const newUrls: string[] = [];
    try {
      for (let i = 0; i < e.target.files.length; i++) {
        const file = e.target.files[i];
        const fileExt = file.name.split('.').pop();
        const fileName = `recipe-gallery-${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `recipes/${fileName}`;
        const { error: uploadError } = await supabase.storage.from('content').upload(filePath, file);
        if (uploadError) throw uploadError;
        const { data: { publicUrl } } = supabase.storage.from('content').getPublicUrl(filePath);
        newUrls.push(publicUrl);
      }
      const updated = { ...selectedRecipe, gallery_images: [...(selectedRecipe.gallery_images || []), ...newUrls] };
      setSelectedRecipe(updated);
      setRecipes(prev => prev.map(r => r.id === selectedRecipe.id ? updated : r));
    } catch (err) {
      console.error('Gallery upload failed:', err);
    } finally {
      setUploadingGallery(false);
    }
  };

  const handleDeleteGalleryImage = async (index: number) => {
    if (!selectedRecipe?.gallery_images) return;
    const updated = {
      ...selectedRecipe,
      gallery_images: selectedRecipe.gallery_images.filter((_, i) => i !== index)
    };
    setSelectedRecipe(updated);
    setRecipes(prev => prev.map(r => r.id === selectedRecipe.id ? updated : r));
  };

  const getRecipeImage = (recipe: Recipe) => {
    if (recipe.image_url) return recipe.image_url;
    const folderName = (recipe.title?.en || '')
      .toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, '-');
    return `/images/recipes/${folderName}/1.png`;
  };

  const getNutritionColor = (score: string) => {
    if (!score) return 'text-muted-foreground';
    const s = score.toLowerCase();
    if (s.includes('très') || s === 'very high') return 'text-emerald-400';
    if (s.includes('élevé') || s === 'high') return 'text-green-400';
    if (s.includes('modéré') || s === 'moderate') return 'text-yellow-400';
    return 'text-muted-foreground';
  };

  const filteredRecipes = recipes.filter(r => {
    if (r.published === false) return false;
    if (speciesFilter !== 'all' && getSpeciesCategory(r) !== speciesFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const title = (r.title?.[selectedLanguage] || r.title?.fr || '').toLowerCase();
      const steps = (r.steps?.[selectedLanguage]?.[0] || r.steps?.fr?.[0] || '').toLowerCase();
      if (!title.includes(q) && !steps.includes(q)) return false;
    }
    return true;
  });

  const speciesOptions = ['all','onion','beetroot','radish','fennel','turnip','carrot','artichoke','kohlrabi','leek'];

  // ── Detail Modal ──
  if (selectedRecipe) {
    return (
      <div>
        <div className="max-w-4xl mx-auto px-4 md:px-8 py-6">
          {/* Back button */}
          <button onClick={() => navigate('/recipes')} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to recipes
          </button>

          {/* Hero */}
          <div className="grid lg:grid-cols-2 gap-6 mb-8">
              <div className="rounded-2xl overflow-hidden border border-border h-64 md:h-80 relative group">
                <img src={getRecipeImage(selectedRecipe)} alt={selectedRecipe.title?.en}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
              {selectedRecipe.origin === 'survey' && (
                <span className="absolute top-4 left-4 bg-primary/90 text-primary-foreground text-xs font-semibold px-2.5 py-1 rounded-lg">Community</span>
              )}
            </div>

            <div className="flex flex-col justify-center">
              {/* Language Selector */}
              <div className="flex gap-1 mb-4">
                {(['fr', 'en', 'ar'] as Language[]).map(lang => (
                  <button key={lang} onClick={() => setSelectedLanguage(lang)}
                    className={cn("px-3 py-1 rounded-lg text-xs font-semibold transition-all",
                      selectedLanguage === lang ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                    )}>{lang.toUpperCase()}</button>
                ))}
              </div>

              <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
                {selectedRecipe.title?.[selectedLanguage] || selectedRecipe.title?.fr}
              </h1>
              {selectedRecipe.sources?.[0] && (
                <p className="text-sm text-muted-foreground mb-4">
                  {selectedRecipe.sources[0]}
                </p>
              )}

              <div className="flex gap-2 mb-5">
                <button onClick={() => handleUseRecipe(selectedRecipe)} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-green-500 text-white hover:bg-green-600 transition-all">
                  <Play className="w-4 h-4" /> {t('recipes.useRecipe') || 'Use Recipe'}
                </button>
                <button onClick={() => handleToggleFavorite(selectedRecipe.id)} className={cn("flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border transition-all",
                  favorites.includes(selectedRecipe.id) ? "bg-yellow-50 border-yellow-200 text-yellow-600 dark:bg-yellow-950/30 dark:border-yellow-900" : "bg-background border-border hover:bg-muted"
                )}>
                  <Star className={cn("w-4 h-4", favorites.includes(selectedRecipe.id) && "fill-current")} />
                  {favorites.includes(selectedRecipe.id) ? 'Favorited' : 'Favorite'}
                </button>
              </div>

              {/* Nutrition Quick View */}
              {selectedRecipe.nutrition?.proteins_g > 0 && (
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="text-center p-2 bg-background/50 rounded-lg border border-border">
                    <div className="font-bold text-primary">{selectedRecipe.nutrition.proteins_g}g</div>
                    <div className="text-muted-foreground">Proteins</div>
                  </div>
                  <div className="text-center p-2 bg-background/50 rounded-lg border border-border">
                    <div className="font-bold text-accent">{selectedRecipe.nutrition.polyphenols_mg}mg</div>
                    <div className="text-muted-foreground">Polyphenols</div>
                  </div>
                  <div className="text-center p-2 bg-background/50 rounded-lg border border-border">
                    <div className={cn("font-bold", getNutritionColor(selectedRecipe.nutrition.antioxidant_score))}>
                      {selectedRecipe.nutrition.antioxidant_score}
                    </div>
                    <div className="text-muted-foreground">Antioxidants</div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Ingredients & Steps */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-background border border-border rounded-2xl p-6">
              <h3 className="font-semibold flex items-center gap-2 mb-4"><BookOpen className="w-5 h-5 text-primary" /> {t('recipes.ingredients') || 'Ingredients'}</h3>
              <div className="space-y-2">
                {selectedRecipe.ingredients?.[selectedLanguage]?.map((ing, i) => (
                  <div key={i} className="flex gap-3 p-2 rounded-lg bg-muted/30">
                    <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold shrink-0">{i + 1}</div>
                    <p className="text-sm">{ing}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-background border border-border rounded-2xl p-6">
              <h3 className="font-semibold flex items-center gap-2 mb-4"><ChefHat className="w-5 h-5 text-primary" /> {t('recipes.instructions') || 'Preparation'}</h3>
              <div className="space-y-3">
                {selectedRecipe.steps?.[selectedLanguage]?.map((step, i) => (
                  <div key={i} className="flex gap-3 p-2 rounded-lg bg-muted/30">
                    <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold shrink-0">{i + 1}</div>
                    <p className="text-sm leading-relaxed">{step}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Gallery */}
          {(selectedRecipe.gallery_images?.length ?? 0) > 0 || user ? (
            <div className="max-w-4xl mx-auto px-4 md:px-8 mt-8">
              <h3 className="font-semibold flex items-center gap-2 mb-4">
                <ImageIcon className="w-5 h-5 text-primary" /> Gallery
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {selectedRecipe.gallery_images?.map((url, idx) => (
                  <div key={idx} className="relative group rounded-xl overflow-hidden border border-border aspect-square">
                    <img
                      src={url}
                      alt={`Gallery ${idx + 1}`}
                      className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform duration-300"
                      onClick={() => setLightboxIndex(idx)}
                    />
                    {user && (
                      <button
                        onClick={() => handleDeleteGalleryImage(idx)}
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
                {user && (
                  <label className="cursor-pointer bg-muted/50 hover:bg-muted border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center aspect-square text-muted-foreground hover:text-foreground transition-colors">
                    <Upload className="w-6 h-6 mb-2" />
                    <span className="text-xs font-medium">{uploadingGallery ? 'Uploading...' : 'Add Photo'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      disabled={uploadingGallery}
                      onChange={handleGalleryUpload}
                    />
                  </label>
                )}
              </div>
            </div>
          ) : null}

          {/* Lightbox */}
          {lightboxIndex !== null && selectedRecipe.gallery_images?.[lightboxIndex] && (
            <div
              className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
              onClick={() => setLightboxIndex(null)}
            >
              <button
                onClick={() => setLightboxIndex(null)}
                className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors"
              >
                <X className="w-8 h-8" />
              </button>
              <img
                src={selectedRecipe.gallery_images[lightboxIndex]}
                alt="Gallery full size"
                className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg"
                onClick={(e) => e.stopPropagation()}
              />
              {selectedRecipe.gallery_images.length > 1 && (
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
                  {selectedRecipe.gallery_images.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={(e) => { e.stopPropagation(); setLightboxIndex(idx); }}
                      className={`w-2.5 h-2.5 rounded-full transition-all ${idx === lightboxIndex ? 'bg-white scale-125' : 'bg-white/40 hover:bg-white/70'}`}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="px-3 md:px-6 pt-6 pb-4">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-5">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-1">{t('recipes.title') || 'Recipes'}</h1>
            <p className="text-sm text-muted-foreground">
              {filteredRecipes.length} recipes
            </p>
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search recipes..."
              className="w-full bg-background border border-border rounded-xl py-2.5 pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all" />
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5 mb-6 overflow-x-auto scrollbar-none pb-1">
          {speciesOptions.map(sp => (
            <button key={sp} onClick={() => setSpeciesFilter(sp)}
              className={cn("px-3 py-1.5 rounded-full text-xs font-semibold border transition-all whitespace-nowrap",
                speciesFilter === sp ? "bg-primary text-primary-foreground border-primary" : "bg-background border-border text-muted-foreground hover:text-foreground hover:border-primary/30"
              )}>
              {sp === 'all' ? '🌿 All' : `${SPECIES_EMOJI[sp] || '🌿'} ${sp.charAt(0).toUpperCase() + sp.slice(1)}`}
            </button>
          ))}
        </div>
      </div>

      {isLoading && (
        <div className="text-center py-12">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary mb-4" />
          <p className="text-muted-foreground text-sm">Loading recipes...</p>
        </div>
      )}

      {!isLoading && (
        <div className="px-3 md:px-6 pb-12">
          {filteredRecipes.length === 0 ? (
            <div className="text-center py-12">
              <ChefHat className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No recipes found</h3>
              <p className="text-muted-foreground">Try adjusting your filters or search term.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
              {filteredRecipes.map((recipe) => (
                <div key={recipe.id} className="group cursor-pointer" onClick={() => handleRecipeSelect(recipe)}>
                  <div className="bg-background border border-border rounded-2xl overflow-hidden hover:shadow-xl hover:border-primary/20 transition-all duration-300 hover:-translate-y-1">
                    <div className="w-full aspect-[4/3] relative overflow-hidden">
                      <img
                        src={getRecipeImage(recipe)}
                        alt={recipe.title?.en}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />

                      <button onClick={(e) => { e.stopPropagation(); handleToggleFavorite(recipe.id); }}
                        className={cn("absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center transition-all",
                          favorites.includes(recipe.id)
                            ? "bg-yellow-400 text-white scale-100 opacity-100"
                            : "bg-foreground/60 opacity-0 group-hover:opacity-100 scale-90 group-hover:scale-100"
                        )}>
                        <Star className={cn("w-3 h-3", favorites.includes(recipe.id) ? "text-white fill-current" : "text-white")} />
                      </button>
                    </div>

                    <div className="p-3">
                      <h3 className="font-semibold text-sm text-foreground leading-tight line-clamp-2 group-hover:text-primary transition-colors">
                        {recipe.title?.[selectedLanguage] || recipe.title?.fr}
                      </h3>
                      {recipe.nutrition?.proteins_g > 0 && (
                        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground mt-1">
                          <span className="text-primary font-medium">{recipe.nutrition.proteins_g}g</span>
                          <span>·</span>
                          <span className={getNutritionColor(recipe.nutrition.antioxidant_score)}>{recipe.nutrition.antioxidant_score}</span>
                        </div>
                      )}
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
