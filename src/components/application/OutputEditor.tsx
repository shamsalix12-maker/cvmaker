'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { useTranslations, useLocale } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Bold, Italic, Heading1, Heading2, List, ListOrdered, Undo, Redo, CheckCircle2, Save, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';

interface Props {
    initialContent: string; onSave: (c: string) => void; onApprove: (c: string) => void;
    isSaving?: boolean; isApproving?: boolean; title?: string;
}

export function OutputEditor({ initialContent, onSave, onApprove, isSaving, isApproving, title }: Props) {
    const t = useTranslations('editor'), locale = useLocale(), isRtl = locale === 'fa';
    const [lastSaved, setLastSaved] = useState<string | null>(null);
    const editor = useEditor({
        extensions: [StarterKit, Placeholder.configure({ placeholder: t('placeholder') })],
        content: initialContent,
        editorProps: {
            attributes: {
                class: `prose dark:prose-invert focus:outline-none max-w-none min-h-[400px] p-4 ${isRtl ? 'text-right' : 'text-left'}`,
                dir: isRtl ? 'rtl' : 'ltr'
            }
        }
    });

    useEffect(() => { if (editor && initialContent) editor.commands.setContent(initialContent); }, [initialContent, editor]);
    if (!editor) return null;

    const Btn = ({ onClick, isActive, icon: Icon, label }: any) => (
        <Button variant={isActive ? "default" : "ghost"} size="sm" onClick={onClick} title={label} className="h-8 w-8 p-0">
            <Icon className="h-4 w-4" />
        </Button>
    );

    return (
        <Card className="border-2 shadow-xl bg-card/50 backdrop-blur-sm overflow-hidden">
            <CardHeader className="bg-muted/30 border-b py-4">
                <div className="flex items-center justify-between">
                    <div><CardTitle className="text-xl font-black">{title || t('title')}</CardTitle><CardDescription>{t('description')}</CardDescription></div>
                    {lastSaved && <span className="text-[10px] text-muted-foreground font-mono">{t('last_saved', { time: lastSaved })}</span>}
                </div>
            </CardHeader>
            <div className="bg-muted/10 border-b p-2 flex flex-wrap gap-1 items-center sticky top-0 z-10 backdrop-blur-md">
                <Btn onClick={() => editor.chain().focus().toggleBold().run()} isActive={editor.isActive('bold')} icon={Bold} label={t('bold')} />
                <Btn onClick={() => editor.chain().focus().toggleItalic().run()} isActive={editor.isActive('italic')} icon={Italic} label={t('italic')} />
                <Separator orientation="vertical" className="mx-1 h-6" />
                <Btn onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} isActive={editor.isActive('heading', { level: 1 })} icon={Heading1} label={t('heading1')} />
                <Btn onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} isActive={editor.isActive('heading', { level: 2 })} icon={Heading2} label={t('heading2')} />
                <Separator orientation="vertical" className="mx-1 h-6" />
                <Btn onClick={() => editor.chain().focus().toggleBulletList().run()} isActive={editor.isActive('bulletList')} icon={List} label={t('bullet_list')} />
                <Btn onClick={() => editor.chain().focus().toggleOrderedList().run()} isActive={editor.isActive('orderedList')} icon={ListOrdered} label={t('ordered_list')} />
                <Separator orientation="vertical" className="mx-1 h-6" />
                <Btn onClick={() => editor.chain().focus().undo().run()} icon={Undo} label={t('undo')} />
                <Btn onClick={() => editor.chain().focus().redo().run()} icon={Redo} label={t('redo')} />
            </div>
            <CardContent className="p-0"><EditorContent editor={editor} className="bg-background/50" /></CardContent>
            <CardFooter className="bg-muted/30 border-t p-4 flex flex-col sm:flex-row gap-3">
                <Button variant="outline" className="flex-1 font-bold h-11" onClick={() => { onSave(editor.getHTML()); setLastSaved(new Date().toLocaleTimeString()); }} disabled={isSaving || isApproving}>
                    {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />} {t('save')}
                </Button>
                <Button className="flex-1 font-bold h-11 bg-primary shadow-lg shadow-primary/20" onClick={() => onApprove(editor.getHTML())} disabled={isSaving || isApproving}>
                    {isApproving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />} {t('approve')}
                </Button>
            </CardFooter>
        </Card>
    );
}
