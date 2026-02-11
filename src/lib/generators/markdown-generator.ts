// ============================================
// [F076] src/lib/generators/markdown-generator.ts
// ============================================

import { DocumentType } from '@/lib/types';

export interface GenerateMarkdownOptions {
    content: string;
    type: DocumentType;
    title?: string;
    includeMetadata?: boolean;
    metadata?: {
        author?: string;
        date?: string;
        company?: string;
        jobTitle?: string;
    };
}

// Convert HTML to Markdown
export function htmlToMarkdown(html: string): string {
    let markdown = html;

    // Remove extra whitespace
    markdown = markdown.replace(/\s+/g, ' ');

    // Headers
    markdown = markdown.replace(/<h1[^>]*>(.*?)<\/h1>/gi, '\n# $1\n');
    markdown = markdown.replace(/<h2[^>]*>(.*?)<\/h2>/gi, '\n## $1\n');
    markdown = markdown.replace(/<h3[^>]*>(.*?)<\/h3>/gi, '\n### $1\n');
    markdown = markdown.replace(/<h4[^>]*>(.*?)<\/h4>/gi, '\n#### $1\n');
    markdown = markdown.replace(/<h5[^>]*>(.*?)<\/h5>/gi, '\n##### $1\n');
    markdown = markdown.replace(/<h6[^>]*>(.*?)<\/h6>/gi, '\n###### $1\n');

    // Bold and italic
    markdown = markdown.replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**');
    markdown = markdown.replace(/<b[^>]*>(.*?)<\/b>/gi, '**$1**');
    markdown = markdown.replace(/<em[^>]*>(.*?)<\/em>/gi, '*$1*');
    markdown = markdown.replace(/<i[^>]*>(.*?)<\/i>/gi, '*$1*');

    // Links
    markdown = markdown.replace(/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi, '[$2]($1)');

    // Line breaks and paragraphs
    markdown = markdown.replace(/<br\s*\/?>/gi, '\n');
    markdown = markdown.replace(/<\/p>/gi, '\n\n');
    markdown = markdown.replace(/<p[^>]*>/gi, '');

    // Lists
    markdown = markdown.replace(/<ul[^>]*>/gi, '\n');
    markdown = markdown.replace(/<\/ul>/gi, '\n');
    markdown = markdown.replace(/<ol[^>]*>/gi, '\n');
    markdown = markdown.replace(/<\/ol>/gi, '\n');
    markdown = markdown.replace(/<li[^>]*>(.*?)<\/li>/gi, '- $1\n');

    // Blockquotes
    markdown = markdown.replace(/<blockquote[^>]*>(.*?)<\/blockquote>/gi, '\n> $1\n');

    // Code
    markdown = markdown.replace(/<code[^>]*>(.*?)<\/code>/gi, '`$1`');
    markdown = markdown.replace(/<pre[^>]*>(.*?)<\/pre>/gi, '\n```\n$1\n```\n');

    // Horizontal rule
    markdown = markdown.replace(/<hr\s*\/?>/gi, '\n---\n');

    // Remove remaining HTML tags
    markdown = markdown.replace(/<[^>]+>/g, '');

    // Decode HTML entities
    markdown = markdown.replace(/&nbsp;/g, ' ');
    markdown = markdown.replace(/&amp;/g, '&');
    markdown = markdown.replace(/&lt;/g, '<');
    markdown = markdown.replace(/&gt;/g, '>');
    markdown = markdown.replace(/&quot;/g, '"');
    markdown = markdown.replace(/&#39;/g, "'");

    // Clean up extra newlines
    markdown = markdown.replace(/\n{3,}/g, '\n\n');
    markdown = markdown.trim();

    return markdown;
}

// Clean and normalize content
function normalizeContent(content: string): string {
    // Check if content is HTML
    if (content.includes('<') && content.includes('>')) {
        return htmlToMarkdown(content);
    }
    return content;
}

// Generate frontmatter for metadata
function generateFrontmatter(options: GenerateMarkdownOptions): string {
    if (!options.includeMetadata) {
        return '';
    }

    const lines = ['---'];

    if (options.title) {
        lines.push(`title: "${options.title}"`);
    }
    if (options.metadata?.author) {
        lines.push(`author: "${options.metadata.author}"`);
    }
    if (options.metadata?.date) {
        lines.push(`date: "${options.metadata.date}"`);
    } else {
        lines.push(`date: "${new Date().toISOString().split('T')[0]}"`);
    }
    if (options.metadata?.company) {
        lines.push(`company: "${options.metadata.company}"`);
    }
    if (options.metadata?.jobTitle) {
        lines.push(`job_title: "${options.metadata.jobTitle}"`);
    }
    lines.push(`type: "${options.type}"`);
    lines.push('---\n');

    return lines.join('\n');
}

// Generate CV markdown with structure
export function generateCVMarkdown(content: string, options: GenerateMarkdownOptions): string {
    const normalized = normalizeContent(content);
    const frontmatter = generateFrontmatter(options);

    return `${frontmatter}${normalized}`;
}

// Generate Cover Letter markdown
export function generateCoverLetterMarkdown(content: string, options: GenerateMarkdownOptions): string {
    const normalized = normalizeContent(content);
    const frontmatter = generateFrontmatter(options);

    const date = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });

    return `${frontmatter}${date}\n\n${normalized}`;
}

