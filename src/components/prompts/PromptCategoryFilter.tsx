// ============================================
// [F048] src/components/prompts/PromptCategoryFilter.tsx
// ============================================

'use client';

import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { PROMPT_CATEGORIES } from '@/lib/prompts/default-prompts';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface PromptCategoryFilterProps {
    selectedCategory: string | null;
    onCategoryChange: (category: string | null) => void;
    className?: string;
}

export function PromptCategoryFilter({
    selectedCategory, onCategoryChange, className
}: PromptCategoryFilterProps) {
    const params = useParams();
    const locale = params.locale as 'en' | 'fa';
    const t = useTranslations('prompts');

    return (
        <div className={cn('flex flex-wrap gap-2', className)}>
            <Badge
                variant={selectedCategory === null ? 'default' : 'outline'}
                className="cursor-pointer"
                onClick={() => onCategoryChange(null)}
            >
                {t('all_categories')}
            </Badge>
            {PROMPT_CATEGORIES.map((cat) => (
                <Badge
                    key={cat.value}
                    variant={selectedCategory === cat.value ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => onCategoryChange(cat.value)}
                >
                    {locale === 'fa' ? cat.label_fa : cat.label_en}
                </Badge>
            ))}
        </div>
    );
}
