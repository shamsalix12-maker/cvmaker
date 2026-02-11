'use client';

import { useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FieldStatusBadgeProps {
    isComplete: boolean;
    size?: 'sm' | 'md';
    showText?: boolean;
    className?: string;
}

export function FieldStatusBadge({
    isComplete,
    size = 'sm',
    showText = true,
    className
}: FieldStatusBadgeProps) {
    const t = useTranslations('cv');

    const iconSize = size === 'sm' ? 'h-3 w-3' : 'h-4 w-4';

    if (isComplete) {
        return (
            <Badge
                variant="outline"
                className={cn(
                    'bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300',
                    className
                )}
            >
                <CheckCircle className={cn(iconSize, showText && 'mr-1')} />
                {showText && t('field_complete')}
            </Badge>
        );
    }

    return (
        <Badge
            variant="outline"
            className={cn(
                'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-950 dark:text-yellow-300',
                className
            )}
        >
            <AlertCircle className={cn(iconSize, showText && 'mr-1')} />
            {showText && t('field_incomplete')}
        </Badge>
    );
}
