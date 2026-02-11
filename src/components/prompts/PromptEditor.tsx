// ============================================
// [F046] src/components/prompts/PromptEditor.tsx
// ============================================

'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Prompt } from '@/lib/types';
import { PROMPT_CATEGORIES } from '@/lib/prompts/default-prompts';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2 } from 'lucide-react';

interface PromptEditorProps {
    prompt?: Prompt | null;
    open: boolean;
    onClose: () => void;
    onSave: (prompt: Omit<Prompt, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
}

const emptyPrompt = {
    title_en: '', title_fa: '', description_en: '', description_fa: '',
    prompt_text: '', category: 'general', is_active: true, sort_order: 0
};

export function PromptEditor({ prompt, open, onClose, onSave }: PromptEditorProps) {
    const t = useTranslations('prompts');
    const [formData, setFormData] = useState(emptyPrompt);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState<'en' | 'fa'>('en');

    useEffect(() => {
        if (prompt) {
            setFormData({
                title_en: prompt.title_en, title_fa: prompt.title_fa,
                description_en: prompt.description_en, description_fa: prompt.description_fa,
                prompt_text: prompt.prompt_text, category: prompt.category,
                is_active: prompt.is_active, sort_order: prompt.sort_order
            });
        } else {
            setFormData(emptyPrompt);
        }
    }, [prompt, open]);

    const handleChange = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async () => {
        if (!formData.title_en || !formData.title_fa || !formData.prompt_text) return;
        setSaving(true);
        try {
            await onSave(formData);
            onClose();
        } finally {
            setSaving(false);
        }
    };

    const isEditing = prompt !== null && prompt !== undefined;

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{isEditing ? t('edit_prompt') : t('create_prompt')}</DialogTitle>
                </DialogHeader>
                <div className="space-y-6 py-4">
                    <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'en' | 'fa')}>
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="en">English</TabsTrigger>
                            <TabsTrigger value="fa">فارسی</TabsTrigger>
                        </TabsList>
                        <TabsContent value="en" className="space-y-4 mt-4">
                            <div className="grid gap-2">
                                <Label htmlFor="title_en">{t('title_label')} (English) *</Label>
                                <Input id="title_en" value={formData.title_en} onChange={(e) => handleChange('title_en', e.target.value)} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="description_en">{t('description_label')} (English)</Label>
                                <Textarea id="description_en" value={formData.description_en} onChange={(e) => handleChange('description_en', e.target.value)} rows={2} />
                            </div>
                        </TabsContent>
                        <TabsContent value="fa" className="space-y-4 mt-4" dir="rtl">
                            <div className="grid gap-2">
                                <Label htmlFor="title_fa">{t('title_label')} (فارسی) *</Label>
                                <Input id="title_fa" value={formData.title_fa} onChange={(e) => handleChange('title_fa', e.target.value)} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="description_fa">{t('description_label')} (فارسی)</Label>
                                <Textarea id="description_fa" value={formData.description_fa} onChange={(e) => handleChange('description_fa', e.target.value)} rows={2} />
                            </div>
                        </TabsContent>
                    </Tabs>

                    <div className="grid gap-2">
                        <Label htmlFor="category">{t('category')}</Label>
                        <Select value={formData.category} onValueChange={(v) => handleChange('category', v)}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                {PROMPT_CATEGORIES.map((cat) => (
                                    <SelectItem key={cat.value} value={cat.value}>{cat.label_en} / {cat.label_fa}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="prompt_text">{t('prompt_text')} *</Label>
                        <Textarea id="prompt_text" value={formData.prompt_text} onChange={(e) => handleChange('prompt_text', e.target.value)} rows={12} className="font-mono text-sm" />
                        <p className="text-xs text-muted-foreground">{t('prompt_text_hint')}</p>
                    </div>

                    <div className="flex items-center justify-between">
                        <div>
                            <Label htmlFor="is_active">{t('active_status')}</Label>
                            <p className="text-sm text-muted-foreground">{t('active_status_hint')}</p>
                        </div>
                        <Switch id="is_active" checked={formData.is_active} onCheckedChange={(v) => handleChange('is_active', v)} />
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={saving}>{t('cancel')}</Button>
                    <Button onClick={handleSubmit} disabled={saving}>
                        {saving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />{t('saving')}</> : t('save')}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
