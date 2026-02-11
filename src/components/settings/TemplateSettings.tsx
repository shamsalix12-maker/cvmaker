// ============================================
// [F168] src/components/settings/TemplateSettings.tsx
// ============================================

'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useTemplates } from '@/hooks/useTemplates';
import { Template } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TemplateList } from '@/components/templates/TemplateList';
import { TemplateUploader } from '@/components/templates/TemplateUploader';
import { FileText, Plus, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export function TemplateSettings() {
    const t = useTranslations('settings');
    const { templates, loading, deleteTemplate, fetchTemplates } = useTemplates();
    const [uploaderOpen, setUploaderOpen] = useState(false);

    const handleDelete = async (template: Template) => {
        if (confirm(t('confirm_delete_template', { name: template.template_name }))) {
            try {
                await deleteTemplate(template.id);
                toast.success(t('template_deleted'));
            } catch (err: any) {
                toast.error(err.message);
            }
        }
    };

    return (
        <>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold flex items-center gap-2">
                            <FileText className="h-6 w-6" />
                            {t('templates_title')}
                        </h2>
                        <p className="text-muted-foreground">{t('templates_description')}</p>
                    </div>
                    <Button onClick={() => setUploaderOpen(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        {t('upload_new_template')}
                    </Button>
                </div>

                <TemplateList
                    templates={templates}
                    loading={loading}
                    onDelete={handleDelete}
                />
            </div>

            <TemplateUploader
                open={uploaderOpen}
                onClose={() => setUploaderOpen(false)}
                onSuccess={() => {
                    fetchTemplates();
                    toast.success(t('template_uploaded'));
                }}
            />
        </>
    );
}
