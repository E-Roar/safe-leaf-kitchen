
import React, { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, Plus, FileText, CheckCircle, AlertCircle } from 'lucide-react';

export const KnowledgeBase = () => {
    const [content, setContent] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    const [status, setStatus] = useState<{ type: 'success' | 'error' | null, message: string } | null>(null);

    const handleUpload = async () => {
        if (!content.trim() || content.length < 20) {
            setStatus({ type: 'error', message: 'Content must be at least 20 characters long.' });
            return;
        }

        setIsUploading(true);
        setStatus(null);

        try {
            const { error } = await supabase.functions.invoke('embed-document', {
                body: { content: content, minLength: 20 }
            });

            if (error) {
                throw error;
            }

            setStatus({ type: 'success', message: 'Content successfully added to the knowledge base!' });
            setContent(''); // Clear input on success
        } catch (error: any) {
            console.error('Upload failed:', error);
            setStatus({
                type: 'error',
                message: error.message || 'Failed to analyze and store content. Please try again.'
            });
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <Card className="w-full max-w-2xl mx-auto mt-8 bg-white/90 backdrop-blur-sm shadow-xl border-emerald-100">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-2xl text-emerald-800">
                    <FileText className="w-6 h-6" />
                    Teach the AI
                </CardTitle>
                <CardDescription className="text-emerald-600">
                    Add new information to the SafeLeaf Kitchen knowledge base.
                    The AI will use this content to answer user questions more accurately.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <Textarea
                    placeholder="Paste text here (e.g., leaf identification tips, recipes, safety warnings)..."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="min-h-[200px] border-emerald-200 focus:ring-emerald-500"
                />

                {status && (
                    <Alert variant={status.type === 'error' ? 'destructive' : 'default'}
                        className={status.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : ''}>
                        {status.type === 'success' ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                        <AlertTitle>{status.type === 'success' ? 'Success' : 'Error'}</AlertTitle>
                        <AlertDescription>{status.message}</AlertDescription>
                    </Alert>
                )}

                <Button
                    onClick={handleUpload}
                    disabled={isUploading || content.length < 20}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                    {isUploading ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Processing...
                        </>
                    ) : (
                        <>
                            <Plus className="mr-2 h-4 w-4" />
                            Add to Knowledge Base
                        </>
                    )}
                </Button>
            </CardContent>
        </Card>
    );
};
