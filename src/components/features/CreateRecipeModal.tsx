import { useState, useEffect } from "react";
import { 
  X, 
  ChevronRight, 
  ChevronLeft, 
  ChefHat, 
  Plus, 
  Trash2, 
  Globe, 
  Clock, 
  Users, 
  Leaf,
  Check,
  Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { CommunityService } from "@/services/communityService";
import { useAuth } from "@/contexts/AuthContext";
import { safeStorage } from "@/lib/safeStorage";
import type { RecipeCategory, CommunityRecipe } from "@/types/community";
import { toast } from "sonner";

interface CreateRecipeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  recipeToEdit?: CommunityRecipe | null;
}

export default function CreateRecipeModal({ isOpen, onClose, onSuccess, recipeToEdit }: CreateRecipeModalProps) {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [categories, setCategories] = useState<RecipeCategory[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [titleEn, setTitleEn] = useState("");
  const [titleFr, setTitleFr] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [region, setRegion] = useState("");
  const [prepTime, setPrepTime] = useState(30);
  const [servings, setServings] = useState(4);
  const [history, setHistory] = useState("");
  const [benefits, setBenefits] = useState("");
  
  const COMMON_UNITS = ['g', 'kg', 'ml', 'L', 'cup', 'tbsp', 'tsp', 'piece', 'pinch', 'bowl', 'slice', 'clove', 'bunch', 'handful', 'can', 'pack', 'to taste'];

  function parseIngredientString(s: string): { qty: string; unit: string; name: string } {
    const match = s.match(/^([\d.]+)\s+(\S+)\s+(.*)/);
    if (match) return { qty: match[1], unit: match[2], name: match[3] };
    return { qty: '', unit: '', name: s };
  }

  function toIngredientString(ing: { qty: string; unit: string; name: string }): string {
    const parts = [ing.qty, ing.unit, ing.name].filter(Boolean);
    return parts.join(' ') || '';
  }

  const [ingredients, setIngredients] = useState<{ qty: string; unit: string; name: string }[]>([{ qty: '', unit: '', name: '' }]);
  const [stepsEn, setStepsEn] = useState<string[]>([""]);
  const [stepsFr, setStepsFr] = useState<string[]>([""]);

  useEffect(() => {
    if (isOpen) {
      CommunityService.getCategories().then(setCategories);
      
      if (recipeToEdit) {
        setTitleEn(recipeToEdit.title.en || "");
        setTitleFr(recipeToEdit.title.fr || "");
        setCategoryId(recipeToEdit.category_id || "");
        setRegion(recipeToEdit.region || "");
        setPrepTime(recipeToEdit.prep_time_minutes || 30);
        setServings(recipeToEdit.servings || 4);
        setHistory(recipeToEdit.background_history || "");
        setBenefits(recipeToEdit.known_benefits || "");
        setIngredients((recipeToEdit.ingredients as string[] || []).map(parseIngredientString));
        setStepsEn(recipeToEdit.steps.en || [""]);
        setStepsFr(recipeToEdit.steps.fr || [""]);
      } else {
        // Reset form for new recipe
        setTitleEn("");
        setTitleFr("");
        setCategoryId("");
        setRegion("");
        setPrepTime(30);
        setServings(4);
        setHistory("");
        setBenefits("");
        setIngredients([{ qty: '', unit: '', name: '' }]);
        setStepsEn([""]);
        setStepsFr([""]);
        setStep(1);
      }
    }
  }, [isOpen, recipeToEdit]);

  if (!isOpen) return null;

  const handleNext = () => setStep(s => s + 1);
  const handleBack = () => setStep(s => s - 1);

  const addIngredient = () => setIngredients([...ingredients, { qty: '', unit: '', name: '' }]);
  const removeIngredient = (index: number) => setIngredients(ingredients.filter((_, i) => i !== index));
  
  const addStep = () => {
    setStepsEn([...stepsEn, ""]);
    setStepsFr([...stepsFr, ""]);
  };
  const removeStep = (index: number) => {
    setStepsEn(stepsEn.filter((_, i) => i !== index));
    setStepsFr(stepsFr.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    const demoMode = safeStorage.get('demoMode') === 'true';
    if (!user && !demoMode) return;
    setIsSubmitting(true);

    if (demoMode) {
      toast.success("Recipe created! (Demo)", {
        description: "Sign in to save recipes permanently."
      });
      onSuccess?.();
      onClose();
      setIsSubmitting(false);
      return;
    }

    if (!user) return;

    const ingredientStrings = ingredients.map(toIngredientString);
    const recipeData = {
      title: { en: titleEn, fr: titleFr, ar: "" },
      steps: { en: stepsEn, fr: stepsFr, ar: [] },
      ingredients: ingredientStrings,
      category_id: categoryId,
      region,
      prep_time_minutes: prepTime,
      servings,
      background_history: history,
      known_benefits: benefits,
      created_by: user.id
    };

    let result;
    if (recipeToEdit) {
      result = await CommunityService.updateRecipe(recipeToEdit.id, recipeData);
    } else {
      result = await CommunityService.createRecipe(recipeData);
    }
    
    if (result) {
      toast.success(recipeToEdit ? "Recipe updated successfully!" : "Recipe shared successfully!");
      onSuccess?.();
      onClose();
    } else {
      toast.error("Failed to save recipe. Please try again.");
    }
    setIsSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-background border border-border w-full max-w-2xl max-h-[90vh] overflow-hidden rounded-[2.5rem] shadow-2xl flex flex-col">
        
        {/* Header */}
        <div className="px-8 py-6 border-b border-border flex items-center justify-between bg-muted/20">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              <ChefHat className="w-5 h-5 text-primary" /> {recipeToEdit ? "Edit Traditional Recipe" : "Share Traditional Recipe"}
            </h2>
            <p className="text-xs text-muted-foreground mt-1">Step {step} of 4</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-muted rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="flex-1 overflow-y-auto p-8 no-scrollbar">
          
          {/* Step 1: Basics */}
          {step === 1 && (
            <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Title (English)</label>
                  <input 
                    value={titleEn} onChange={e => setTitleEn(e.target.value)}
                    placeholder="e.g. Traditional Spinach Tagine"
                    className="w-full bg-muted/50 border border-border rounded-2xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Title (French)</label>
                  <input 
                    value={titleFr} onChange={e => setTitleFr(e.target.value)}
                    placeholder="e.g. Tagine d'épinards traditionnel"
                    className="w-full bg-muted/50 border border-border rounded-2xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Category</label>
                  <select 
                    value={categoryId} onChange={e => setCategoryId(e.target.value)}
                    className="w-full bg-muted/50 border border-border rounded-2xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 appearance-none"
                  >
                    <option value="">Select Category</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.emoji} {cat.name_en}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Region (Optional)</label>
                  <input 
                    value={region} onChange={e => setRegion(e.target.value)}
                    placeholder="e.g. High Atlas, Souss"
                    className="w-full bg-muted/50 border border-border rounded-2xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1 flex items-center gap-1.5">
                    <Clock className="w-3 h-3" /> Prep Time (min)
                  </label>
                  <input 
                    type="number" value={prepTime} onChange={e => setPrepTime(Number(e.target.value))}
                    className="w-full bg-muted/50 border border-border rounded-2xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1 flex items-center gap-1.5">
                    <Users className="w-3 h-3" /> Servings
                  </label>
                  <input 
                    type="number" value={servings} onChange={e => setServings(Number(e.target.value))}
                    className="w-full bg-muted/50 border border-border rounded-2xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Ingredients */}
          {step === 2 && (
            <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
              <div className="space-y-3">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Ingredients</label>
                {ingredients.map((ing, i) => (
                  <div key={i} className="flex gap-2 items-start">
                    <input 
                      value={ing.qty} onChange={e => {
                        const copy = [...ingredients];
                        copy[i] = { ...copy[i], qty: e.target.value };
                        setIngredients(copy);
                      }}
                      placeholder="Qty"
                      className="w-16 bg-muted/50 border border-border rounded-xl py-3 px-2 text-sm text-center focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                    <select
                      value={ing.unit} onChange={e => {
                        const copy = [...ingredients];
                        copy[i] = { ...copy[i], unit: e.target.value };
                        setIngredients(copy);
                      }}
                      className="w-22 bg-muted/50 border border-border rounded-xl py-3 px-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                    >
                      <option value="">—</option>
                      {COMMON_UNITS.map(u => (
                        <option key={u} value={u}>{u}</option>
                      ))}
                    </select>
                    <input 
                      value={ing.name} onChange={e => {
                        const copy = [...ingredients];
                        copy[i] = { ...copy[i], name: e.target.value };
                        setIngredients(copy);
                      }}
                      placeholder="Ingredient name"
                      className="flex-1 bg-muted/50 border border-border rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                    <button onClick={() => removeIngredient(i)} className="p-3 text-muted-foreground hover:text-red-500 transition-colors shrink-0">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                <button onClick={addIngredient} className="w-full py-3 border-2 border-dashed border-border rounded-2xl text-xs font-bold text-muted-foreground hover:border-primary/30 hover:text-primary transition-all flex items-center justify-center gap-2">
                  <Plus className="w-4 h-4" /> Add Ingredient
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Instructions */}
          {step === 3 && (
            <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
              <div className="space-y-4">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Instructions (English)</label>
                {stepsEn.map((s, i) => (
                  <div key={i} className="flex gap-2">
                    <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-black shrink-0 mt-1">{i + 1}</div>
                    <textarea 
                      value={s} onChange={e => {
                        const newSteps = [...stepsEn];
                        newSteps[i] = e.target.value;
                        setStepsEn(newSteps);
                      }}
                      placeholder={`Step ${i + 1} details...`}
                      className="flex-1 bg-muted/50 border border-border rounded-2xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 min-h-[80px]"
                    />
                    <button onClick={() => removeStep(i)} className="p-3 text-muted-foreground hover:text-red-500 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                <button onClick={addStep} className="w-full py-3 border-2 border-dashed border-border rounded-2xl text-xs font-bold text-muted-foreground hover:border-primary/30 hover:text-primary transition-all flex items-center justify-center gap-2">
                  <Plus className="w-4 h-4" /> Add Step
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Lore & Submit */}
          {step === 4 && (
            <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1 flex items-center gap-1.5">
                  <Globe className="w-3 h-3" /> Historical Context / Lore
                </label>
                <textarea 
                  value={history} onChange={e => setHistory(e.target.value)}
                  placeholder="Tell us about the origin of this dish..."
                  className="w-full bg-muted/50 border border-border rounded-2xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 min-h-[120px]"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1 flex items-center gap-1.5">
                  <Leaf className="w-3 h-3" /> Known Health Benefits
                </label>
                <input 
                  value={benefits} onChange={e => setBenefits(e.target.value)}
                  placeholder="e.g. Rich in Iron, Good for Digestion"
                  className="w-full bg-muted/50 border border-border rounded-2xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>

              <div className="bg-primary/5 border border-primary/20 rounded-3xl p-6 mt-8">
                <div className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-bold text-primary mb-1">{recipeToEdit ? "Save changes?" : "Ready to share?"}</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {recipeToEdit ? "Your updates will be reflected immediately." : "Your recipe will be visible to the entire community immediately. You can edit it later from your profile."}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer Navigation */}
        <div className="px-8 py-6 border-t border-border bg-muted/10 flex items-center justify-between">
          <button 
            onClick={handleBack} disabled={step === 1}
            className={cn("flex items-center gap-2 px-6 py-2.5 rounded-2xl text-sm font-bold transition-all", 
              step === 1 ? "opacity-0 pointer-events-none" : "hover:bg-muted text-muted-foreground")}
          >
            <ChevronLeft className="w-4 h-4" /> Back
          </button>

          {step < 4 ? (
            <button 
              onClick={handleNext} disabled={!titleEn || !categoryId}
              className="flex items-center gap-2 px-8 py-2.5 rounded-2xl text-sm font-bold bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:-translate-y-1 transition-all disabled:opacity-50 disabled:translate-y-0"
            >
              Next <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button 
              onClick={handleSubmit} disabled={isSubmitting}
              className="flex items-center gap-2 px-10 py-3 rounded-2xl text-sm font-bold bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:-translate-y-1 transition-all disabled:opacity-50"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : (recipeToEdit ? "Save Changes" : "Share Recipe")}
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
