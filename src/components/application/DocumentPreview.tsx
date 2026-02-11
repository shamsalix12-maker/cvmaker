'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/badge';
import { FileText, Mail, FileStack } from 'lucide-react';

interface Props {
    cvContent: string;
    coverLetterContent: string;
    emailContent: string;
    isRTL?: boolean;
}

export function DocumentPreview({ cvContent, coverLetterContent, emailContent, isRTL = false }: Props) {
    const t = useTranslations('application');
    const items = [
        { id: 'cv', title: t('tailored_cv'), content: cvContent, icon: FileText },
        { id: 'cover_letter', title: t('cover_letter'), content: coverLetterContent, icon: Mail },
        { id: 'email', title: t('application_email'), content: emailContent, icon: FileStack },
    ];

    return (
        <Tabs defaultValue="cv" className="w-full">
            <TabsList className="grid w-full grid-cols-3 h-12 bg-muted/50 p-1 mb-6">
                {items.map((item) => (
                    <TabsTrigger key={item.id} value={item.id} className="flex items-center gap-2 font-bold focus-visible:ring-0">
                        <item.icon className="h-4 w-4" />
                        <span className="hidden sm:inline">{item.title}</span>
                    </TabsTrigger>
                ))}
            </TabsList>
            {items.map((item) => (
                <TabsContent key={item.id} value={item.id} className="mt-0 outline-none">
                    <Card className="border-2 shadow-2xl bg-card/60 backdrop-blur-xl min-h-[600px] overflow-hidden rounded-[32px]">
                        <CardHeader className="border-b bg-muted/20 py-5 px-8">
                            <CardTitle className="text-xl flex items-center justify-between">
                                {item.title}
                                <Badge variant="secondary" className="font-mono text-[10px] uppercase">PREVIEW</Badge>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className={`p-10 prose prose-slate dark:prose-invert max-w-none whitespace-pre-wrap leading-relaxed ${isRTL ? 'text-right' : 'text-left'}`} dir={isRTL ? 'rtl' : 'ltr'}>
                            {item.content || <div className="text-muted-foreground italic py-20 text-center">No content available.</div>}
                        </CardContent>
                    </Card>
                </TabsContent>
            ))}
        </Tabs>
    );
}
