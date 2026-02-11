// ═══════════════════════════════════════════════════════════════
// [F095] src/lib/parsers/index.ts
// Parser Entry Point
// ═══════════════════════════════════════════════════════════════

import { parseDocx } from './docx-parser';
import { parseMarkdown } from './markdown-parser';

export * from './docx-parser';
export * from './markdown-parser';

export type SupportedFileType = 'docx' | 'md' | 'txt';

/**
 * Detects the type of the file based on its extension
 */
export function detectFileType(filename: string): SupportedFileType | null {
    const extension = filename.split('.').pop()?.toLowerCase();

    switch (extension) {
        case 'docx':
        case 'doc':
            return 'docx';
        case 'md':
        case 'markdown':
            return 'md';
        case 'txt':
            return 'txt';
        default:
            return null;
    }
}

/**
 * Main function to parse a file
 * Dispatches to the correct parser based on file type
 */
export async function parseFile(file: File): Promise<{ text: string; html?: string }> {
    const fileType = detectFileType(file.name);

    if (!fileType) {
        throw new Error(`Unsupported file type: ${file.name}`);
    }

    if (fileType === 'docx') {
        return parseDocx(file);
    } else if (fileType === 'md') {
        const text = await file.text();
        return parseMarkdown(text);
    } else if (fileType === 'txt') {
        const text = await file.text();
        return {
            text,
            html: text // Treat plain text as HTML (maybe wrap in pre later)
        };
    } else {
        throw new Error(`Parser not implemented for file type: ${fileType}`);
    }
}
