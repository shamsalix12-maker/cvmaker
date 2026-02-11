// ═══════════════════════════════════════════════════════════════
// [F073] src/lib/parsers/markdown-parser.ts
// Markdown Parser
// ═══════════════════════════════════════════════════════════════

import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkHtml from 'remark-html';

export interface ParsedMarkdown {
    text: string;
    html: string;
    metadata?: {
        wordCount: number;
        headings: string[];
    };
}

/**
 * Counts words in a string, ignoring excessive whitespace
 */
function countWords(string: string): number {
    return string.trim().split(/\s+/).filter((n) => n != '').length;
}

/**
 * Parses markdown content into HTML and extracts metadata
 */
export async function parseMarkdown(content: string): Promise<ParsedMarkdown> {
    try {
        // Process markdown to HTML
        const processedContent = await unified()
            .use(remarkParse)
            .use(remarkHtml)
            .process(content);

        const html = processedContent.toString();

        // Extract plain text (simple approach: remove Markdown syntax or use regex)
        // A more robust way would be to use remark-rehype -> rehype-stringify
        // For simplicity, we'll strip common Markdown symbols or use the raw content as "text" 
        // but without html tags if we wanted purely text.
        // However, the prompt asks for "text" extraction. 
        // Since we want the content for LLM processing, raw markdown is often better than stripped text.
        // But let's try to strip it for word count at least.

        // Simple text extraction from markdown string (not perfect but fast)
        // Alternatively, we could use remark-strip-html if available, or just traverse the AST.
        // For now, let's treat the original markdown as the "text" source, 
        // effectively returning raw markdown as `text` property is common for LLMs.
        // But if `text` implies "plain text without formatting", we should strip it.
        // Let's assume raw text (content) is what we want for "text", 
        // and html is for "html".

        const text = content;

        // Extract headings (lines starting with #)
        const headings: string[] = [];
        const lines = content.split('\n');
        for (const line of lines) {
            if (line.match(/^#{1,6}\s/)) {
                headings.push(line.replace(/^#{1,6}\s/, '').trim());
            }
        }

        const wordCount = countWords(text);

        return {
            text,
            html,
            metadata: {
                wordCount,
                headings,
            },
        };
    } catch (error) {
        console.error('Error parsing Markdown:', error);
        throw new Error('Failed to parse Markdown content.');
    }
}

/**
 * Parses a markdown file
 */
export async function parseMarkdownFile(file: File): Promise<ParsedMarkdown> {
    try {
        const text = await file.text();
        return parseMarkdown(text);
    } catch (error) {
        console.error('Error reading Markdown file:', error);
        throw new Error('Failed to read Markdown file.');
    }
}