// Generate Email markdown
export function generateEmailMarkdown(content: string, options: GenerateMarkdownOptions): string {
    const normalized = normalizeContent(content);
    const frontmatter = generateFrontmatter(options);

    return `${frontmatter}${normalized}`;
}

// Main export function
export function generateMarkdown(options: GenerateMarkdownOptions): string {
    switch (options.type) {
        case 'cv':
            return generateCVMarkdown(options.content, options);
        case 'cover_letter':
            return generateCoverLetterMarkdown(options.content, options);
        case 'email':
            return generateEmailMarkdown(options.content, options);
        default:
            return generateCVMarkdown(options.content, options);
    }
}

// Convert markdown to plain text (for AI processing)
export function markdownToPlainText(markdown: string): string {
    let text = markdown;

    // Remove frontmatter
    text = text.replace(/^---[\s\S]*?---\n*/m, '');

    // Remove headers markers but keep text
    text = text.replace(/^#{1,6}\s+/gm, '');

    // Remove bold/italic markers
    text = text.replace(/\*\*(.*?)\*\*/g, '$1');
    text = text.replace(/\*(.*?)\*/g, '$1');
    text = text.replace(/__(.*?)__/g, '$1');
    text = text.replace(/_(.*?)_/g, '$1');

    // Remove link formatting, keep text
    text = text.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');

    // Remove code formatting
    text = text.replace(/`{1,3}[^`]*`{1,3}/g, '');

    // Remove horizontal rules
    text = text.replace(/^---+$/gm, '');

    // Remove blockquote markers
    text = text.replace(/^>\s*/gm, '');

    // Remove list markers
    text = text.replace(/^[-*+]\s+/gm, '');
    text = text.replace(/^\d+\.\s+/gm, '');

    // Clean up whitespace
    text = text.replace(/\n{3,}/g, '\n\n');
    text = text.trim();

    return text;
}

// Generate all documents as markdown object
export function generateAllMarkdown(
    documents: {
        cv: string;
        coverLetter: string;
        email: string;
    },
    options: Omit<GenerateMarkdownOptions, 'content' | 'type'> = {}
): {
    cv: string;
    coverLetter: string;
    email: string;
} {
    return {
        cv: generateMarkdown({ ...options, content: documents.cv, type: 'cv' }),
        coverLetter: generateMarkdown({ ...options, content: documents.coverLetter, type: 'cover_letter' }),
        email: generateMarkdown({ ...options, content: documents.email, type: 'email' }),
    };
}
