import React, { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { leaves } from '@/data/leaves';
import { recipes } from '@/data/recipes';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Loader2, CheckCircle, Database } from 'lucide-react';
import { toast } from 'sonner';

export const DataMigration = () => {
    const [isMigrating, setIsMigrating] = useState(false);
    const [logs, setLogs] = useState<string[]>([]);
    const [progress, setProgress] = useState(0);

    const log = (msg: string) => {
        setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${msg}`]);
    };

    const migrateLeaves = async () => {
        log('Starting Leaves Migration...');
        let count = 0;
        for (const leaf of leaves) {
            try {
                // Remove numeric ID to let Supabase generate UUID
                const { id, ...leafData } = leaf;

                // Add dummy image if needed or leave null
                // Clean up data to match schema expectations if necessary

                const { error } = await supabase.functions.invoke('manage-content', {
                    headers: { 'x-admin-key': 'hidachi' },
                    body: {
                        table: 'leaves',
                        action: 'upsert',
                        data: {
                            ...leafData,
                            image_url: null, // No image in local data
                            created_at: new Date().toISOString()
                        }
                    }
                });

                if (error) throw error;
                log(`✅ Imported: ${leaf.name.en}`);
                count++;
                setProgress(prev => prev + 1);
            } catch (err: any) {
                log(`❌ Failed: ${leaf.name.en} - ${err.message}`);
                console.error(err);
            }
        }
        log(`Leaves migration complete. ${count}/${leaves.length} imported.`);
    };

    const migrateRecipes = async () => {
        log('Starting Recipes Migration...');
        let count = 0;
        for (const recipe of recipes) {
            try {
                const { id, ...recipeData } = recipe;

                const { error } = await supabase.functions.invoke('manage-content', {
                    headers: { 'x-admin-key': 'hidachi' },
                    body: {
                        table: 'recipes',
                        action: 'upsert',
                        data: {
                            ...recipeData,
                            image_url: null,
                            created_at: new Date().toISOString()
                        }
                    }
                });

                if (error) throw error;
                log(`✅ Imported: ${recipe.title.en}`);
                count++;
                setProgress(prev => prev + 1);
            } catch (err: any) {
                log(`❌ Failed: ${recipe.title.en} - ${err.message}`);
                console.error(err);
            }
        }
        log(`Recipes migration complete. ${count}/${recipes.length} imported.`);
    };

    const handleMigration = async () => {
        if (!confirm('This will import all local leaves and recipes to Supabase. Continue?')) return;

        setIsMigrating(true);
        setLogs([]);
        setProgress(0);

        try {
            await migrateLeaves();
            await migrateRecipes();
            toast.success('Migration Completed!');
        } catch (error) {
            toast.error('Migration encountered errors');
        } finally {
            setIsMigrating(false);
        }
    };

    return (
        <Card className="glass border-emerald-200">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Database className="w-5 h-5 text-emerald-600" />
                    Data Migration
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="p-4 bg-amber-50 rounded-lg text-amber-800 text-sm">
                    <p>This tool will import {leaves.length} leaves and {recipes.length} recipes from the local code files into your Supabase database.</p>
                </div>

                <Button
                    onClick={handleMigration}
                    disabled={isMigrating}
                    className="w-full bg-emerald-600 hover:bg-emerald-700"
                >
                    {isMigrating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                    Start Migration
                </Button>

                {logs.length > 0 && (
                    <div className="mt-4 p-4 bg-slate-950 rounded-lg h-60 overflow-y-auto font-mono text-xs text-green-400">
                        {logs.map((log, i) => (
                            <div key={i}>{log}</div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
};
