
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, Plus, Save, Trash2, Upload, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';

// Simplified interface for prototype
interface Recipe {
    id: string;
    title: { en: string; fr: string; ar: string };
    ingredients: { en: string[]; fr: string[]; ar: string[] };
    steps: { en: string[]; fr: string[]; ar: string[] };
    nutrition: any;
    image_url: string;
    gallery_images?: string[];
    // Metadata (Phase 5)
    origin?: string;
    dietary_tags?: string[];
    sources?: { title: string; url?: string; doi?: string }[];
    created_at?: string;
    updated_at?: string;
}

export const ManageRecipes = () => {
    const [recipes, setRecipes] = useState<Recipe[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [editingRecipe, setEditingRecipe] = useState<Partial<Recipe> | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [uploadingImage, setUploadingImage] = useState(false);

    useEffect(() => {
        fetchRecipes();
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
                    id: editingRecipe.id
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
                <Button onClick={() => setEditingRecipe({ title: { en: '', fr: '', ar: '' }, ingredients: { en: [], fr: [], ar: [] }, steps: { en: [], fr: [], ar: [] } })} className="bg-emerald-600">
                    <Plus className="w-4 h-4 mr-2" /> Add Recipe
                </Button>
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
                            <Button variant="ghost" size="sm" className="text-red-500 hover:bg-red-50" onClick={() => handleDelete(recipe.id)}><Trash2 className="w-4 h-4" /></Button>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
};
