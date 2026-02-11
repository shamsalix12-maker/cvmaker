'use client';

import React, { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useApplication } from '@/hooks/useApplication';
import { WizardProgress } from './WizardProgress';
import { JobDetailsStep } from './JobDetailsStep';
import { PromptSelectionStep } from './PromptSelectionStep';
import { AIConfigurationStep } from './AIConfigurationStep';
import { LanguageToneStep } from './LanguageToneStep';
import { TemplateSelectionStep } from './TemplateSelectionStep';
import { ProcessingStep } from './ProcessingStep';
import { EditorStep } from './EditorStep';
import { FinalDocumentsStep } from './FinalDocumentsStep';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, Save, Send, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { AISelection, FinalOutput } from '@/lib/types';

const STEPS = [
    { id: 'job', label: 'Job Details' },
    { id: 'prompts', label: 'Prompts' },
    { id: 'ai', label: 'AI Settings' },
    { id: 'options', label: 'Language & Tone' },
    { id: 'templates', label: 'Templates' },
    { id: 'process', label: 'Generate' },
    { id: 'edit', label: 'Review & Edit' },
    { id: 'final', label: 'Download' },
];

export function ApplicationWizard() {
    const t = useTranslations('application');
    const ct = useTranslations('common');
    const {
        application,
        loading,
        processing,
        createApplication,
        updateApplication,
        startProcessing,
        finalizeApplication,
        fetchApplication
    } = useApplication();

    const [currentStep, setCurrentStep] = useState(0);
    const [formData, setFormData] = useState({
        job_title: '',
        company_name: '',
        job_description: '',
        selected_prompt_ids: [] as string[],
        ai_selections: [] as AISelection[],
        output_language: 'en' as any,
        tone_setting: { mode: 'preset', preset_value: 'professional', custom_text: null } as any,
        selected_template_ids: { cv: null, cover_letter: null, email: null } as any,
    });

    // Sync form data with application once created
    useEffect(() => {
        if (application) {
            setFormData({
                job_title: application.job_title,
                company_name: application.company_name,
                job_description: application.job_description,
                selected_prompt_ids: application.selected_prompt_ids,
                ai_selections: application.ai_selections,
                output_language: application.output_language,
                tone_setting: application.tone_setting,
                selected_template_ids: application.selected_template_ids,
            });
        }
    }, [application]);

    const handleNext = async () => {
        if (currentStep === 0) {
            // First time: Create application
            if (!formData.job_description) {
                toast.error('Job description is required');
                return;
            }
            if (!application) {
                const newApp = await createApplication(formData);
                if (newApp) setCurrentStep(prev => prev + 1);
            } else {
                await updateApplication(formData);
                setCurrentStep(prev => prev + 1);
            }
        } else if (currentStep < STEPS.length - 1) {
            // Processing step (Step 5) requires manual trigger, but Next goes to Edit
            if (currentStep === 5) { // process
                if (application?.status !== 'draft_ready') {
                    toast.error('Please generate drafts first');
                    return;
                }
                // Transition to Finalize (Consolidation) before Edit
                const finalizedRes = await finalizeApplication();
                if (finalizedRes) setCurrentStep(prev => prev + 1);
                return;
            }

            // Just update and move next
            await updateApplication(formData);
            setCurrentStep(prev => prev + 1);
        }
    };

    const handleBack = () => {
        if (currentStep > 0) setCurrentStep(prev => prev - 1);
    };

    const renderStep = () => {
        switch (currentStep) {
            case 0:
                return <JobDetailsStep data={formData} onChange={(upd) => setFormData(p => ({ ...p, ...upd }))} />;
            case 1:
                return <PromptSelectionStep selectedIds={formData.selected_prompt_ids} onChange={(ids) => setFormData(p => ({ ...p, selected_prompt_ids: ids }))} />;
            case 2:
                return <AIConfigurationStep selections={formData.ai_selections} onChange={(sel) => setFormData(p => ({ ...p, ai_selections: sel }))} />;
            case 3:
                return <LanguageToneStep language={formData.output_language} tone={formData.tone_setting} onChange={(upd) => setFormData(p => ({ ...p, ...upd }))} />;
            case 4:
                return <TemplateSelectionStep selectedTemplateIds={formData.selected_template_ids} onChange={(upd) => setFormData(p => ({ ...p, ...upd }))} />;
            case 5:
                return application ? (
                    <ProcessingStep
                        application={application}
                        isProcessing={processing}
                        onStart={startProcessing}
                    />
                ) : null;
            case 6:
                return application ? (
                    <EditorStep
                        application={application}
                        onSave={(edited) => updateApplication({ edited_output: edited })}
                        onApprove={() => setCurrentStep(prev => prev + 1)}
                    />
                ) : null;
            case 7:
                return application ? (
                    <FinalDocumentsStep
                        application={application}
                        isRTL={application.output_language === 'fa'}
                        onRegenerate={() => {
                            setCurrentStep(5);
                            startProcessing();
                        }}
                    />
                ) : null;
            default:
                return null;
        }
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 min-h-screen">
            <div className="space-y-10">
                {/* Header Section */}
                <div className="text-center space-y-4">
                    <h1 className="text-4xl sm:text-5xl font-black tracking-tighter text-foreground bg-clip-text">
                        {t('new_title')}
                    </h1>
                    <p className="text-muted-foreground text-lg max-w-2xl mx-auto font-medium">
                        {t('page_subtitle')}
                    </p>
                </div>

                {/* Progress Bar */}
                <WizardProgress steps={STEPS} currentStep={currentStep} className="max-w-4xl mx-auto" />

                {/* Step Content Card */}
                <div className="bg-card/30 backdrop-blur-md border border-border/50 rounded-[40px] shadow-2xl p-8 sm:p-12 min-h-[600px] flex flex-col relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 h-32 w-32 bg-primary/5 rounded-bl-full pointer-events-none" />
                    <div className="absolute bottom-0 left-0 p-8 h-32 w-32 bg-primary/5 rounded-tr-full pointer-events-none" />

                    <div className="flex-1 relative z-10">
                        {renderStep()}
                    </div>

                    {/* Navigation Buttons */}
                    <div className="flex items-center justify-between pt-12 mt-auto border-t border-dashed relative z-10">
                        <Button
                            variant="ghost"
                            size="lg"
                            onClick={handleBack}
                            disabled={currentStep === 0 || processing || loading}
                            className="rounded-2xl h-14 px-8 font-bold gap-2 hover:bg-muted-foreground/10"
                        >
                            <ArrowLeft className="h-5 w-5" />
                            {ct('back')}
                        </Button>

                        <div className="flex gap-4">
                            {currentStep < 5 && (
                                <Button
                                    size="lg"
                                    onClick={handleNext}
                                    disabled={loading || processing}
                                    className="rounded-2xl h-14 px-10 font-black text-lg gap-2 shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all group"
                                >
                                    {loading ? (
                                        <div className="h-5 w-5 border-2 border-background border-t-transparent animate-spin rounded-full" />
                                    ) : (
                                        <>
                                            {currentStep === 0 ? ct('save') : ct('next')}
                                            <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                                        </>
                                    )}
                                </Button>
                            )}

                            {currentStep === 5 && application?.status === 'draft_ready' && (
                                <Button
                                    size="lg"
                                    onClick={handleNext}
                                    disabled={loading || processing}
                                    className="rounded-2xl h-14 px-10 font-black text-lg gap-2 shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all group bg-gradient-to-r from-primary to-primary/80"
                                >
                                    {processing ? (
                                        <div className="h-5 w-5 border-2 border-background border-t-transparent animate-spin rounded-full" />
                                    ) : (
                                        <>
                                            {t('approve_output')}
                                            <Sparkles className="h-5 w-5" />
                                        </>
                                    )}
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
