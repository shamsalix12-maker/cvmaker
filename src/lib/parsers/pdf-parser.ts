// ═══════════════════════════════════════════════════════════════
// [F095-PDF] src/lib/parsers/pdf-parser.ts
// PDF Parser using pdf-parse
// ═══════════════════════════════════════════════════════════════

/**
 * Parses a PDF file and extracts text.
 * This function only works on the server as it depends on Node.js 'fs' and 'buffer' via pdf-parse.
 */
export async function parsePdf(file: File): Promise<{ text: string }> {
    if (typeof window !== 'undefined') {
        throw new Error('PDF parsing is not supported in the browser. Please use the server-side extraction.');
    }

    try {
        // Dynamic require to avoid bundling on client-side
        const pdf = require('pdf-parse');

        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const data = await pdf(buffer);

        return {
            text: data.text
        };
    } catch (error: any) {
        console.error('Error parsing PDF:', error);
        throw new Error(`Failed to parse PDF: ${error.message}`);
    }
}
