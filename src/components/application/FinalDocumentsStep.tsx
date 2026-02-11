'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { DocumentPreview } from './DocumentPreview';
import { DownloadPanel } from './DownloadPanel';
import { JobApplication } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { RefreshCcw, LayoutGrid } from 'lucide-react';

interface FinalDocumentsStepProps {
    application: JobApplication;
    isRTL?: boolean;
    onRegenerate?: () => void;
}

export function FinalDocumentsStep({
    application,
    isRTL = false,
    onRegenerate
}: FinalDocumentsStepProps) {
    const t = useTranslations('application');

    // Use edited_output if available, otherwise fallback to final_output
    const content = application.edited_output || application.final_output;

    if (!content) return null;

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Preview (2/3 width) */}
                <div className="lg:col-span-2 space-y-6">
                    <DocumentPreview
                        cvContent={content.tailored_cv}
                        coverLetterContent={content.cover_letter}
                        emailContent={content.application_email}
                        isRTL={isRTL}
                    />
                </div>

                {/* Sidebar Actions (1/3 width) */}
                <div className="space-y-6">
                    <div className="sticky top-24 space-y-6">
                        <div className="flex items-center gap-2 px-2 text-sm font-bold uppercase tracking-widest text-muted-foreground">
                            <LayoutGrid className="h-4 w-4" />
                            Export Options
                        </div>

                        <DownloadPanel
                            content={content.tailored_cv}
                            type="cv"
                            filename={`CV-${application.company_name}-${application.job_title}`}
                        />

                        <DownloadPanel
                            content={content.cover_letter}
                            type="cover_letter"
                            filename={`CoverLetter-${application.company_name}`}
                        />

                        <DownloadPanel
                            content={content.application_email}
                            type="email"
                            filename="ApplicationEmail"
                        />

                        <div className="pt-6 border-t border-dashed">
                            <Button
                                variant="ghost"
                                className="w-full text-muted-foreground hover:text-primary gap-2 h-12 rounded-xl"
                                onClick={onRegenerate}
                            >
                                <RefreshCcw className="h-4 w-4 transition-transform group-hover:rotate-180" />
                                {t('regenerate')}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
