'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/badge';
import { FileText, Mail, FileStack } from 'lucide-react';

interface DocumentPreviewProps {
    cv: string;
    coverLetter: string;
    email: string;
}

export function DocumentPreview({ cv, coverLetter, email }: DocumentPreviewProps) {
    const t = useTranslations('application');

    const previewItems = [
        { id: 'cv', title: t('tailored_cv'), content: cv, icon: FileText },
        { id: 'cover_letter', title: t('cover_letter'), content: coverLetter, icon: Mail },
        { id: 'email', title: t('application_email'), content: email, icon: FileStack },
    ];

    return (
        <Tabs defaultValue="cv" className="w-full">
            <TabsList className="grid w-full grid-cols-3 h-12 bg-muted/50 p-1 mb-6">
                {previewItems.map((item) => (
                    <TabsTrigger
                        key={item.id}
                        value={item.id}
                        className="flex items-center gap-2 font-bold data-[state=active]:bg-background data-[state=active]:shadow-sm"
                    >
                        <item.icon className="h-4 w-4" />
                        <span className="hidden sm:inline">{item.title}</span>
                    </TabsTrigger>
                ))}
            </TabsList>

            {previewItems.map((item) => (
                <TabsContent key={item.id} value={item.id} className="mt-0 focus-visible:outline-none focus-visible:ring-0">
                    <Card className="border-2 shadow-lg bg-card/50 backdrop-blur-sm min-h-[500px]">
                        <CardHeader className="border-b bg-muted/10 py-4">
                            <CardTitle className="text-lg flex items-center justify-between">
                                {item.title}
                                <Badge variant="outline" className="font-mono text-[10px] uppercase">
                                    Preview Mode
                                </Badge>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-8 prose dark:prose-invert max-w-none whitespace-pre-wrap leading-relaxed">
                            {item.content || <div className="text-muted-foreground italic">No content generated yet.</div>}
                        </CardContent>
                    </Card>
                </TabsContent>
            ))}
        </Tabs>
    );
}
