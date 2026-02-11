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
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { CVExtractionResult, ComprehensiveCV, CVSection } from '@/lib/types';
import {
    FileText, Save, Trash2, CheckCircle, AlertCircle, Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { MainLayout } from '@/components/layout/MainLayout';

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
        applyExtraction
    } = useCV();

    const [activeTab, setActiveTab] = useState<CVTab>('upload');
    const [pendingExtraction, setPendingExtraction] = useState<CVExtractionResult | null>(null);

    // Switch to fields tab when CV is loaded or extracted
    useEffect(() => {
        if (cv && activeTab === 'upload') {
            setActiveTab('fields');
        }
    }, [cv, activeTab]);

    // Handle extraction complete
    const handleExtractionComplete = async (result: CVExtractionResult) => {
        setPendingExtraction(result);

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
                                    />
                                )}

                                {/* Fields Tab */}
                                {activeTab === 'fields' && cv && (
                                    <>
                                        {/* Incomplete Fields Warning */}
                                        {incompleteFields.length > 0 && (
                                            <CVCompletionForm
                                                incompleteFields={incompleteFields}
                                                onFieldClick={(section) => {
                                                    // In a real implementation this would focus the field
                                                    console.log('Navigate to section:', section);
                                                    // For now we just tell the user where to look
                                                    toast.info(`Please check the ${section.replace('_', ' ')} section below`);
                                                }}
                                            />
                                        )}

                                        {/* Field Display */}
                                        <CVFieldDisplay
                                            cv={cv}
                                            fieldStatuses={fieldStatuses}
                                            confidence={pendingExtraction?.confidence || 85}
                                            onUpdate={handleCVUpdate}
                                        />
                                    </>
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
