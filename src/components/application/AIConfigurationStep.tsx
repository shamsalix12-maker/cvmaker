'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { AIMultiDraftPanel } from '@/components/ai/AIMultiDraftPanel';
import { AISelection } from '@/lib/types';

interface AIConfigurationStepProps {
    selections: AISelection[];
    onChange: (selections: AISelection[]) => void;
}

export function AIConfigurationStep({ selections, onChange }: AIConfigurationStepProps) {
    const t = useTranslations('application');

    return (
        <div className="space-y-6">
            <div className="px-2">
                <h2 className="text-3xl font-black tracking-tighter">{t('select_ai')}</h2>
                <p className="text-muted-foreground text-lg">{t('select_ai_help')}</p>
            </div>

            <AIMultiDraftPanel
                selectedAI={selections}
                onSelectionChange={onChange}
                // These are handled in the Processing step
                onGenerateDrafts={() => { }}
                onConsolidate={() => { }}
                drafts={[]}
                isGenerating={false}
                isConsolidating={false}
            />
        </div>
    );
}
