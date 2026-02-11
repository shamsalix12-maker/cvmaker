'use client';

import { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Download, FileText, FileCode, Loader2, CheckCircle } from 'lucide-react';
import { DocumentType } from '@/lib/types';
import { toast } from 'sonner';

interface DownloadPanelProps {
    content: string;
    type: DocumentType;
    filename?: string;
}

export function DownloadPanel({ content, type, filename }: DownloadPanelProps) {
    const t = useTranslations('application');
    const locale = useLocale();
    const [downloading, setDownloading] = useState<string | null>(null);

    const handleDownload = async (format: 'docx' | 'md') => {
        if (!content) return;
        setDownloading(format);

        try {
            const apiPath = format === 'docx' ? '/api/export/docx' : '/api/export/markdown';
            const res = await fetch(apiPath, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    content,
                    type,
                    filename: filename || type,
                    locale
                })
            });

            if (!res.ok) throw new Error('Download failed');

            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename ? (filename.endsWith(`.${format}`) ? filename : `${filename}.${format}`) : `${type}.${format}`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            toast.success(t('download_all'), { icon: <CheckCircle className="text-green-500" /> });
        } catch (error) {
            console.error('Download error:', error);
            toast.error(t('error'));
        } finally {
            setDownloading(null);
        }
    };

    return (
        <Card className="border-2 border-primary/10 bg-muted/5 shadow-sm overflow-hidden">
            <CardContent className="p-4 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-primary/10 rounded-xl">
                        <Download className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                        <h3 className="font-bold text-lg">{t('download_ready')}</h3>
                        <p className="text-sm text-muted-foreground">{t('download_description')}</p>
                    </div>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <Button
                        variant="default"
                        size="lg"
                        className="flex-1 sm:flex-none h-12 font-bold px-6 shadow-md hover:shadow-lg transition-all"
                        disabled={!!downloading}
                        onClick={() => handleDownload('docx')}
                    >
                        {downloading === 'docx' ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <FileText className="mr-2 h-4 w-4" />
                        )}
                        {t('download_word')}
                    </Button>

                    <Button
                        variant="secondary"
                        size="lg"
                        className="flex-1 sm:flex-none h-12 font-bold px-6 shadow-sm hover:shadow-md transition-all"
                        disabled={!!downloading}
                        onClick={() => handleDownload('md')}
                    >
                        {downloading === 'md' ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <FileCode className="mr-2 h-4 w-4" />
                        )}
                        {t('download_markdown')}
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
