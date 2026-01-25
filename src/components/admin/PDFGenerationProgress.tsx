import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Loader2, CheckCircle2, Image as ImageIcon, FileText, Upload } from 'lucide-react';

export interface PDFGenerationStep {
    id: string;
    label: string;
    status: 'pending' | 'active' | 'complete';
}

interface PDFGenerationProgressProps {
    isOpen: boolean;
    progress: number;
    currentStep: string;
    steps: PDFGenerationStep[];
}

export const PDFGenerationProgress: React.FC<PDFGenerationProgressProps> = ({
    isOpen,
    progress,
    currentStep,
    steps
}) => {
    const getStepIcon = (step: PDFGenerationStep) => {
        const iconClass = "w-4 h-4";

        if (step.status === 'complete') {
            return <CheckCircle2 className={`${iconClass} text-emerald-500`} />;
        }
        if (step.status === 'active') {
            return <Loader2 className={`${iconClass} text-emerald-600 animate-spin`} />;
        }
        return <div className={`${iconClass} rounded-full border-2 border-slate-300`} />;
    };

    const getStepLabelIcon = (stepId: string) => {
        const iconClass = "w-4 h-4 mr-2 inline";
        switch (stepId) {
            case 'images':
                return <ImageIcon className={iconClass} />;
            case 'pages':
                return <FileText className={iconClass} />;
            case 'upload':
                return <Upload className={iconClass} />;
            default:
                return null;
        }
    };

    return (
        <Dialog open={isOpen} modal>
            <DialogContent
                className="sm:max-w-md"
                onPointerDownOutside={(e) => e.preventDefault()}
                onEscapeKeyDown={(e) => e.preventDefault()}
            >
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-emerald-700">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Generating Your Cookbook
                    </DialogTitle>
                    <div className="sr-only">
                        please wait while your PDF is being generated.
                    </div>
                </DialogHeader>

                <div className="py-6 space-y-6">
                    {/* Progress Bar */}
                    <div className="space-y-2">
                        <div className="flex justify-between text-sm text-slate-600">
                            <span>{currentStep}</span>
                            <span className="font-medium">{Math.round(progress)}%</span>
                        </div>
                        <Progress value={progress} className="h-3" />
                    </div>

                    {/* Step Indicators */}
                    <div className="space-y-3">
                        {steps.map((step) => (
                            <div
                                key={step.id}
                                className={`flex items-center gap-3 p-2 rounded-lg transition-colors ${step.status === 'active'
                                    ? 'bg-emerald-50 border border-emerald-200'
                                    : step.status === 'complete'
                                        ? 'bg-slate-50'
                                        : 'opacity-50'
                                    }`}
                            >
                                {getStepIcon(step)}
                                <span className={`text-sm ${step.status === 'active' ? 'text-emerald-700 font-medium' : 'text-slate-600'
                                    }`}>
                                    {getStepLabelIcon(step.id)}
                                    {step.label}
                                </span>
                            </div>
                        ))}
                    </div>

                    {/* Helpful tip */}
                    <p className="text-xs text-center text-slate-500">
                        Please wait while we create your beautiful PDF cookbook...
                    </p>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default PDFGenerationProgress;
