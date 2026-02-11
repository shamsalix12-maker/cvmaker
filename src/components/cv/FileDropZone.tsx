// ============================================
// [F133] src/components/cv/FileDropZone.tsx
// ============================================

'use client';

import { useCallback, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Upload, File, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FileDropZoneProps {
    onFileSelect: (file: File) => void;
    acceptedTypes?: string[];
    maxSizeMB?: number;
    className?: string;
}

export function FileDropZone({
    onFileSelect,
    acceptedTypes = ['.docx', '.pdf', '.txt', '.md'],
    maxSizeMB = 10,
    className
}: FileDropZoneProps) {
    const t = useTranslations('cv');
    const [isDragging, setIsDragging] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files[0];
        if (file) validateAndSelect(file);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) validateAndSelect(file);
    };

    const validateAndSelect = (file: File) => {
        const ext = `.${file.name.split('.').pop()?.toLowerCase()}`;
        if (!acceptedTypes.includes(ext)) {
            alert(`Invalid file type. Accepted: ${acceptedTypes.join(', ')}`);
            return;
        }
        if (file.size > maxSizeMB * 1024 * 1024) {
            alert(`File too large. Max: ${maxSizeMB}MB`);
            return;
        }
        setSelectedFile(file);
        onFileSelect(file);
    };

    const clearFile = (e: React.MouseEvent) => {
        e.stopPropagation();
        setSelectedFile(null);
    };

    return (
        <div
            className={cn(
                'relative border-2 border-dashed rounded-lg p-8 transition-all text-center',
                isDragging ? 'border-primary bg-primary/5' : 'border-muted-foreground/25',
                className
            )}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
        >
            <input
                type="file"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                accept={acceptedTypes.join(',')}
                onChange={handleFileChange}
            />

            {selectedFile ? (
                <div className="flex flex-col items-center gap-2">
                    <div className="bg-primary/10 p-3 rounded-full">
                        <File className="h-8 w-8 text-primary" />
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="font-medium">{selectedFile.name}</span>
                        <button onClick={clearFile} className="p-1 hover:bg-muted rounded text-muted-foreground">
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                    <span className="text-xs text-muted-foreground">
                        {(selectedFile.size / 1024).toFixed(1)} KB
                    </span>
                </div>
            ) : (
                <div className="flex flex-col items-center gap-2">
                    <div className="bg-muted p-3 rounded-full">
                        <Upload className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <p className="font-medium">{t('drop_file_here') || 'Drop file here or click to upload'}</p>
                    <p className="text-xs text-muted-foreground">
                        {acceptedTypes.join(', ')} (Max {maxSizeMB}MB)
                    </p>
                </div>
            )}
        </div>
    );
}
