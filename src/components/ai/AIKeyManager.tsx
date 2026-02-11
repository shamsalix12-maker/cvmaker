// ============================================
// [F049] src/components/ai/AIKeyManager.tsx
// ============================================

'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useAIKeys } from '@/hooks/useAIKeys';
import { AIProviderName } from '@/lib/types';
import { SUPPORTED_AI_PROVIDERS } from '@/lib/constants';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Key, Plus, Trash2, CheckCircle, XCircle,
    Loader2, Eye, EyeOff, ExternalLink
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export function AIKeyManager() {
    const t = useTranslations('settings');
    const { keys, loading, addKey, removeKey, validateKey, hasValidKey } = useAIKeys();

    const [dialogOpen, setDialogOpen] = useState(false);
    const [selectedProvider, setSelectedProvider] = useState<AIProviderName | ''>('');
    const [apiKey, setApiKey] = useState('');
    const [showKey, setShowKey] = useState(false);
    const [validating, setValidating] = useState(false);
    const [validationResult, setValidationResult] = useState<{
        valid: boolean;
        error?: string;
    } | null>(null);
    const [saving, setSaving] = useState(false);

    const handleValidate = async () => {
        if (!selectedProvider || !apiKey) return;

        setValidating(true);
        setValidationResult(null);

        try {
            const result = await validateKey(selectedProvider, apiKey);
            setValidationResult(result);
        } catch (err: any) {
            setValidationResult({ valid: false, error: err.message });
        } finally {
            setValidating(false);
        }
    };

    const handleSave = async () => {
        if (!selectedProvider || !apiKey || !validationResult?.valid) return;

        setSaving(true);
        try {
            await addKey(selectedProvider, apiKey);
            setDialogOpen(false);
            resetForm();
            toast.success(t('key_saved'));
        } catch (err: any) {
            toast.error(err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleRemove = async (provider: AIProviderName) => {
        if (confirm(t('confirm_remove_key'))) {
            try {
                await removeKey(provider);
                toast.success(t('key_deleted'));
            } catch (err: any) {
                toast.error(err.message);
            }
        }
    };

    const resetForm = () => {
        setSelectedProvider('');
        setApiKey('');
        setShowKey(false);
        setValidationResult(null);
    };

    if (loading) {
        return (
            <Card>
                <CardContent className="py-8">
                    <div className="flex items-center justify-center">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <>
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <Key className="h-5 w-5" />
                                {t('ai_keys_title')}
                            </CardTitle>
                            <CardDescription>{t('ai_keys_description')}</CardDescription>
                        </div>
                        <Button onClick={() => setDialogOpen(true)}>
                            <Plus className="h-4 w-4 mr-2" />
                            {t('add_key')}
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {SUPPORTED_AI_PROVIDERS.map((provider) => {
                            const keyInfo = keys.find(k => k.provider_name === provider.name);
                            const isValid = hasValidKey(provider.name);

                            return (
                                <div
                                    key={provider.name}
                                    className="flex items-center justify-between p-4 border rounded-lg"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={cn(
                                            'w-10 h-10 rounded-full flex items-center justify-center',
                                            isValid ? 'bg-green-100' : 'bg-gray-100'
                                        )}>
                                            {isValid ? (
                                                <CheckCircle className="h-5 w-5 text-green-600" />
                                            ) : (
                                                <XCircle className="h-5 w-5 text-gray-400" />
                                            )}
                                        </div>
                                        <div>
                                            <p className="font-medium">{provider.label}</p>
                                            <div className="flex items-center gap-2">
                                                {isValid ? (
                                                    <>
                                                        <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">
                                                            {t('connected')}
                                                        </Badge>
                                                        <span className="text-xs text-muted-foreground">
                                                            {keyInfo?.available_models?.length || 0} {t('models_available')}
                                                        </span>
                                                    </>
                                                ) : (
                                                    <Badge variant="outline">{t('not_configured')}</Badge>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <a
                                            href={provider.website}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                        >
                                            <Button variant="ghost" size="sm">
                                                <ExternalLink className="h-4 w-4" />
                                            </Button>
                                        </a>
                                        {isValid && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleRemove(provider.name)}
                                            >
                                                <Trash2 className="h-4 w-4 text-destructive" />
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </CardContent>
            </Card>

            {/* Add Key Dialog */}
            <Dialog open={dialogOpen} onOpenChange={(open) => {
                setDialogOpen(open);
                if (!open) resetForm();
            }}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{t('add_api_key')}</DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>{t('provider')}</Label>
                            <Select
                                value={selectedProvider}
                                onValueChange={(v) => {
                                    setSelectedProvider(v as AIProviderName);
                                    setValidationResult(null);
                                }}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder={t('select_provider')} />
                                </SelectTrigger>
                                <SelectContent>
                                    {SUPPORTED_AI_PROVIDERS.map((p) => (
                                        <SelectItem key={p.name} value={p.name}>
                                            {p.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>{t('api_key')}</Label>
                            <div className="relative">
                                <Input
                                    type={showKey ? 'text' : 'password'}
                                    value={apiKey}
                                    onChange={(e) => {
                                        setApiKey(e.target.value);
                                        setValidationResult(null);
                                    }}
                                    placeholder="sk-..."
                                    className="pr-10"
                                />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="absolute right-0 top-0 h-full px-3"
                                    onClick={() => setShowKey(!showKey)}
                                >
                                    {showKey ? (
                                        <EyeOff className="h-4 w-4" />
                                    ) : (
                                        <Eye className="h-4 w-4" />
                                    )}
                                </Button>
                            </div>
                        </div>

                        {validationResult && (
                            <div className={cn(
                                'p-3 rounded-lg text-sm',
                                validationResult.valid
                                    ? 'bg-green-50 text-green-700'
                                    : 'bg-red-50 text-red-700'
                            )}>
                                {validationResult.valid ? (
                                    <div className="flex items-center gap-2">
                                        <CheckCircle className="h-4 w-4" />
                                        {t('key_valid')}
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2">
                                        <XCircle className="h-4 w-4" />
                                        {validationResult.error || t('key_invalid')}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={handleValidate}
                            disabled={!selectedProvider || !apiKey || validating}
                        >
                            {validating ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            ) : null}
                            {t('validate')}
                        </Button>
                        <Button
                            onClick={handleSave}
                            disabled={!validationResult?.valid || saving}
                        >
                            {saving ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            ) : null}
                            {t('save')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
