// ============================================
// [F060] src/components/templates/TemplateUploader.tsx
// ============================================

'use client';

import { useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useTemplates } from '@/hooks/useTemplates';
import { TemplateType, FileFormat } from '@/lib/types';
import { parseFile } from '@/lib/parsers';
import { validateTemplate } from '@/lib/templates';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { FileDropZone } from '@/components/cv/FileDropZone';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertCircle, CheckCircle } from 'lucide-react';

interface TemplateUploaderProps {
    open: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

export function TemplateUploader({ open, onClose, onSuccess }: TemplateUploaderProps) {
    const t = useTranslations('templates');
    const { createTemplate } = useTemplates();

    const [name, setName] = useState('');
    const [type, setType] = useState<TemplateType>('cv');
    const [content, setContent] = useState('');
    const [format, setFormat] = useState<FileFormat>('md');
    const [errors, setErrors] = useState<string[]>([]);
    const [saving, setSaving] = useState(false);

    const handleFileSelect = useCallback(async (file: File) => {
        try {
            const parsed = await parseFile(file);
            setContent(parsed.text);

            // Detect format
            const ext = file.name.split('.').pop()?.toLowerCase();
            setFormat(ext === 'docx' ? 'docx' : 'md');

            // Use filename as template name if not set
            if (!name) {
                setName(file.name.replace(/\.[^/.]+$/, ''));
            }

            // Validate
            const validation = validateTemplate(parsed.text);
            setErrors(validation.errors);

        } catch (err: any) {
            setErrors([err.message]);
        }
    }, [name]);

    const handleSave = async () => {
        if (!name || !content) return;

        setSaving(true);
        try {
            await createTemplate({
                template_name: name,
                template_type: type,
                file_format: format,
                file_content: content
            });

            onSuccess?.();
            onClose();

            // Reset form
            setName('');
            setContent('');
            setErrors([]);

        } catch (err: any) {
            setErrors([err.message]);
        } finally {
            setSaving(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle>{t('upload_template')}</DialogTitle>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="grid gap-2">
                        <Label>{t('template_name')}</Label>
                        <Input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder={t('template_name_placeholder')}
                        />
                    </div>

                    <div className="grid gap-2">
                        <Label>{t('template_type')}</Label>
                        <Select value={type} onValueChange={(v) => setType(v as TemplateType)}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="cv">{t('type_cv')}</SelectItem>
                                <SelectItem value="cover_letter">{t('type_cover_letter')}</SelectItem>
                                <SelectItem value="email">{t('type_email')}</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid gap-2">
                        <Label>{t('upload_file')}</Label>
                        <FileDropZone
                            onFileSelect={handleFileSelect}
                            acceptedTypes={['.docx', '.md', '.txt']}
                        />
                    </div>

                    {content && errors.length === 0 && (
                        <Alert className="bg-green-50 border-green-200">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            <AlertDescription className="text-green-700">
                                {t('template_valid')}
                            </AlertDescription>
                        </Alert>
                    )}

                    {errors.length > 0 && (
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>
                                {errors.map((e, i) => <div key={i}>{e}</div>)}
                            </AlertDescription>
                        </Alert>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={saving}>
                        {t('cancel')}
                    </Button>
                    <Button
                        onClick={handleSave}
                        disabled={!name || !content || errors.length > 0 || saving}
                    >
                        {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                        {t('save')}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
