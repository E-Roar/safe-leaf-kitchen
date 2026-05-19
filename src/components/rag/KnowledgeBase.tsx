
import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, Plus, FileText, CheckCircle, AlertCircle, Upload, File } from 'lucide-react';
import mammoth from 'mammoth';

function extractTextFromPDF(arrayBuffer: ArrayBuffer): string {
  const bytes = new Uint8Array(arrayBuffer);
  const text = new TextDecoder('utf-8').decode(bytes);
  const parts: string[] = [];
  const regex = /\(([^)]*)\)/g;
  let match;
  while ((match = regex.exec(text)) !== null) {
    const content = match[1].trim();
    if (content.length > 3 && /[a-zA-Z]{3,}/.test(content)) {
      parts.push(content);
    }
  }
  const pageLabels = text.match(/\/Page\s+(\d+)/g);
  return parts.join('\n') + (pageLabels ? '\n\nPages: ' + pageLabels.length : '');
}

function getFileIcon(type: string): string {
  if (type.includes('pdf')) return 'PDF';
  if (type.includes('word') || type.includes('docx')) return 'DOC';
  if (type.includes('json')) return 'JSON';
  if (type.includes('markdown') || type.includes('md')) return 'MD';
  return 'TXT';
}

export const KnowledgeBase = () => {
  const [content, setContent] = useState('');
  const [fileName, setFileName] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error' | null, message: string } | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setStatus(null);
    setIsUploading(true);
    setFileName(file.name);

    try {
      const buffer = await file.arrayBuffer();
      let text = '';

      if (file.name.endsWith('.docx')) {
        const result = await mammoth.extractRawText({ arrayBuffer: buffer });
        text = result.value;
      } else if (file.name.endsWith('.pdf')) {
        text = extractTextFromPDF(buffer);
      } else {
        text = new TextDecoder('utf-8').decode(buffer);
      }

      text = text.trim();
      if (!text || text.length < 20) {
        throw new Error('Could not extract enough text from this file (min 20 characters).');
      }

      setContent(text);

      const { error } = await supabase.functions.invoke('embed-document', {
        body: { content: text, source_type: 'file_upload', metadata: { source: 'file_upload', filename: file.name, file_type: file.type || file.name.split('.').pop() } }
      });

      if (error) throw error;

      setStatus({ type: 'success', message: `"${file.name}" added to knowledge base (${text.length} chars).` });
      setContent('');
      setFileName('');
    } catch (error: any) {
      setStatus({ type: 'error', message: error.message || 'Failed to process file.' });
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const handleTextUpload = async () => {
    if (!content.trim() || content.length < 20) {
      setStatus({ type: 'error', message: 'Content must be at least 20 characters long.' });
      return;
    }

    setIsUploading(true);
    setStatus(null);

    try {
      const { error } = await supabase.functions.invoke('embed-document', {
        body: { content, source_type: 'text', metadata: { source: 'manual_input' } }
      });

      if (error) throw error;

      setStatus({ type: 'success', message: 'Content added to the knowledge base!' });
      setContent('');
    } catch (error: any) {
      setStatus({ type: 'error', message: error.message || 'Failed to store content.' });
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
          Add expert context to the chatbot's knowledge base. Upload documents or paste text — the AI uses this to answer user questions.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* File upload */}
        <div className="flex items-center gap-4">
          <label className="cursor-pointer bg-emerald-50 hover:bg-emerald-100 border-2 border-dashed border-emerald-200 rounded-xl px-5 py-4 flex items-center gap-3 text-sm text-emerald-700 transition-colors flex-1">
            <Upload className="w-5 h-5" />
            <span>{isUploading ? 'Processing...' : 'Upload PDF, DOCX, TXT, MD, JSON'}</span>
            <input
              type="file"
              accept=".pdf,.docx,.txt,.md,.json,.csv"
              className="hidden"
              disabled={isUploading}
              onChange={handleFileUpload}
            />
          </label>
          {fileName && (
            <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-100 rounded-lg px-3 py-2">
              <File className="w-4 h-4" />
              {fileName}
            </div>
          )}
        </div>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-slate-200" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-white px-2 text-slate-400">or paste text</span>
          </div>
        </div>

        <Textarea
          placeholder="Paste text here (leaf identification tips, recipes, safety warnings, nutritional facts...)"
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
          onClick={handleTextUpload}
          disabled={isUploading || content.length < 20}
          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
        >
          {isUploading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Plus className="mr-2 h-4 w-4" />
          )}
          Add to Knowledge Base
        </Button>
      </CardContent>
    </Card>
  );
};
