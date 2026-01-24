
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, Plus, Save, Trash2, Upload, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';

interface Leaf {
    id: string;
    name: { en: string; fr: string };
    aliases: string[];
    highlights: {
        proteins_percent?: number;
        antioxidant_classification?: string;
        calcium_mg_per_100g?: number;
        flavonoids_mg_per_100g?: number;
        polyphenols_mg_per_100g?: number;
    };
    compounds: string[];
    safety: string;
    summary: string;
    image_url: string;
    gallery_images?: string[];
    // Scientific Metadata (Phase 5)
    scientific_name?: string;
    family?: string;
    sources?: { title: string; url?: string; doi?: string }[];
    created_at?: string;
    updated_at?: string;
}

export const ManageLeaves = () => {
    const [leaves, setLeaves] = useState<Leaf[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [editingLeaf, setEditingLeaf] = useState<Partial<Leaf> | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [uploadingImage, setUploadingImage] = useState(false);

    useEffect(() => {
        fetchLeaves();
    }, []);

    const fetchLeaves = async () => {
        setIsLoading(true);
        const { data, error } = await supabase.from('leaves').select('*').order('created_at', { ascending: false });
        if (error) {
            toast.error('Failed to load leaves');
            console.error(error);
        } else {
            setLeaves(data || []);
        }
        setIsLoading(false);
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;

        setUploadingImage(true);
        const file = e.target.files[0];
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `leaves/${fileName}`;

        try {
            const { error: uploadError } = await supabase.storage
                .from('content')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('content')
                .getPublicUrl(filePath);

            setEditingLeaf(prev => ({ ...prev, image_url: publicUrl }));
            toast.success('Image uploaded');
        } catch (error: any) {
            console.error('Upload failed:', error);
            toast.error('Image upload failed');
        } finally {
            setUploadingImage(false);
        }
    };

    const handleSave = async () => {
        if (!editingLeaf || !editingLeaf.name?.en) {
            toast.error('English name is required');
            return;
        }

        setIsSaving(true);
        try {
            // Call Secure Edge Function
            const { data, error } = await supabase.functions.invoke('manage-content', {
                headers: { 'x-admin-key': 'hidachi' }, // Simulating generic admin auth
                body: {
                    table: 'leaves',
                    action: 'upsert',
                    data: editingLeaf,
                    id: editingLeaf.id // pass ID explicitly if updating
                }
            });

            if (error) throw error;

            toast.success('Leaf saved (and RAG updated)');
            setEditingLeaf(null);
            fetchLeaves();
        } catch (error: any) {
            console.error('Save failed:', error);
            toast.error('Failed to save leaf: ' + (error.message || 'Unknown error'));
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure? This deletes the leaf and its AI knowledge.')) return;

        try {
            const { error } = await supabase.functions.invoke('manage-content', {
                headers: { 'x-admin-key': 'hidachi' },
                body: {
                    table: 'leaves',
                    action: 'delete',
                    id: id
                }
            });

            if (error) throw error;
            toast.success('Leaf deleted');
            fetchLeaves();
        } catch (error: any) {
            toast.error('Failed to delete');
        }
    };

    const getLeafImage = (leaf: Leaf) => {
        if (leaf.image_url) return leaf.image_url;

        // Fallback to local files for migrated items
        if (leaf.name && leaf.name.en) {
            const filename = leaf.name.en
                .toLowerCase()
                .replace(/[^a-z0-9\s]/g, '')
                .replace(/\s+/g, '-');
            return `/images/leaves/${filename}/1.png`;
        }

        return '';
    };

    if (isLoading) return <div className="text-center p-8"><Loader2 className="animate-spin mx-auto text-emerald-600" /></div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-emerald-800">Leaves Database</h3>
                <Button onClick={() => setEditingLeaf({ name: { en: '', fr: '' }, highlights: {}, aliases: [], compounds: [] })} className="bg-emerald-600">
                    <Plus className="w-4 h-4 mr-2" /> Add Leaf
                </Button>
            </div>

            {editingLeaf && (
                <Card className="border-emerald-200 bg-white/95">
                    <CardHeader>
                        <CardTitle>{editingLeaf.id ? 'Edit Leaf' : 'New Leaf'}</CardTitle>
                        <CardDescription>Structured data here also trains the AI.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm font-medium">Name (EN)</label>
                                <Input value={editingLeaf.name?.en || ''} onChange={e => setEditingLeaf(prev => ({ ...prev, name: { ...prev?.name, en: e.target.value } as any }))} />
                            </div>
                            <div>
                                <label className="text-sm font-medium">Name (FR)</label>
                                <Input value={editingLeaf.name?.fr || ''} onChange={e => setEditingLeaf(prev => ({ ...prev, name: { ...prev?.name, fr: e.target.value } as any }))} />
                            </div>
                        </div>

                        {/* Scientific Metadata */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm font-medium">Scientific Name (Latin)</label>
                                <Input
                                    value={(editingLeaf as any).scientific_name || ''}
                                    onChange={e => setEditingLeaf(prev => ({ ...prev, scientific_name: e.target.value }))}
                                    placeholder="e.g. Allium cepa"
                                    className="italic"
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium">Family</label>
                                <Input
                                    value={(editingLeaf as any).family || ''}
                                    onChange={e => setEditingLeaf(prev => ({ ...prev, family: e.target.value }))}
                                    placeholder="e.g. Amaryllidaceae"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="text-sm font-medium">Summary (The "About" section)</label>
                            <Textarea value={editingLeaf.summary || ''} onChange={e => setEditingLeaf(prev => ({ ...prev, summary: e.target.value }))} rows={3} />
                        </div>
                        <div>
                            <label className="text-sm font-medium">Safety Info</label>
                            <Input value={editingLeaf.safety || ''} onChange={e => setEditingLeaf(prev => ({ ...prev, safety: e.target.value }))} />
                        </div>

                        {/* Simplified inputs for arrays/objects for prototype speed */}
                        <div>
                            <label className="text-sm font-medium">Aliases (comma separated)</label>
                            <Input
                                value={editingLeaf.aliases?.join(', ') || ''}
                                onChange={e => setEditingLeaf(prev => ({ ...prev, aliases: e.target.value.split(',').map(s => s.trim()) }))}
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium">Compounds (comma separated)</label>
                            <Input
                                value={editingLeaf.compounds?.join(', ') || ''}
                                onChange={e => setEditingLeaf(prev => ({ ...prev, compounds: e.target.value.split(',').map(s => s.trim()) }))}
                            />
                        </div>

                        <div>
                            <label className="text-sm font-medium">Highlights (JSON)</label>
                            <Textarea
                                value={JSON.stringify(editingLeaf.highlights || {}, null, 2)}
                                onChange={e => {
                                    try {
                                        const parsed = JSON.parse(e.target.value);
                                        setEditingLeaf(prev => ({ ...prev, highlights: parsed }))
                                    } catch (err) { /* ignore invalid JSON while typing */ }
                                }}
                                className="font-mono text-xs"
                                rows={4}
                            />
                            <p className="text-xs text-muted-foreground">Format: {"{ \"proteins_percent\": 20, \"antioxidant_classification\": \"High\" }"}</p>
                        </div>

                        <div>
                            <label className="text-sm font-medium block mb-2">Image</label>
                            <div className="flex items-center gap-4">
                                {editingLeaf && (
                                    <img
                                        src={getLeafImage(editingLeaf as Leaf) || "/manual_upload_preview.png"}
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
                                    {editingLeaf.gallery_images?.map((url, idx) => (
                                        <div key={idx} className="relative group w-24 h-24">
                                            <img src={url} alt="Gallery" className="w-full h-full object-cover rounded-md border" />
                                            <button
                                                onClick={() => setEditingLeaf(prev => ({
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
                                                        const fileName = `gallery-${Math.random().toString(36).substring(2)}.${fileExt}`;
                                                        const filePath = `leaves/${fileName}`;

                                                        const { error: uploadError } = await supabase.storage.from('content').upload(filePath, file);
                                                        if (uploadError) throw uploadError;

                                                        const { data: { publicUrl } } = supabase.storage.from('content').getPublicUrl(filePath);
                                                        newUrls.push(publicUrl);
                                                    }

                                                    setEditingLeaf(prev => ({
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
                            <Button variant="outline" onClick={() => setEditingLeaf(null)}>Cancel</Button>
                            <Button onClick={handleSave} disabled={isSaving} className="bg-emerald-600">
                                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                Save
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {leaves.map(leaf => (
                    <Card key={leaf.id} className="overflow-hidden bg-white/80 hover:bg-white/95 transition-all">
                        <div className="aspect-video w-full bg-slate-100 relative">
                            <img
                                src={getLeafImage(leaf)}
                                alt={leaf.name?.en}
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
                            <CardTitle className="text-base truncate">{leaf.name?.en}</CardTitle>
                            <CardDescription className="text-xs truncate">{leaf.name?.fr}</CardDescription>
                        </CardHeader>
                        <CardContent className="p-4 pt-0 flex justify-end gap-2">
                            <Button variant="ghost" size="sm" onClick={() => setEditingLeaf(leaf)}>Edit</Button>
                            <Button variant="ghost" size="sm" className="text-red-500 hover:bg-red-50" onClick={() => handleDelete(leaf.id)}><Trash2 className="w-4 h-4" /></Button>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
};
