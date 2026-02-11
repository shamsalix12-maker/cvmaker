// ═══════════════════════════════════════════════════════════════
// [F072] src/lib/parsers/docx-parser.ts
// Word Document Parser
// ═══════════════════════════════════════════════════════════════

import mammoth from 'mammoth';

export interface ParsedDocument {
    text: string;
    html?: string;
    metadata?: {
        wordCount: number;
        hasImages: boolean;
    };
}

/**
 * Counts words in a string, ignoring excessive whitespace
 */
function countWords(text: string): number {
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
}

/**
 * Parse a DOCX file from a File or Buffer object
 */
export async function parseDocx(file: File | Buffer): Promise<ParsedDocument> {
    try {
        let arrayBuffer: ArrayBuffer;

        if (file instanceof File) {
            arrayBuffer = await file.arrayBuffer();
        } else {
            // Buffer
            arrayBuffer = file.buffer.slice(file.byteOffset, file.byteOffset + file.byteLength) as ArrayBuffer;
        }

        return parseDocxFromArrayBuffer(arrayBuffer);
    } catch (error) {
        console.error('Error parsing DOCX file:', error);
        throw new Error('Failed to parse document. Please ensure it is a valid .docx file.');
    }
}

/**
 * Parse a DOCX file directly from an ArrayBuffer
 */
export async function parseDocxFromArrayBuffer(arrayBuffer: ArrayBuffer): Promise<ParsedDocument> {
    try {
        // Convert ArrayBuffer to Buffer for mammoth if running in Node environment, or use ArrayBuffer directly if supported
        // Mammoth supports ArrayBuffer in browser.

        const result = await mammoth.convertToHtml({ arrayBuffer: arrayBuffer });
        const rawTextResult = await mammoth.extractRawText({ arrayBuffer: arrayBuffer });

        const html = result.value; // The generated HTML
        const text = rawTextResult.value; // The raw text
        const messages = result.messages; // Any messages, such as warnings during conversion

        if (messages.length > 0) {
            console.warn('Mammoth parsing messages:', messages);
        }

        // Basic metadata extraction
        // Has images if there are img tags in html
        const hasImages = /<img/i.test(html);
        const wordCount = countWords(text);

        return {
            text,
            html,
            metadata: {
                wordCount,
                hasImages,
            },
        };
    } catch (error) {
        console.error('Error parsing DOCX from ArrayBuffer:', error);
        throw new Error('Failed to parse document content.');
    }
}
