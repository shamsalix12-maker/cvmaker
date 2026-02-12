'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { FileText, Save } from 'lucide-react';

interface ManualEntryModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (text: string) => void;
}

export function ManualEntryModal({ isOpen, onClose, onConfirm }: ManualEntryModalProps) {
    const t = useTranslations('cv');
    const [text, setText] = useState('');

    const handleConfirm = () => {
        onConfirm(text);
        setText('');
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-primary" />
                        {t('enter_manually')}
                    </DialogTitle>
                    <DialogDescription>
                        {t('paste_placeholder')}
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4">
                    <Textarea
                        placeholder={t('paste_placeholder')}
                        className="min-h-[300px] font-mono text-sm resize-none"
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                    />
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>
                        {t('common.cancel')}
                    </Button>
                    <Button onClick={handleConfirm} disabled={!text.trim()}>
                        <Save className="h-4 w-4 mr-2" />
                        {t('common.confirm')}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
