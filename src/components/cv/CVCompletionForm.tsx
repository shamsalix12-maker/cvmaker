'use client';

import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ChevronRight, CheckCircle, AlertTriangle } from 'lucide-react';
import { CVFieldStatus, CVSection } from '@/lib/types';
import { cn } from '@/lib/utils';

interface CVCompletionFormProps {
    incompleteFields: CVFieldStatus[];
    onFieldClick: (section: string) => void;
    className?: string;
}

export function CVCompletionForm({
    incompleteFields,
    onFieldClick,
    className
}: CVCompletionFormProps) {
    const t = useTranslations('cv');

    // Calculate distinct sections that need attention
    const sectionsToUpdate = Array.from(new Set(incompleteFields.map(f => {
        // Determine section from field path (rough heuristic)
        const path = f.field_path.split('.')[0] as CVSection;
        return path;
    }))).filter(Boolean);

    if (incompleteFields.length === 0) {
        return (
            <Card className={cn("bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-900", className)}>
                <CardContent className="pt-6 flex items-center gap-4">
                    <div className="bg-green-100 p-2 rounded-full text-green-600 dark:bg-green-900 dark:text-green-300">
                        <CheckCircle className="h-6 w-6" />
                    </div>
                    <div>
                        <h3 className="font-medium text-green-900 dark:text-green-300">
                            {t('field_complete')}
                        </h3>
                        <p className="text-sm text-green-700 dark:text-green-400">
                            {t('saved_successfully')}
                        </p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className={cn("border-l-4 border-l-yellow-500", className)}>
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-yellow-500" />
                        {t('incomplete_fields')}
                    </CardTitle>
                    <span className="text-sm font-medium text-muted-foreground">
                        {incompleteFields.length} {t('field_incomplete')}
                    </span>
                </div>
                <CardDescription>
                    {t('please_complete')}
                </CardDescription>
            </CardHeader>

            <CardContent>
                <div className="space-y-4">
                    <div className="space-y-2">
                        <div className="flex justify-between text-xs text-muted-foreground">
                            <span>{t('completion', { percent: Math.round(100 - (incompleteFields.length * 5)) })}</span>
                            {/* Rough estimate above, actual percentage should come from hook */}
                        </div>
                        <Progress value={Math.max(10, 100 - (incompleteFields.length * 10))} className="h-2" />
                    </div>

                    <div className="grid gap-2 sm:grid-cols-2">
                        {sectionsToUpdate.map(section => (
                            <Button
                                key={section}
                                variant="outline"
                                className="justify-between group h-auto py-3 px-4"
                                onClick={() => onFieldClick(section)}
                            >
                                <div className="flex flex-col items-start gap-1">
                                    <span className="font-medium capitalize">{section.replace('_', ' ')}</span>
                                    <span className="text-xs text-muted-foreground">
                                        {incompleteFields.filter(f => f.field_path.startsWith(section)).length} fields missing
                                    </span>
                                </div>
                                <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                            </Button>
                        ))}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
