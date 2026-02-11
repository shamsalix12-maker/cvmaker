'use client';

import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { Sparkles } from 'lucide-react';

interface ConfidenceIndicatorProps {
    confidence: number;  // 0-100
    className?: string;
}

export function ConfidenceIndicator({ confidence, className }: ConfidenceIndicatorProps) {
    const t = useTranslations('cv');

    const getColor = () => {
        if (confidence >= 80) return 'text-green-600 bg-green-100';
        if (confidence >= 60) return 'text-yellow-600 bg-yellow-100';
        return 'text-red-600 bg-red-100';
    };

    const getLabel = () => {
        if (confidence >= 80) return 'High'; // Fallback until key is added
        if (confidence >= 60) return 'Medium';
        return 'Low';
    };

    return (
        <div className={cn('flex items-center gap-2', className)}>
            <div className={cn(
                'flex items-center gap-1.5 px-2 py-1 rounded-full text-sm font-medium',
                getColor()
            )}>
                <Sparkles className="h-3.5 w-3.5" />
                <span>{confidence}%</span>
            </div>
            <span className="text-xs text-muted-foreground">
                AI Confidence: {getLabel()}
            </span>
        </div>
    );
}
