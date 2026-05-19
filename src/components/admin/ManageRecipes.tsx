
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Loader2, Plus, Save, Trash2, Upload, Image as ImageIcon, BookOpen, ExternalLink, CheckCircle2, XCircle, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { PDFGenerationProgress, PDFGenerationStep } from './PDFGenerationProgress';
import { compressImageForPDF } from '@/utils/imageCompression';
import { Recipe } from '@/data/recipes';
import { leaves } from '@/data/leaves';

export const ManageRecipes = () => {
    const [recipes, setRecipes] = useState<Recipe[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [editingRecipe, setEditingRecipe] = useState<Partial<Recipe> | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [uploadingImage, setUploadingImage] = useState(false);
    const [isGeneratingBooklet, setIsGeneratingBooklet] = useState(false);
    const [pdfDialogOpen, setPdfDialogOpen] = useState(false);
    const [generatedPdfUrl, setGeneratedPdfUrl] = useState<string>('');
    const [generatedPdfName, setGeneratedPdfName] = useState<string>('');
    const [generatedPdfBlob, setGeneratedPdfBlob] = useState<Blob | null>(null);
    const [savedBooklets, setSavedBooklets] = useState<any[]>([]);
    const [isSavingPdf, setIsSavingPdf] = useState(false);

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

    const [structuredIngredients, setStructuredIngredients] = useState<{ qty: string; unit: string; name: string }[]>([]);
    const [structuredSteps, setStructuredSteps] = useState<string[]>([]);

    useEffect(() => {
        if (editingRecipe?.ingredients?.en) {
            setStructuredIngredients(editingRecipe.ingredients.en.map(parseIngredientString));
        } else {
            setStructuredIngredients([]);
        }
        if (editingRecipe?.steps?.en) {
            setStructuredSteps(editingRecipe.steps.en);
        } else {
            setStructuredSteps([]);
        }
    }, [editingRecipe?.id]);

    const [filterStatus, setFilterStatus] = useState<'all' | 'published' | 'hidden' | 'pending'>('all');
    const [leafFilter, setLeafFilter] = useState<string>('all');
    const [categoryFilter, setCategoryFilter] = useState<string>('all');

    const uniqueLeaves = [...new Set(recipes.map(r => (r as any).leafType).filter(Boolean))] as string[];
    const uniqueCategories = [...new Set(
        recipes.flatMap(r => {
            const tags: string[] = [];
            if ((r as any).origin) tags.push((r as any).origin);
            if ((r as any).dietary_tags) tags.push(...(r as any).dietary_tags);
            return tags;
        }).filter(Boolean)
    )] as string[];

    const filteredRecipes = recipes.filter(r => {
        if (filterStatus === 'all') return true;
        if (filterStatus === 'published') return r.published !== false;
        if (filterStatus === 'hidden') return r.published === false;
        if (filterStatus === 'pending') return (r as any).status === 'pending';
        return true;
    }).filter(r => {
        if (leafFilter === 'all') return true;
        return (r as any).leafType === leafFilter || (r as any).leafIds?.includes(parseInt(leafFilter));
    }).filter(r => {
        if (categoryFilter === 'all') return true;
        const origin = (r as any).origin;
        const tags = (r as any).dietary_tags || [];
        return origin === categoryFilter || tags.includes(categoryFilter);
    });

    // PDF Generation State
    const [pdfProgressOpen, setPdfProgressOpen] = useState(false);
    const [pdfProgress, setPdfProgress] = useState(0);
    const [pdfCurrentStep, setPdfCurrentStep] = useState('');
    const [pdfSteps, setPdfSteps] = useState<PDFGenerationStep[]>([
        { id: 'init', label: 'Initializing...', status: 'pending' },
        { id: 'images', label: 'Optimizing Images', status: 'pending' },
        { id: 'pages', label: 'Generating Pages', status: 'pending' },
        { id: 'preview', label: 'Preparing Preview', status: 'pending' }
    ]);

    const updatePdfStep = (stepId: string, status: 'active' | 'complete') => {
        setPdfSteps(prev => prev.map(s => s.id === stepId ? { ...s, status } : s));
        if (status === 'active') {
            const stepLabels: Record<string, string> = {
                'init': 'Preparing resources...',
                'images': 'Compressing and optimizing recipe images...',
                'pages': 'Layouting cookbook pages...',
                'preview': 'Finalizing for preview...'
            };
            setPdfCurrentStep(stepLabels[stepId] || 'Processing...');
        }
    };

    const handleGenerateBooklet = async () => {
        if (recipes.length === 0) return;

        setIsGeneratingBooklet(true);
        setPdfProgressOpen(true);
        setPdfProgress(0);

        // Reset steps
        setPdfSteps(prev => prev.map(s => ({ ...s, status: 'pending' })));

        try {
            // STEP 1: INIT
            updatePdfStep('init', 'active');
            setPdfProgress(5);

            // Lazy load dependencies to reduce bundle size
            const [{ pdf }, { RecipeBooklet }, QRCode] = await Promise.all([
                import('@react-pdf/renderer'),
                import('@/components/pdf/RecipeBooklet'),
                import('qrcode')
            ]);

            updatePdfStep('init', 'complete');
            setPdfProgress(10);

            // STEP 2: IMAGES
            updatePdfStep('images', 'active');

            // Generate QR Code
            const qrCodeUrl = await QRCode.toDataURL('https://safe-leaf-kitchen.solvefactory.fun/');
            setPdfProgress(15);

            // Clone recipes to not affect the UI state
            const recipesForPdf = JSON.parse(JSON.stringify(recipes));

            // Compress images for each recipe to reduce PDF size
            let processedCount = 0;
            const totalImages = recipesForPdf.length; // Approximate (1 main image per recipe)

            // Compress images in parallel
            const compressionPromises = recipesForPdf.map(async (recipe: any) => {
                // Compress main image
                if (recipe.image_url) {
                    try {
                        const compressed = await compressImageForPDF(recipe.image_url, 600, 0.7);
                        if (compressed) recipe.image_url = compressed;
                    } catch (e) {
                        console.warn('Failed to compress image:', recipe.image_url);
                    }
                }

                // Compress gallery
                if (recipe.gallery_images && recipe.gallery_images.length > 0) {
                    const compressedGallery = [];
                    // Process gallery images up to limit, also in parallel if needed, but sequential per recipe is fine for now
                    // actually let's just do top 4
                    for (const img of recipe.gallery_images.slice(0, 4)) {
                        try {
                            const compressed = await compressImageForPDF(img, 400, 0.6);
                            if (compressed) compressedGallery.push(compressed);
                        } catch (e) { }
                    }
                    recipe.gallery_images = compressedGallery;
                }

                // Update progress atomically
                processedCount++;
                const newProgress = 15 + Math.round((processedCount / totalImages) * 35);
                setPdfProgress(prev => Math.max(prev, newProgress)); // Ensure progress only goes up
            });

            await Promise.all(compressionPromises);

            updatePdfStep('images', 'complete');
            setPdfProgress(50);

            // STEP 3: PAGES
            updatePdfStep('pages', 'active');

            // Artificial small delay to allow UI to update
            await new Promise(r => setTimeout(r, 100));

            const blob = await pdf(
                <RecipeBooklet
                    recipes={recipesForPdf}
                    qrCodeDataUrl={qrCodeUrl}
                    origin={window.location.origin}
                />
            ).toBlob();

            updatePdfStep('pages', 'complete');
            setPdfProgress(90);

            // STEP 4: PREVIEW (No auto-upload)
            updatePdfStep('preview', 'active');

            const fileName = `SafeLeafKitchen_Booklet_${new Date().toISOString().split('T')[0]}.pdf`;

            // Create local blob URL for preview
            const blobUrl = URL.createObjectURL(blob);

            setGeneratedPdfUrl(blobUrl);
            setGeneratedPdfName(fileName);
            setGeneratedPdfBlob(blob); // Store blob for manual save to DB

            updatePdfStep('preview', 'complete');
            setPdfProgress(100);

            // Brief delay to show 100%
            await new Promise(r => setTimeout(r, 500));
            setPdfProgressOpen(false);

            toast.success('Booklet Generated! Save to DB when ready.');

            // Open automatically in new tab
            window.open(blobUrl, '_blank');
            setPdfDialogOpen(true);

        } catch (error: any) {
            console.error('Booklet Generation Error:', error);
            setPdfProgressOpen(false);
            toast.error('Failed to generate booklet: ' + error.message);
        } finally {
            setIsGeneratingBooklet(false);
        }
    };

    const fetchSavedBooklets = async () => {
        try {
            const { data, error } = await supabase.storage.from('content').list('booklets', {
                limit: 100,
                offset: 0,
                sortBy: { column: 'created_at', order: 'desc' },
            });

            if (error) throw error;
            setSavedBooklets(data || []);
        } catch (error) {
            console.log('Error fetching booklets:', error);
        }
    };

    const handleSavePdfToDb = async () => {
        console.log("Saving PDF to DB...", { generatedPdfName, blobSize: generatedPdfBlob?.size });

        if (!generatedPdfBlob || !generatedPdfName) {
            toast.error("No PDF data found to save. Please regenerate.");
            return;
        }

        setIsSavingPdf(true);
        toast.info('Saving booklet to database...');

        try {
            const filePath = `booklets/${generatedPdfName}`;

            const { error: uploadError } = await supabase.storage
                .from('content')
                .upload(filePath, generatedPdfBlob, {
                    contentType: 'application/pdf',
                    upsert: true
                });

            if (uploadError) throw uploadError;

            toast.success('Booklet saved to database successfully!');
            fetchSavedBooklets(); // Refresh list

        } catch (error: any) {
            console.error('Save PDF Error:', error);
            toast.error('Failed to save booklet: ' + error.message);
        } finally {
            setIsSavingPdf(false);
        }
    };

    const handleDeleteBooklet = async (fileName: string) => {
        if (!confirm(`Delete ${fileName}?`)) return;

        try {
            const { error } = await supabase.storage.from('content').remove([`booklets/${fileName}`]);
            if (error) throw error;
            toast.success('Booklet deleted');
            fetchSavedBooklets();
        } catch (error: any) {
            toast.error('Failed to delete booklet');
        }
    };

    const handleDownloadBooklet = async (fileName: string) => {
        const { data } = supabase.storage.from('content').getPublicUrl(`booklets/${fileName}`);
        window.open(data.publicUrl, '_blank');
    };




    const handleOpenInNewTab = () => {
        window.open(generatedPdfUrl, '_blank');
    };

    useEffect(() => {
        fetchRecipes();
        fetchSavedBooklets();
    }, []);

    const fetchRecipes = async () => {
        setIsLoading(true);
        const { data, error } = await supabase.from('recipes').select('*').order('created_at', { ascending: false });
        if (error) {
            toast.error('Failed to load recipes');
        } else {
            setRecipes(data || []);
        }
        setIsLoading(false);
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;

        setUploadingImage(true);
        const file = e.target.files[0];
        const fileExt = file.name.split('.').pop();
        const fileName = `recipe-${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `recipes/${fileName}`;

        try {
            const { error: uploadError } = await supabase.storage
                .from('content')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('content')
                .getPublicUrl(filePath);

            setEditingRecipe(prev => ({ ...prev, image_url: publicUrl }));
            toast.success('Image uploaded');
        } catch (error: any) {
            console.error('Upload failed:', error);
            toast.error('Image upload failed');
        } finally {
            setUploadingImage(false);
        }
    };

    const handleSave = async () => {
        if (!editingRecipe || !editingRecipe.title?.en) {
            toast.error('English title is required');
            return;
        }

        setIsSaving(true);

        const ingredientStrings = structuredIngredients.map(toIngredientString);
        const recipePayload = {
            ...editingRecipe,
            ingredients: {
                en: ingredientStrings,
                fr: ingredientStrings,
                ar: ingredientStrings,
            } as any,
            steps: {
                en: structuredSteps,
                fr: structuredSteps,
                ar: structuredSteps,
            } as any,
            published: editingRecipe.published === true,
        };

        try {
            const { error } = await supabase.functions.invoke('manage-content', {
                headers: { 'x-admin-key': 'hidachi' },
                body: {
                    table: 'recipes',
                    action: 'upsert',
                    data: recipePayload,
                    id: editingRecipe.id ? parseInt(editingRecipe.id.toString()) : undefined
                }
            });

            if (error) throw error;

            toast.success('Recipe saved (and RAG updated)');
            setEditingRecipe(null);
            fetchRecipes();
        } catch (error: any) {
            toast.error('Failed to save recipe');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure? This deletes the recipe and its AI knowledge.')) return;

        try {
            const { error } = await supabase.functions.invoke('manage-content', {
                headers: { 'x-admin-key': 'hidachi' },
                body: {
                    table: 'recipes',
                    action: 'delete',
                    id: id
                }
            });

            if (error) throw error;
            toast.success('Recipe deleted');
            fetchRecipes();
        } catch (error: any) {
            toast.error('Failed to delete');
        }
    };

    const handleApproveRecipe = async (id: string) => {
        try {
            const { error } = await supabase.from('recipes').update({ status: 'approved' }).eq('id', id);
            if (error) throw error;
            toast.success('Recipe approved and now visible to the public');
            fetchRecipes();
        } catch (error: any) {
            toast.error('Failed to approve');
        }
    };

    const handleRejectRecipe = async (id: string) => {
        try {
            const { error } = await supabase.from('recipes').update({ status: 'rejected' }).eq('id', id);
            if (error) throw error;
            toast.success('Recipe rejected');
            fetchRecipes();
        } catch (error: any) {
            toast.error('Failed to reject');
        }
    };

    const handleTogglePublished = async (recipe: Recipe) => {
        const newPublished = recipe.published === false;
        setRecipes(prev => prev.map(r => r.id === recipe.id ? { ...r, published: newPublished } : r));
        try {
            const { error } = await supabase.functions.invoke('manage-content', {
                headers: { 'x-admin-key': 'hidachi' },
                body: {
                    table: 'recipes',
                    action: 'upsert',
                    data: { ...recipe, published: newPublished },
                    id: parseInt(recipe.id.toString())
                }
            });
            if (error) {
                setRecipes(prev => prev.map(r => r.id === recipe.id ? { ...r, published: recipe.published } : r));
                throw error;
            }
            toast.success(`Recipe ${newPublished ? 'published' : 'hidden'}`);
        } catch (error: any) {
            toast.error('Failed to update published state');
        }
    };

    const getRecipeImage = (recipe: Recipe) => {
        if (recipe.image_url) return recipe.image_url;

        // Fallback to local files for migrated items
        if (recipe.title && recipe.title.en) {
            const folderName = recipe.title.en
                .toLowerCase()
                .replace(/[^a-z0-9\s]/g, '')
                .replace(/\s+/g, '-');
            return `/images/recipes/${folderName}/1.png`;
        }
        return '';
    };

    if (isLoading) return <div className="text-center p-8"><Loader2 className="animate-spin mx-auto text-emerald-600" /></div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-emerald-800">Recipes Database</h3>
                <div className="flex gap-2">
                    <Button
                        onClick={handleGenerateBooklet}
                        variant="outline"
                        disabled={isGeneratingBooklet || recipes.length === 0}
                        className="border-emerald-600 text-emerald-700 hover:bg-emerald-50"
                    >
                        {isGeneratingBooklet ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <BookOpen className="w-4 h-4 mr-2" />}
                        Generate Booklet
                    </Button>
                    <a href="#saved-booklets">
                        <Button variant="outline" className="border-slate-300 text-slate-700">
                            Saved Booklets
                        </Button>
                    </a>
                    <Button onClick={() => setEditingRecipe({ title: { en: '', fr: '', ar: '' }, ingredients: { en: [], fr: [], ar: [] }, steps: { en: [], fr: [], ar: [] }, nutrition: {} as any, published: false })} className="bg-emerald-600">
                        <Plus className="w-4 h-4 mr-2" /> Add Recipe
                    </Button>
                </div>
            </div>

            {/* Filter tabs */}
            <div className="flex gap-1 bg-slate-100 rounded-xl p-1 w-fit">
                {(['all', 'published', 'hidden', 'pending'] as const).map(status => (
                    <button
                        key={status}
                        onClick={() => setFilterStatus(status)}
                        className={`px-4 py-1.5 text-xs font-medium rounded-lg transition-all ${
                            filterStatus === status
                                ? 'bg-white text-emerald-700 shadow-sm'
                                : 'text-slate-500 hover:text-slate-700'
                        }`}
                    >
                        {status === 'all' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1)}
                        {status === 'pending' && recipes.filter(r => (r as any).status === 'pending').length > 0 && (
                            <span className="ml-1.5 bg-amber-400 text-amber-900 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                                {recipes.filter(r => (r as any).status === 'pending').length}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {editingRecipe && (
                <Dialog open={true} onOpenChange={(open) => { if (!open) setEditingRecipe(null); }}>
                <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{editingRecipe.id ? 'Edit Recipe' : 'New Recipe'}</DialogTitle>
                        <DialogDescription>Fields in English are required.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="grid grid-cols-3 gap-4">
                            <div>
                                <Label>Title (EN)</Label>
                                <Input value={editingRecipe.title?.en || ''} onChange={e => setEditingRecipe(prev => ({ ...prev, title: { ...prev?.title, en: e.target.value } as any }))} />
                            </div>
                            <div>
                                <Label>Title (FR)</Label>
                                <Input value={editingRecipe.title?.fr || ''} onChange={e => setEditingRecipe(prev => ({ ...prev, title: { ...prev?.title, fr: e.target.value } as any }))} />
                            </div>
                            <div>
                                <Label>Title (AR)</Label>
                                <Input value={editingRecipe.title?.ar || ''} onChange={e => setEditingRecipe(prev => ({ ...prev, title: { ...prev?.title, ar: e.target.value } as any }))} />
                            </div>
                        </div>

                        {/* Link to Leaves */}
                        <div>
                            <Label>Linked Leaves</Label>
                            <div className="grid grid-cols-3 gap-2 mt-1">
                                {leaves.map(leaf => {
                                    const isSelected = (editingRecipe as any).leafIds?.includes(leaf.id) || editingRecipe.leafType === leaf.name.en.toLowerCase();
                                    return (
                                        <label key={leaf.id} className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer text-sm transition-colors ${isSelected ? 'bg-emerald-50 border-emerald-300' : 'bg-white border-slate-200 hover:border-emerald-200'}`}>
                                            <input
                                                type="checkbox"
                                                checked={isSelected}
                                                onChange={() => {
                                                    const current: number[] = (editingRecipe as any).leafIds || [];
                                                    const next = isSelected ? current.filter((id: number) => id !== leaf.id) : [...current, leaf.id];
                                                    setEditingRecipe(prev => ({ ...prev, leafIds: next, leafType: next.length > 0 ? leaf.name.en.toLowerCase() : prev?.leafType }));
                                                }}
                                                className="rounded"
                                            />
                                            {leaf.name.en}
                                        </label>
                                    );
                                })}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">Select one or more leaves this recipe uses. Used for nutrition/CO2/savings calculations.</p>
                        </div>

                        {/* Recipe Metadata */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label>Origin / Cuisine</Label>
                                <Input
                                    value={(editingRecipe as any).origin || ''}
                                    onChange={e => setEditingRecipe(prev => ({ ...prev, origin: e.target.value }))}
                                    placeholder="e.g. Traditional Moroccan"
                                />
                            </div>
                            <div>
                                <Label>Dietary Tags (comma separated)</Label>
                                <Input
                                    value={(editingRecipe as any).dietary_tags?.join(', ') || ''}
                                    onChange={e => setEditingRecipe(prev => ({ ...prev, dietary_tags: e.target.value.split(',').map((s: string) => s.trim()).filter(Boolean) }))}
                                    placeholder="vegan, gluten-free, low-carb"
                                />
                            </div>
                        </div>

                        <div>
                            <Label>Ingredients (EN)</Label>
                            <div className="space-y-2 mt-1">
                                {structuredIngredients.map((ing, idx) => (
                                    <div key={idx} className="flex gap-2 items-start">
                                        <input
                                            type="text"
                                            value={ing.qty}
                                            onChange={e => {
                                                const copy = [...structuredIngredients];
                                                copy[idx] = { ...copy[idx], qty: e.target.value };
                                                setStructuredIngredients(copy);
                                            }}
                                            placeholder="Qty"
                                            className="w-16 bg-muted/50 border border-border rounded-lg py-2 px-2 text-sm text-center focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                                        />
                                        <select
                                            value={ing.unit}
                                            onChange={e => {
                                                const copy = [...structuredIngredients];
                                                copy[idx] = { ...copy[idx], unit: e.target.value };
                                                setStructuredIngredients(copy);
                                            }}
                                            className="w-24 bg-muted/50 border border-border rounded-lg py-2 px-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                                        >
                                            <option value="">—</option>
                                            {COMMON_UNITS.map(u => (
                                                <option key={u} value={u}>{u}</option>
                                            ))}
                                        </select>
                                        <input
                                            type="text"
                                            value={ing.name}
                                            onChange={e => {
                                                const copy = [...structuredIngredients];
                                                copy[idx] = { ...copy[idx], name: e.target.value };
                                                setStructuredIngredients(copy);
                                            }}
                                            placeholder="Ingredient name"
                                            className="flex-1 bg-muted/50 border border-border rounded-lg py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                                        />
                                        <button
                                            onClick={() => setStructuredIngredients(structuredIngredients.filter((_, i) => i !== idx))}
                                            className="p-2 text-red-400 hover:text-red-600 transition-colors shrink-0"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                                <button
                                    onClick={() => setStructuredIngredients([...structuredIngredients, { qty: '', unit: '', name: '' }])}
                                    className="w-full py-2 border-2 border-dashed border-border rounded-xl text-xs font-medium text-muted-foreground hover:border-emerald-300 hover:text-emerald-600 transition-all"
                                >
                                    + Add Ingredient
                                </button>
                            </div>
                        </div>
                        <div>
                            <Label>Steps (EN)</Label>
                            <div className="space-y-2 mt-1">
                                {structuredSteps.map((step, idx) => (
                                    <div key={idx} className="flex gap-2 items-start">
                                        <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-bold shrink-0 mt-1.5">{idx + 1}</div>
                                        <textarea
                                            value={step}
                                            onChange={e => {
                                                const copy = [...structuredSteps];
                                                copy[idx] = e.target.value;
                                                setStructuredSteps(copy);
                                            }}
                                            placeholder={`Step ${idx + 1}`}
                                            className="flex-1 bg-muted/50 border border-border rounded-lg py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 min-h-[60px]"
                                        />
                                        <button onClick={() => setStructuredSteps(structuredSteps.filter((_, i) => i !== idx))} className="p-2 text-red-400 hover:text-red-600 transition-colors shrink-0">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                                <button onClick={() => setStructuredSteps([...structuredSteps, ''])} className="w-full py-2 border-2 border-dashed border-border rounded-xl text-xs font-medium text-muted-foreground hover:border-emerald-300 hover:text-emerald-600 transition-all">
                                    + Add Step
                                </button>
                            </div>
                        </div>

                        {/* Nutrition Fields */}
                        <div>
                            <Label>Nutrition (per 100g)</Label>
                            <div className="grid grid-cols-4 gap-3 mt-1">
                                <div>
                                    <Label className="text-xs text-muted-foreground">Proteins (g)</Label>
                                    <Input type="number" step="0.01" value={editingRecipe.nutrition?.proteins_g ?? ''} onChange={e => setEditingRecipe(prev => ({ ...prev, nutrition: { ...prev?.nutrition, proteins_g: parseFloat(e.target.value) || 0 } as any }))} />
                                </div>
                                <div>
                                    <Label className="text-xs text-muted-foreground">Fats (g)</Label>
                                    <Input type="number" step="0.01" value={editingRecipe.nutrition?.fats_g ?? ''} onChange={e => setEditingRecipe(prev => ({ ...prev, nutrition: { ...prev?.nutrition, fats_g: parseFloat(e.target.value) || 0 } as any }))} />
                                </div>
                                <div>
                                    <Label className="text-xs text-muted-foreground">Ash (g)</Label>
                                    <Input type="number" step="0.01" value={editingRecipe.nutrition?.ash_g ?? ''} onChange={e => setEditingRecipe(prev => ({ ...prev, nutrition: { ...prev?.nutrition, ash_g: parseFloat(e.target.value) || 0 } as any }))} />
                                </div>
                                <div>
                                    <Label className="text-xs text-muted-foreground">Moisture (%)</Label>
                                    <Input type="number" step="0.1" value={editingRecipe.nutrition?.moisture_percent ?? ''} onChange={e => setEditingRecipe(prev => ({ ...prev, nutrition: { ...prev?.nutrition, moisture_percent: parseFloat(e.target.value) || 0 } as any }))} />
                                </div>
                                <div>
                                    <Label className="text-xs text-muted-foreground">Polyphenols (mg)</Label>
                                    <Input type="number" step="0.01" value={editingRecipe.nutrition?.polyphenols_mg ?? ''} onChange={e => setEditingRecipe(prev => ({ ...prev, nutrition: { ...prev?.nutrition, polyphenols_mg: parseFloat(e.target.value) || 0 } as any }))} />
                                </div>
                                <div>
                                    <Label className="text-xs text-muted-foreground">Flavonoids (mg)</Label>
                                    <Input type="number" step="0.01" value={editingRecipe.nutrition?.flavonoids_mg ?? ''} onChange={e => setEditingRecipe(prev => ({ ...prev, nutrition: { ...prev?.nutrition, flavonoids_mg: parseFloat(e.target.value) || 0 } as any }))} />
                                </div>
                                <div>
                                    <Label className="text-xs text-muted-foreground">Antioxidant Score</Label>
                                    <Input value={editingRecipe.nutrition?.antioxidant_score || ''} onChange={e => setEditingRecipe(prev => ({ ...prev, nutrition: { ...prev?.nutrition, antioxidant_score: e.target.value } as any }))} />
                                </div>
                                <div>
                                    <Label className="text-xs text-muted-foreground">Calories (kcal)</Label>
                                    <Input type="number" step="1" value={editingRecipe.nutrition?.calories_kcal ?? ''} onChange={e => setEditingRecipe(prev => ({ ...prev, nutrition: { ...prev?.nutrition, calories_kcal: parseInt(e.target.value) || undefined } as any }))} />
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 py-2">
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={editingRecipe.published !== false}
                                    onChange={e => setEditingRecipe(prev => ({ ...prev, published: e.target.checked }))}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-emerald-500/30 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                            </label>
                            <span className="text-sm font-medium">{editingRecipe.published !== false ? 'Published' : 'Hidden from public'}</span>
                            {editingRecipe.published !== false && editingRecipe.title?.en && (
                                <a
                                    href={`/recipes?highlight=${encodeURIComponent(editingRecipe.title.en)}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs text-emerald-600 hover:underline ml-auto flex items-center gap-1"
                                >
                                    <ExternalLink className="w-3 h-3" /> Preview
                                </a>
                            )}
                        </div>

                        <div>
                            <Label className="block mb-2">Image</Label>
                            <div className="flex items-center gap-4">
            {/* Leaf & Category filters */}
            <div className="flex flex-wrap gap-2 items-center">
                <select
                    value={leafFilter}
                    onChange={e => setLeafFilter(e.target.value)}
                    className="text-xs bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                >
                    <option value="all">All Leaves</option>
                    {uniqueLeaves.map(l => (
                        <option key={l} value={l}>{l.charAt(0).toUpperCase() + l.slice(1)}</option>
                    ))}
                </select>
                {uniqueCategories.length > 0 && (
                    <select
                        value={categoryFilter}
                        onChange={e => setCategoryFilter(e.target.value)}
                        className="text-xs bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                    >
                        <option value="all">All Categories</option>
                        {uniqueCategories.map(c => (
                            <option key={c} value={c}>{c}</option>
                        ))}
                    </select>
                )}
            </div>

            {editingRecipe && (
                                    <img
                                        src={getRecipeImage(editingRecipe as Recipe) || "/manual_upload_preview.png"}
                                        alt="Preview"
                                        className="w-16 h-16 object-cover rounded-md border"
                                        onError={(e) => {
                                            const target = e.target as HTMLImageElement;
                                            target.style.display = 'none';
                                        }}
                                    />
                                )}
                                <label className="cursor-pointer bg-slate-100 hover:bg-slate-200 px-4 py-2 rounded-md flex items-center gap-2 text-sm transition-colors">
                                    <Upload className="w-4 h-4" /> Upload
                                    <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" disabled={uploadingImage} />
                                </label>
                                {uploadingImage && <Loader2 className="w-4 h-4 animate-spin" />}
                            </div>

                            <div className="mt-4">
                                <Label className="block mb-2">Gallery Images <span className="text-xs font-normal text-muted-foreground ml-2">(Uploaded images only)</span></Label>
                                <div className="flex flex-wrap gap-4 mb-4">
                                    {editingRecipe.gallery_images?.map((url, idx) => (
                                        <div key={idx} className="relative group w-24 h-24">
                                            <img src={url} alt="Gallery" className="w-full h-full object-cover rounded-md border" />
                                            <button
                                                onClick={() => setEditingRecipe(prev => ({
                                                    ...prev,
                                                    gallery_images: prev?.gallery_images?.filter((_, i) => i !== idx)
                                                }))}
                                                className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <Trash2 className="w-3 h-3" />
                                            </button>
                                        </div>
                                    ))}
                                    <label className="cursor-pointer bg-slate-100 hover:bg-slate-200 w-24 h-24 rounded-md flex flex-col items-center justify-center text-xs text-slate-500 transition-colors border border-dashed border-slate-300">
                                        <Upload className="w-5 h-5 mb-1" /> Add
                                        <input
                                            type="file"
                                            accept="image/*"
                                            multiple
                                            onChange={async (e) => {
                                                if (!e.target.files?.length) return;
                                                setUploadingImage(true);
                                                const newUrls: string[] = [];
                                                try {
                                                    for (let i = 0; i < e.target.files.length; i++) {
                                                        const file = e.target.files[i];
                                                        const fileExt = file.name.split('.').pop();
                                                        const fileName = `recipe-gallery-${Math.random().toString(36).substring(2)}.${fileExt}`;
                                                        const filePath = `recipes/${fileName}`;
                                                        const { error: uploadError } = await supabase.storage.from('content').upload(filePath, file);
                                                        if (uploadError) throw uploadError;
                                                        const { data: { publicUrl } } = supabase.storage.from('content').getPublicUrl(filePath);
                                                        newUrls.push(publicUrl);
                                                    }
                                                    setEditingRecipe(prev => ({
                                                        ...prev,
                                                        gallery_images: [...(prev?.gallery_images || []), ...newUrls]
                                                    }));
                                                    toast.success(`${newUrls.length} images added`);
                                                } catch (err) {
                                                    toast.error('Upload failed');
                                                } finally {
                                                    setUploadingImage(false);
                                                }
                                            }}
                                            className="hidden"
                                            disabled={uploadingImage}
                                        />
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>
                    <DialogFooter className="gap-2">
                        <Button variant="outline" onClick={() => setEditingRecipe(null)}>Cancel</Button>
                        <Button onClick={handleSave} disabled={isSaving} className="bg-emerald-600">
                            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                            Save
                        </Button>
                    </DialogFooter>
                </DialogContent>
                </Dialog>
            )}

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredRecipes.map(recipe => (
                    <Card key={recipe.id} className={
                        `overflow-hidden transition-all border-l-4 ${
                            (recipe as any).status === 'pending'
                                ? 'bg-amber-50/80 hover:bg-amber-50 border-l-amber-400'
                                : recipe.published === false
                                ? 'bg-slate-100/80 hover:bg-slate-100 border-l-red-300'
                                : 'bg-white/80 hover:bg-white/95 border-l-emerald-400'
                        }`
                    }>
                        <div className="aspect-video w-full bg-slate-100 relative">
                            <img
                                src={getRecipeImage(recipe)}
                                alt={recipe.title?.en}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.style.display = 'none';
                                    (target.nextElementSibling as HTMLElement)?.classList.remove('hidden');
                                }}
                            />
                            <div className="w-full h-full flex items-center justify-center text-slate-400 hidden"><ImageIcon className="w-8 h-8" /></div>
                            {(recipe as any).status === 'pending' && (
                                <div className="absolute top-2 right-2 bg-amber-400 text-amber-900 text-[10px] font-bold px-2 py-0.5 rounded-full shadow">
                                    Pending
                                </div>
                            )}
                            {recipe.published === false && (
                                <div className="absolute top-2 right-2 bg-amber-400 text-amber-900 text-[10px] font-bold px-2 py-0.5 rounded-full shadow">
                                    Hidden
                                </div>
                            )}
                            {recipe.published !== false && !(recipe as any).status && (
                                <div className="absolute top-2 left-2 bg-emerald-400 text-emerald-900 text-[10px] font-bold px-2 py-0.5 rounded-full shadow">
                                    Published
                                </div>
                            )}
                        </div>
                        <CardHeader className="p-4 pb-2">
                            <CardTitle className="text-base truncate">{recipe.title?.en}</CardTitle>
                            <CardDescription className="text-xs truncate">{recipe.title?.fr}</CardDescription>
                        </CardHeader>
                        <CardContent className="p-4 pt-0 flex flex-col gap-2">
                            <div className="flex items-center justify-between">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <div
                                        onClick={(e) => { e.stopPropagation(); handleTogglePublished(recipe); }}
                                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors cursor-pointer ${recipe.published !== false ? 'bg-emerald-400' : 'bg-slate-300'}`}
                                    >
                                        <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${recipe.published !== false ? 'translate-x-[18px]' : 'translate-x-[2px]'}`} />
                                    </div>
                                    <span className="text-[11px] font-medium text-slate-500 flex items-center gap-1">
                                        {recipe.published !== false ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                                        {recipe.published !== false ? 'Published' : 'Hidden'}
                                    </span>
                                </label>
                                <div className="flex gap-1">
                                    {(recipe as any).status === 'pending' ? (
                                        <>
                                            <Button variant="ghost" size="sm" className="text-emerald-600 hover:bg-emerald-50 h-7 px-2" onClick={() => handleApproveRecipe(recipe.id.toString())}>
                                                <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Approve
                                            </Button>
                                            <Button variant="ghost" size="sm" className="text-red-500 hover:bg-red-50 h-7 px-2" onClick={() => handleRejectRecipe(recipe.id.toString())}>
                                                <XCircle className="w-3.5 h-3.5 mr-1" /> Reject
                                            </Button>
                                        </>
                                    ) : (
                                        <>
                                            <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => setEditingRecipe(recipe)}>Edit</Button>
                                            <Button variant="ghost" size="sm" className="text-red-500 hover:bg-red-50 h-7 px-2" onClick={() => handleDelete(recipe.id.toString())}><Trash2 className="w-3.5 h-3.5" /></Button>
                                        </>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Saved Booklets List */}
            <div id="saved-booklets" className="mt-12 pt-8 border-t border-slate-200">
                <h3 className="text-lg font-semibold text-emerald-800 mb-6 flex items-center gap-2">
                    <BookOpen className="w-5 h-5" /> Saved Booklets
                </h3>

                {savedBooklets.length === 0 ? (
                    <div className="text-center py-12 bg-slate-50 rounded-lg text-slate-500">
                        No saved booklets found. Generate one above!
                    </div>
                ) : (
                    <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-50 text-slate-500 font-medium">
                                <tr>
                                    <th className="px-4 py-3">Filename</th>
                                    <th className="px-4 py-3">Created</th>
                                    <th className="px-4 py-3">Size</th>
                                    <th className="px-4 py-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {savedBooklets.map((file) => (
                                    <tr key={file.id} className="hover:bg-slate-50">
                                        <td className="px-4 py-3 font-medium text-slate-700 flex items-center gap-2">
                                            <div className="w-8 h-8 rounded bg-red-50 flex items-center justify-center text-red-500">
                                                <BookOpen className="w-4 h-4" />
                                            </div>
                                            {file.name}
                                        </td>
                                        <td className="px-4 py-3 text-slate-500">
                                            {new Date(file.created_at).toLocaleDateString()} {new Date(file.created_at).toLocaleTimeString()}
                                        </td>
                                        <td className="px-4 py-3 text-slate-500">
                                            {(file.metadata?.size / 1024 / 1024).toFixed(2)} MB
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button size="sm" variant="outline" onClick={() => handleDownloadBooklet(file.name)}>
                                                    <ExternalLink className="w-4 h-4 mr-1" /> View
                                                </Button>
                                                <Button size="sm" variant="ghost" className="text-red-500 hover:bg-red-50" onClick={() => handleDeleteBooklet(file.name)}>
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* PDF Generated Dialog */}
            <Dialog open={pdfDialogOpen} onOpenChange={setPdfDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-emerald-700">
                            <CheckCircle2 className="w-5 h-5" />
                            Cookbook Generated Successfully!
                        </DialogTitle>
                        <DialogDescription>
                            Your Safe Leaf Kitchen cookbook has been created and saved. The PDF has opened in a new tab.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex flex-col gap-4 py-4">
                        <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-200 text-center">
                            <p className="text-sm font-medium text-emerald-800 truncate">{generatedPdfName}</p>
                            <p className="text-xs text-emerald-600 mt-1">Booklet generated successfully</p>
                        </div>
                    </div>
                    <DialogFooter className="flex flex-col sm:flex-row gap-2">
                        <Button variant="outline" onClick={handleOpenInNewTab} className="flex-1">
                            <ExternalLink className="w-4 h-4 mr-2" />
                            Open in New Tab
                        </Button>
                        <Button onClick={handleSavePdfToDb} disabled={isSavingPdf} className="flex-1 bg-emerald-600 hover:bg-emerald-700">
                            {isSavingPdf ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                            Save to Database
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Progress Dialog */}
            <PDFGenerationProgress
                isOpen={pdfProgressOpen}
                progress={pdfProgress}
                currentStep={pdfCurrentStep}
                steps={pdfSteps}
            />
        </div>
    );
};
