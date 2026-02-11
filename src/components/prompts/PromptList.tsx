// ============================================
// [F045] src/components/prompts/PromptList.tsx
// ============================================

'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Prompt } from '@/lib/types';
import { PromptCard } from './PromptCard';
import { PromptCategoryFilter } from './PromptCategoryFilter';
import { Input } from '@/components/ui/input';
import { Search, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PromptListProps {
    prompts: Prompt[];
    loading?: boolean;
    editable?: boolean;
    selectable?: boolean;
    selectedIds?: string[];
    onEdit?: (prompt: Prompt) => void;
    onDelete?: (prompt: Prompt) => void;
    onPreview?: (prompt: Prompt) => void;
    onToggleActive?: (prompt: Prompt) => void;
    onSelect?: (prompt: Prompt) => void;
    onSearch?: (query: string) => void;
    className?: string;
}

export function PromptList({
    prompts, loading = false, editable = false, selectable = false,
    selectedIds = [], onEdit, onDelete, onPreview, onToggleActive,
    onSelect, onSearch, className
}: PromptListProps) {
    const t = useTranslations('prompts');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

    const filteredPrompts = prompts.filter(prompt => {
        if (selectedCategory && prompt.category !== selectedCategory) return false;
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            return (
                prompt.title_en.toLowerCase().includes(query) ||
                prompt.title_fa.includes(searchQuery) ||
                prompt.description_en.toLowerCase().includes(query) ||
                prompt.description_fa.includes(searchQuery)
            );
        }
        return true;
    });

    const handleSearchChange = (value: string) => {
        setSearchQuery(value);
        onSearch?.(value);
    };

    return (
        <div className={cn('space-y-4', className)}>
            <div className="space-y-3">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input placeholder={t('search_prompts')} value={searchQuery}
                        onChange={(e) => handleSearchChange(e.target.value)} className="pl-10" />
                </div>
                <PromptCategoryFilter selectedCategory={selectedCategory} onCategoryChange={setSelectedCategory} />
            </div>

            {loading && (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            )}

            {!loading && filteredPrompts.length === 0 && (
                <div className="text-center py-12">
                    <p className="text-muted-foreground">{t('no_prompts_found')}</p>
                </div>
            )}

            {!loading && filteredPrompts.length > 0 && (
                <div className="grid gap-4 md:grid-cols-2">
                    {filteredPrompts.map((prompt) => (
                        <PromptCard key={prompt.id} prompt={prompt} editable={editable}
                            selectable={selectable} selected={selectedIds.includes(prompt.id)}
                            onEdit={onEdit} onDelete={onDelete} onPreview={onPreview}
                            onToggleActive={onToggleActive} onSelect={onSelect} />
                    ))}
                </div>
            )}
        </div>
    );
}
