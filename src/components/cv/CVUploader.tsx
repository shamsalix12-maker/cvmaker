'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import {
    FileText, Upload, AlertCircle, Loader2, FileUp, Clipboard, CheckCircle, Brain, Sparkles, Plus
} from 'lucide-react';
import { useCV } from '@/hooks/useCV';
import { useAIKeys } from '@/hooks/useAIKeys';
import { AIProviderName, CVExtractionResult, ComprehensiveCV, AIModel } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface CVUploaderProps {
    onExtractionComplete: (result: CVExtractionResult) => void;
    existingCV: ComprehensiveCV | null;
    disabled?: boolean;
    allowReupload?: boolean;
    onManualStart?: () => void;
}

export function CVUploader({
    onExtractionComplete,
    existingCV,
    disabled = false,
    allowReupload = false,
    onManualStart
}: CVUploaderProps) {
    const t = useTranslations('cv');
    const { extractFromFile, extractFromText } = useCV();
    const { getModelsForProvider, getValidProviders } = useAIKeys();

    const [activeTab, setActiveTab] = useState<'file' | 'text'>('file');
    const [file, setFile] = useState<File | null>(null);
    const [text, setText] = useState('');
    const [isDragActive, setIsDragActive] = useState(false);
    const [isExtracting, setIsExtracting] = useState(false);

    // AI Settings State
    const validProviders = getValidProviders();
    const [selectedProvider, setSelectedProvider] = useState<AIProviderName | ''>(
        validProviders.length > 0 ? validProviders[0] : ''
    );

    const availableModels = selectedProvider ? getModelsForProvider(selectedProvider) : [];
    const [selectedModel, setSelectedModel] = useState<string>('');

    // Update model when provider changes
    const handleProviderChange = (provider: AIProviderName) => {
        setSelectedProvider(provider);
        const models = getModelsForProvider(provider);
        if (models.length > 0) {
            // Prefer models with vision capabilities or higher intelligence if possible
            // This logic could be improved with more metadata about models
            setSelectedModel(models[0].model_id);
        } else {
            setSelectedModel('');
        }
    };

    // Set initial model if provider is selected
    useState(() => {
        if (selectedProvider && !selectedModel) {
            const models = getModelsForProvider(selectedProvider);
            if (models.length > 0) {
                setSelectedModel(models[0].model_id);
            }
        }
    });

    // Drag and drop handlers
    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        if (!disabled) setIsDragActive(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragActive(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragActive(false);

        if (disabled) return;

        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            const droppedFile = e.dataTransfer.files[0];
            validateAndSetFile(droppedFile);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            validateAndSetFile(e.target.files[0]);
        }
    };

    const validateAndSetFile = (file: File) => {
        const validTypes = [
            'application/pdf',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'text/plain',
            'text/markdown'
        ];

        if (!validTypes.includes(file.type) && !file.name.endsWith('.md')) { // strict mime type check might fail for md
            toast.error(t('errors.validation.invalid_file_type', { formats: '.pdf, .docx, .txt, .md' }));
            return;
        }

        // Size check (e.g. 5MB)
        if (file.size > 5 * 1024 * 1024) {
            toast.error(t('errors.validation.file_too_large', { size: 5 }));
            return;
        }

        setFile(file);
    };

    const handleExtract = async () => {
        if (!selectedProvider || !selectedModel) {
            toast.error(t('select_ai_first'));
            return;
        }

        setIsExtracting(true);

        try {
            let result: CVExtractionResult;

            if (activeTab === 'file' && file) {
                result = await extractFromFile(file, selectedProvider, selectedModel);
            } else if (activeTab === 'text' && text.trim()) {
                result = await extractFromText(text, selectedProvider, selectedModel);
            } else {
                toast.error(t('provide_content'));
                setIsExtracting(false);
                return;
            }

            onExtractionComplete(result);

        } catch (err: any) {
            toast.error(err.message || t('extraction_failed'));
        } finally {
            setIsExtracting(false);
        }
    };

    // If CV exists and reupload not requested, show concise state or nothing
    // But usually this component is mounted when user WANTS to upload (e.g. in Upload tab)

    return (
        <Card className="w-full max-w-2xl mx-auto">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <FileUp className="h-5 w-5" />
                    {t('upload_cv')}
                </CardTitle>
                <CardDescription>
                    {t('upload_description')}
                </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">

                {/* AI Selection */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg border">
                    <div className="space-y-2">
                        <Label className="flex items-center gap-1">
                            <Brain className="h-4 w-4" />
                            {t('ai_provider')}
                        </Label>
                        <Select
                            value={selectedProvider || ""}
                            onValueChange={(val) => handleProviderChange(val as AIProviderName)}
                            disabled={isExtracting || disabled || validProviders.length === 0}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder={t('select_provider')} />
                            </SelectTrigger>
                            <SelectContent>
                                {validProviders.map(p => (
                                    <SelectItem key={p} value={p}>{p}</SelectItem>
                                ))}
                                {validProviders.length === 0 && (
                                    <SelectItem value="none" disabled>{t('no_providers')}</SelectItem>
                                )}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label className="flex items-center gap-1">
                            <Sparkles className="h-4 w-4" />
                            {t('ai_model')}
                        </Label>
                        <Select
                            value={selectedModel || ""}
                            onValueChange={setSelectedModel}
                            disabled={isExtracting || disabled || !selectedProvider}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder={t('select_model')} />
                            </SelectTrigger>
                            <SelectContent>
                                {availableModels
                                    .filter(m => m.model_id && m.model_id.trim() !== '')
                                    .map(m => (
                                        <SelectItem key={m.model_id} value={m.model_id}>{m.model_name}</SelectItem>
                                    ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {validProviders.length === 0 && (
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 rounded-lg">
                        <div className="flex items-center gap-3 text-sm text-amber-700 dark:text-amber-400">
                            <AlertCircle className="h-5 w-5 shrink-0" />
                            <p>{t('no_keys_alert')}</p>
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            className="shrink-0 border-amber-300 hover:bg-amber-100 dark:border-amber-800 dark:hover:bg-amber-900/30"
                            asChild
                        >
                            <a href="/settings">{t('configure_keys')}</a>
                        </Button>
                    </div>
                )}

                <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'file' | 'text')} className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="file" disabled={isExtracting || disabled}>
                            <Upload className="h-4 w-4 mr-2" />
                            {t('file_upload')}
                        </TabsTrigger>
                        <TabsTrigger value="text" disabled={isExtracting || disabled}>
                            <Clipboard className="h-4 w-4 mr-2" />
                            {t('paste_text')}
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="file" className="mt-4">
                        <div
                            className={cn(
                                "border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer",
                                isDragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50",
                                disabled && "opacity-50 cursor-not-allowed",
                                file && "border-green-500 bg-green-50 dark:bg-green-950/20"
                            )}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            onClick={() => !disabled && document.getElementById('file-upload')?.click()}
                        >
                            <input
                                id="file-upload"
                                type="file"
                                className="hidden"
                                onChange={handleFileChange}
                                accept=".pdf,.docx,.txt,.md"
                                disabled={disabled}
                            />

                            <div className="flex flex-col items-center gap-2">
                                {file ? (
                                    <>
                                        <FileText className="h-10 w-10 text-green-500" />
                                        <div className="font-medium text-green-700 dark:text-green-400">
                                            {file.name}
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            {(file.size / 1024 / 1024).toFixed(2)} MB
                                        </p>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="mt-2 text-destructive hover:text-destructive z-10"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                setFile(null);
                                            }}
                                            disabled={isExtracting}
                                        >
                                            {t('remove')}
                                        </Button>
                                    </>
                                ) : (
                                    <>
                                        <Upload className="h-10 w-10 text-muted-foreground" />
                                        <p className="font-medium">
                                            {t('upload_drag_drop')}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {t('supported_formats')} {t('max_size', { size: 5 })}
                                        </p>
                                    </>
                                )}
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="text" className="mt-4">
                        <Textarea
                            placeholder={t('paste_placeholder')}
                            className="min-h-[200px] font-mono text-sm"
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            disabled={isExtracting || disabled}
                        />
                    </TabsContent>
                </Tabs>

                <Button
                    className="w-full"
                    onClick={handleExtract}
                    disabled={
                        isExtracting ||
                        disabled ||
                        !selectedProvider ||
                        !selectedModel ||
                        (activeTab === 'file' && !file) ||
                        (activeTab === 'text' && !text.trim())
                    }
                >
                    {isExtracting ? (
                        <span className="flex items-center justify-center pointer-events-none" key="extracting">
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            {t('extracting_info')}
                        </span>
                    ) : (
                        <span className="flex items-center justify-center pointer-events-none" key="idle">
                            <Brain className="h-4 w-4 mr-2" />
                            {t('extract_data')}
                        </span>
                    )}
                </Button>

                <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-background px-2 text-muted-foreground">
                            {t('or_enter_manually')}
                        </span>
                    </div>
                </div>

                <Button
                    variant="outline"
                    className="w-full"
                    onClick={onManualStart}
                    disabled={isExtracting || disabled}
                >
                    <Plus className="h-4 w-4 mr-2" />
                    {t('enter_manually')}
                </Button>

                {existingCV && (
                    <div className="flex items-center justify-center gap-2 text-sm text-yellow-600 dark:text-yellow-500 bg-yellow-50 dark:bg-yellow-900/20 p-2 rounded">
                        <AlertCircle className="h-4 w-4" />
                        {t('replace_confirm')}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
