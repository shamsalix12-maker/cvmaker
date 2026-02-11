// ============================================
// [F015] src/app/[locale]/prompts/page.tsx
// ============================================

'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { usePrompts } from '@/hooks/usePrompts';
import { PromptList } from '@/components/prompts/PromptList';
import { PromptEditor } from '@/components/prompts/PromptEditor';
import { PromptPreview } from '@/components/prompts/PromptPreview';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel,
    AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
    AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Prompt } from '@/lib/types';
import { FileText, Plus, Loader2 } from 'lucide-react';

export default function PromptsPage() {
    const t = useTranslations('prompts');
    const {
        prompts, loading, error,
        createPrompt, updatePrompt, deletePrompt, togglePromptActive
    } = usePrompts();

    const [editorOpen, setEditorOpen] = useState(false);
    const [editingPrompt, setEditingPrompt] = useState<Prompt | null>(null);
    const [previewPrompt, setPreviewPrompt] = useState<Prompt | null>(null);
    const [deletingPrompt, setDeletingPrompt] = useState<Prompt | null>(null);
    const [actionLoading, setActionLoading] = useState(false);

    const handleCreate = () => { setEditingPrompt(null); setEditorOpen(true); };
    const handleEdit = (prompt: Prompt) => { setEditingPrompt(prompt); setEditorOpen(true); };

    const handleSave = async (data: Omit<Prompt, 'id' | 'created_at' | 'updated_at'>) => {
        try {
            if (editingPrompt) {
                await updatePrompt(editingPrompt.id, data);
                toast.success(t('prompt_updated'));
            } else {
                await createPrompt(data);
                toast.success(t('prompt_created'));
            }
        } catch (err: any) {
            toast.error(t('save_error'), { description: err.message });
            throw err;
        }
    };

    const handleDelete = async () => {
        if (!deletingPrompt) return;
        setActionLoading(true);
        try {
            await deletePrompt(deletingPrompt.id);
            toast.success(t('prompt_deleted'));
            setDeletingPrompt(null);
        } catch (err: any) {
            toast.error(t('delete_error'), { description: err.message });
        } finally {
            setActionLoading(false);
        }
    };

    const handleToggleActive = async (prompt: Prompt) => {
        try {
            await togglePromptActive(prompt.id);
            toast.success(prompt.is_active ? t('prompt_deactivated') : t('prompt_activated'));
        } catch (err: any) {
            toast.error(t('toggle_error'), { description: err.message });
        }
    };

    return (
        <AuthGuard>
            <div className="container mx-auto p-6 max-w-5xl">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl font-bold flex items-center gap-2">
                            <FileText className="h-6 w-6" />{t('title')}
                        </h1>
                        <p className="text-muted-foreground mt-1">{t('description')}</p>
                    </div>
                    <Button onClick={handleCreate}>
                        <Plus className="h-4 w-4 mr-2" />{t('create_prompt')}
                    </Button>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-destructive/10 text-destructive rounded-lg">{error}</div>
                )}

                <PromptList prompts={prompts} loading={loading} editable
                    onEdit={handleEdit} onDelete={setDeletingPrompt}
                    onPreview={setPreviewPrompt} onToggleActive={handleToggleActive} />

                <PromptEditor prompt={editingPrompt} open={editorOpen}
                    onClose={() => { setEditorOpen(false); setEditingPrompt(null); }}
                    onSave={handleSave} />

                <PromptPreview prompt={previewPrompt} open={previewPrompt !== null}
                    onClose={() => setPreviewPrompt(null)} />

                <AlertDialog open={deletingPrompt !== null} onOpenChange={() => setDeletingPrompt(null)}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>{t('delete_confirm_title')}</AlertDialogTitle>
                            <AlertDialogDescription>
                                {t('delete_confirm_description', { title: deletingPrompt?.title_en ?? '' })}
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel disabled={actionLoading}>{t('cancel')}</AlertDialogCancel>
                            <AlertDialogAction onClick={handleDelete} disabled={actionLoading}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : t('delete')}
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        </AuthGuard>
    );
}
