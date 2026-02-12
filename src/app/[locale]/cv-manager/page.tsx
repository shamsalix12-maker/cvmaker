'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { CVUploader } from '@/components/cv/CVUploader';
import { CVFieldDisplay } from '@/components/cv/CVFieldDisplay';
import { CVCompletionForm } from '@/components/cv/CVCompletionForm';
import { CVPreview } from '@/components/cv/CVPreview';
import { CVManagerTabs } from '@/components/cv/CVManagerTabs';
import { useCV } from '@/hooks/useCV';
import { CVSectionEditor } from '@/components/cv/CVSectionEditor';
import { ManualEntryModal } from '@/components/cv/ManualEntryModal';
import {
    FileText, Save, Trash2, CheckCircle, AlertCircle, Loader2, Brain, Sparkles
} from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { MainLayout } from '@/components/layout/MainLayout';
import { toast } from 'sonner';
import { CVExtractionResult, ComprehensiveCV, CVSection } from '@/lib/types';

type CVTab = 'upload' | 'fields' | 'preview';

export default function CVManagerPage() {
    const t = useTranslations('cv_manager');
    const params = useParams();
    const locale = params.locale as 'en' | 'fa';

    const {
        cv,
        loading,
        saving,
        error,
        fieldStatuses,
        completionPercentage,
        saveCV,
        updateCV,
        deleteCV,
        applyExtraction,
        refineCV
    } = useCV();

    const [activeTab, setActiveTab] = useState<CVTab>('upload');
    const [pendingExtraction, setPendingExtraction] = useState<CVExtractionResult | null>(null);
    const [aiFeedback, setAiFeedback] = useState<string | null>(null);
    const [refineInstructions, setRefineInstructions] = useState('');
    const [isRefining, setIsRefining] = useState(false);
    const [isManualModalOpen, setIsManualModalOpen] = useState(false);

    // Editor State
    const [editingSection, setEditingSection] = useState<CVSection | null>(null);

    // Switch to fields tab when CV is loaded or extracted
    useEffect(() => {
        if (cv && activeTab === 'upload') {
            setActiveTab('fields');
        }
    }, [cv, activeTab]);

    // Handle refinement
    const handleRefine = async () => {
        if (!cv) return;

        setIsRefining(true);
        try {
            const result = await refineCV(refineInstructions);

            if (result.success) {
                await applyExtraction(result);
                setAiFeedback(result.extractionNotes || null);
                setRefineInstructions('');

                toast.success(t('refinement_success'), {
                    description: t('refinement_success_desc'),
                });
            } else {
                throw new Error(result.extractionNotes || 'Refinement failed');
            }
        } catch (err: any) {
            toast.error(t('refinement_error'), {
                description: err.message,
            });
        } finally {
            setIsRefining(false);
        }
    };

    // Handle extraction complete
    const handleExtractionComplete = async (result: CVExtractionResult) => {
        setPendingExtraction(result);
        if (result.extractionNotes) {
            setAiFeedback(result.extractionNotes);
        }

        try {
            await applyExtraction(result);

            toast.success(t('extraction_success'), {
                description: t('extraction_success_desc'),
            });

            setActiveTab('fields');

        } catch (err: any) {
            toast.error(t('extraction_error'), {
                description: err.message,
            });
        } finally {
            setPendingExtraction(null);
        }
    };

    // Handle CV update from field display
    const handleCVUpdate = async (updates: Partial<ComprehensiveCV>) => {
        try {
            await updateCV(updates);

            toast.success(t('saved'), {
                description: t('changes_saved'),
            });

        } catch (err: any) {
            toast.error(t('save_error'), {
                description: err.message,
            });
        }
    };

    // Handle delete CV
    const handleDeleteCV = async () => {
        if (!confirm(t('delete_confirm'))) return;

        try {
            await deleteCV();
            setActiveTab('upload');
            setAiFeedback(null);

            toast.success(t('deleted'), {
                description: t('cv_deleted'),
            });

        } catch (err: any) {
            toast.error(t('delete_error'), {
                description: err.message,
            });
        }
    };

    // Get incomplete fields
    const incompleteFields = fieldStatuses.filter(s => !s.is_complete);

    const handleManualStart = () => {
        setPendingExtraction(null);
        setAiFeedback(null);
        setIsManualModalOpen(true);
    };

    const handleManualConfirm = async (rawText: string) => {
        try {
            await updateCV({
                personal_info: {
                    full_name: '',
                    email: '',
                    phone: '',
                    location: '',
                    linkedin_url: '',
                    website_url: '',
                    summary: ''
                },
                work_experience: [],
                education: [],
                skills: [],
                projects: [],
                certifications: [],
                languages: [],
                additional_sections: [],
                raw_text: rawText
            });
            toast.success(t('changes_saved'));
            setActiveTab('fields');
        } catch (err) {
            toast.error(t('save_error'));
        }
    };

    return (
        <AuthGuard>
            <MainLayout>
                <div className="container mx-auto p-6 max-w-5xl">
                    {/* Header */}
                    <div className="mb-6">
                        <h1 className="text-2xl font-bold flex items-center gap-2">
                            <FileText className="h-6 w-6" />
                            {t('title')}
                        </h1>
                        <p className="text-muted-foreground mt-1">
                            {t('description')}
                        </p>
                    </div>

                    {/* Error Display */}
                    {error && (
                        <Card className="mb-6 border-destructive">
                            <CardContent className="py-4">
                                <div className="flex items-center gap-2 text-destructive">
                                    <AlertCircle className="h-5 w-5" />
                                    <span>{error}</span>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Loading State */}
                    {loading ? (
                        <Card>
                            <CardContent className="py-12">
                                <div className="flex flex-col items-center justify-center gap-3">
                                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                                    <p className="text-muted-foreground">{t('loading')}</p>
                                </div>
                            </CardContent>
                        </Card>
                    ) : (
                        <>
                            {/* Tab Navigation */}
                            <CVManagerTabs
                                activeTab={activeTab}
                                onTabChange={setActiveTab}
                                hasCV={cv !== null}
                                completionPercentage={completionPercentage}
                                disabled={saving}
                                className="mb-6"
                            />

                            {/* Tab Content */}
                            <div className="space-y-6">

                                {/* Upload Tab */}
                                {activeTab === 'upload' && (
                                    <CVUploader
                                        onExtractionComplete={handleExtractionComplete}
                                        existingCV={cv}
                                        disabled={saving}
                                        allowReupload={!!cv}
                                        onManualStart={handleManualStart}
                                    />
                                )}

                                {/* Refinement Tab / Section */}
                                {activeTab === 'fields' && cv && (
                                    <div className="space-y-6">
                                        {/* AI Feedback / Notes */}
                                        {aiFeedback && (
                                            <Card className="bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-900">
                                                <CardHeader className="pb-2">
                                                    <CardTitle className="text-sm font-semibold flex items-center gap-2 text-blue-800 dark:text-blue-300">
                                                        <Brain className="h-4 w-4" />
                                                        {t('ai_feedback')}
                                                    </CardTitle>
                                                </CardHeader>
                                                <CardContent>
                                                    <p className="text-sm text-blue-700 dark:text-blue-400 whitespace-pre-wrap italic">
                                                        "{aiFeedback}"
                                                    </p>
                                                </CardContent>
                                            </Card>
                                        )}

                                        {/* Incomplete Fields Warning */}
                                        {incompleteFields.length > 0 && (
                                            <CVCompletionForm
                                                incompleteFields={incompleteFields}
                                                onFieldClick={(section) => {
                                                    setEditingSection(section as CVSection);
                                                }}
                                            />
                                        )}

                                        {/* AI Refinement Tool */}
                                        <Card className="border-primary/20 bg-primary/5">
                                            <CardHeader className="pb-3">
                                                <CardTitle className="text-lg flex items-center gap-2">
                                                    <Sparkles className="h-5 w-5 text-primary" />
                                                    {t('ai_refinement_title')}
                                                </CardTitle>
                                                <CardDescription>
                                                    {t('ai_refinement_desc')}
                                                </CardDescription>
                                            </CardHeader>
                                            <CardContent className="space-y-4">
                                                <Textarea
                                                    placeholder={t('refine_placeholder')}
                                                    value={refineInstructions}
                                                    onChange={(e) => setRefineInstructions(e.target.value)}
                                                    rows={3}
                                                    disabled={isRefining}
                                                />
                                                <Button
                                                    className="w-full"
                                                    onClick={handleRefine}
                                                    disabled={isRefining || saving}
                                                >
                                                    {isRefining ? (
                                                        <>
                                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                            {t('refining')}
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Sparkles className="h-4 w-4 mr-2" />
                                                            {t('refine_button')}
                                                        </>
                                                    )}
                                                </Button>
                                            </CardContent>
                                        </Card>

                                        {/* Field Display */}
                                        <CVFieldDisplay
                                            cv={cv}
                                            fieldStatuses={fieldStatuses}
                                            confidence={pendingExtraction?.confidence || 85}
                                            onUpdate={handleCVUpdate}
                                            onEditSection={(section) => setEditingSection(section as CVSection)}
                                        />

                                        {/* Section Editor */}
                                        {cv && editingSection && (
                                            <CVSectionEditor
                                                cv={cv}
                                                section={editingSection}
                                                isOpen={!!editingSection}
                                                onClose={() => setEditingSection(null)}
                                                onSave={handleCVUpdate}
                                            />
                                        )}

                                        <ManualEntryModal
                                            isOpen={isManualModalOpen}
                                            onClose={() => setIsManualModalOpen(false)}
                                            onConfirm={handleManualConfirm}
                                        />
                                    </div>
                                )}

                                {/* Preview Tab */}
                                {activeTab === 'preview' && cv && (
                                    <CVPreview
                                        cv={cv}
                                        locale={locale}
                                    />
                                )}

                            </div>

                            {/* Action Bar */}
                            {cv && activeTab !== 'upload' && (
                                <div className="mt-8 flex items-center justify-between border-t pt-6">
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <CheckCircle className={cn(
                                            'h-4 w-4',
                                            completionPercentage === 100 ? 'text-green-500' : 'text-yellow-500'
                                        )} />
                                        <span>
                                            {t('completion', { percent: completionPercentage })}
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <Button
                                            variant="outline"
                                            onClick={handleDeleteCV}
                                            disabled={saving}
                                        >
                                            <Trash2 className="h-4 w-4 mr-2" />
                                            {t('delete_cv')}
                                        </Button>

                                        <Button
                                            onClick={() => saveCV(cv)}
                                            disabled={saving}
                                        >
                                            {saving ? (
                                                <>
                                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                    {t('saving')}
                                                </>
                                            ) : (
                                                <>
                                                    <Save className="h-4 w-4 mr-2" />
                                                    {t('save_cv')}
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </MainLayout>
        </AuthGuard>
    );
}
