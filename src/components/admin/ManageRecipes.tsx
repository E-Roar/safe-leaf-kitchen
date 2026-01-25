
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
// PDF libs are now lazy loaded
// import { pdf } from '@react-pdf/renderer';
// import QRCode from 'qrcode';
// import { RecipeBooklet } from '@/components/pdf/RecipeBooklet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Loader2, Plus, Save, Trash2, Upload, Image as ImageIcon, BookOpen, ExternalLink, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { PDFGenerationProgress, PDFGenerationStep } from './PDFGenerationProgress';
import { compressImageForPDF } from '@/utils/imageCompression';

// Simplified interface for prototype - REPLACED by shared type
import { Recipe } from '@/data/recipes';

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
        try {
            const { error } = await supabase.functions.invoke('manage-content', {
                headers: { 'x-admin-key': 'hidachi' },
                body: {
                    table: 'recipes',
                    action: 'upsert',
                    data: editingRecipe,
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
                    <Button onClick={() => setEditingRecipe({ title: { en: '', fr: '', ar: '' }, ingredients: { en: [], fr: [], ar: [] }, steps: { en: [], fr: [], ar: [] } })} className="bg-emerald-600">
                        <Plus className="w-4 h-4 mr-2" /> Add Recipe
                    </Button>
                </div>
            </div>

            {editingRecipe && (
                <Card className="border-emerald-200 bg-white/95">
                    <CardHeader>
                        <CardTitle>{editingRecipe.id ? 'Edit Recipe' : 'New Recipe'}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-3 gap-4">
                            <div>
                                <label className="text-sm font-medium">Title (EN)</label>
                                <Input value={editingRecipe.title?.en || ''} onChange={e => setEditingRecipe(prev => ({ ...prev, title: { ...prev?.title, en: e.target.value } as any }))} />
                            </div>
                            <div>
                                <label className="text-sm font-medium">Title (FR)</label>
                                <Input value={editingRecipe.title?.fr || ''} onChange={e => setEditingRecipe(prev => ({ ...prev, title: { ...prev?.title, fr: e.target.value } as any }))} />
                            </div>
                            <div>
                                <label className="text-sm font-medium">Title (AR)</label>
                                <Input value={editingRecipe.title?.ar || ''} onChange={e => setEditingRecipe(prev => ({ ...prev, title: { ...prev?.title, ar: e.target.value } as any }))} />
                            </div>
                        </div>

                        {/* Recipe Metadata */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm font-medium">Origin / Cuisine</label>
                                <Input
                                    value={(editingRecipe as any).origin || ''}
                                    onChange={e => setEditingRecipe(prev => ({ ...prev, origin: e.target.value }))}
                                    placeholder="e.g. Traditional Moroccan"
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium">Dietary Tags (comma separated)</label>
                                <Input
                                    value={(editingRecipe as any).dietary_tags?.join(', ') || ''}
                                    onChange={e => setEditingRecipe(prev => ({ ...prev, dietary_tags: e.target.value.split(',').map((s: string) => s.trim()).filter(Boolean) }))}
                                    placeholder="vegan, gluten-free, low-carb"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="text-sm font-medium">Ingredients (EN) - Comma Separated</label>
                            <Textarea
                                value={editingRecipe.ingredients?.en?.join(', ') || ''}
                                onChange={e => setEditingRecipe(prev => ({ ...prev, ingredients: { ...prev?.ingredients, en: e.target.value.split(',').map(s => s.trim()) } as any }))}
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium">Steps (EN) - Comma Separated (One per step)</label>
                            <Textarea
                                value={editingRecipe.steps?.en?.join(', ') || ''}
                                onChange={e => setEditingRecipe(prev => ({ ...prev, steps: { ...prev?.steps, en: e.target.value.split(',').map(s => s.trim()) } as any }))}
                            />
                        </div>

                        <div>
                            <label className="text-sm font-medium">Nutrition JSON</label>
                            <Textarea
                                value={JSON.stringify(editingRecipe.nutrition || {}, null, 2)}
                                onChange={e => {
                                    try {
                                        const parsed = JSON.parse(e.target.value);
                                        setEditingRecipe(prev => ({ ...prev, nutrition: parsed }))
                                    } catch (err) { }
                                }}
                                className="font-mono text-xs"
                                rows={3}
                            />
                        </div>

                        <div>
                            <label className="text-sm font-medium block mb-2">Image</label>
                            <div className="flex items-center gap-4">
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

                            <div>
                                <label className="text-sm font-medium block mb-2">Gallery Images <span className="text-xs font-normal text-muted-foreground ml-2">(Uploaded images only. Local folder images are handled automatically)</span></label>
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

                        <div className="flex justify-end gap-2 pt-4">
                            <Button variant="outline" onClick={() => setEditingRecipe(null)}>Cancel</Button>
                            <Button onClick={handleSave} disabled={isSaving} className="bg-emerald-600">
                                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                Save
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {recipes.map(recipe => (
                    <Card key={recipe.id} className="overflow-hidden bg-white/80 hover:bg-white/95 transition-all">
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
                        </div>
                        <CardHeader className="p-4">
                            <CardTitle className="text-base truncate">{recipe.title?.en}</CardTitle>
                            <CardDescription className="text-xs truncate">{recipe.title?.fr}</CardDescription>
                        </CardHeader>
                        <CardContent className="p-4 pt-0 flex justify-end gap-2">
                            <Button variant="ghost" size="sm" onClick={() => setEditingRecipe(recipe)}>Edit</Button>
                            <Button variant="ghost" size="sm" className="text-red-500 hover:bg-red-50" onClick={() => handleDelete(recipe.id.toString())}><Trash2 className="w-4 h-4" /></Button>
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
