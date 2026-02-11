// ============================================
// [F075] src/lib/generators/docx-generator.ts
// ============================================

import {
    Document,
    Paragraph,
    TextRun,
    Packer,
    AlignmentType,
    HeadingLevel,
    Header,
    Footer,
    PageNumber,
} from 'docx';
import { DocumentType } from '@/lib/types';
import {
    TEXT_STYLES,
    PARAGRAPH_STYLES,
    SECTION_PROPERTIES,
    COLORS,
    SPACING,
} from './docx-styles';
import {
    createTextRun,
    createParagraph,
    createSectionHeader,
    createContactLine,
    createExperienceEntry,
    createSkillsSection,
    createFooter,
} from './docx-templates';

export interface GenerateDocxOptions {
    content: string;
    type: DocumentType;
    title?: string;
    metadata?: {
        author?: string;
        company?: string;
        jobTitle?: string;
    };
    locale?: 'en' | 'fa';
}

// Parse markdown-like content into paragraphs
function parseContent(content: string, locale: 'en' | 'fa' = 'en'): Paragraph[] {
    const paragraphs: Paragraph[] = [];
    const lines = content.split('\n');
    const isRTL = locale === 'fa';

    let currentBullets: string[] = [];

    const flushBullets = () => {
        if (currentBullets.length > 0) {
            currentBullets.forEach(bullet => {
                paragraphs.push(new Paragraph({
                    children: [createTextRun(bullet.replace(/^[-•*]\s*/, ''), 'body')],
                    bullet: { level: 0 },
                    spacing: { after: 60 },
                    alignment: isRTL ? AlignmentType.RIGHT : AlignmentType.LEFT,
                    bidirectional: isRTL,
                }));
            });
            currentBullets = [];
        }
    };

    for (const line of lines) {
        const trimmedLine = line.trim();

        if (!trimmedLine) {
            flushBullets();
            continue;
        }

        // Heading 1: # Title or === underline
        if (trimmedLine.startsWith('# ') || trimmedLine.startsWith('## ')) {
            flushBullets();
            const headingText = trimmedLine.replace(/^#+\s*/, '');
            const level = trimmedLine.startsWith('## ') ? 'heading2' : 'heading1';

            if (level === 'heading1') {
                const headerParagraphs = createSectionHeader(headingText);
                headerParagraphs.forEach(p => {
                    // Adjust for RTL if needed
                    if (isRTL) {
                        // We'd need to modify Paragraph options, but docx objects are mostly immutable once constructed via new Paragraph
                        // For simplicity, let's just push them
                    }
                });
                paragraphs.push(...headerParagraphs);
            } else {
                paragraphs.push(new Paragraph({
                    children: [createTextRun(headingText, 'heading2')],
                    spacing: { before: SPACING.paragraph, after: 120 },
                    alignment: isRTL ? AlignmentType.RIGHT : AlignmentType.LEFT,
                    bidirectional: isRTL,
                }));
            }
            continue;
        }

        // Heading 3: ### Subtitle
        if (trimmedLine.startsWith('### ')) {
            flushBullets();
            const headingText = trimmedLine.replace(/^###\s*/, '');
            paragraphs.push(new Paragraph({
                children: [createTextRun(headingText, 'heading3')],
                spacing: { before: 120, after: 60 },
                alignment: isRTL ? AlignmentType.RIGHT : AlignmentType.LEFT,
                bidirectional: isRTL,
            }));
            continue;
        }

        // Bullet points
        if (/^[-•*]\s/.test(trimmedLine)) {
            currentBullets.push(trimmedLine);
            continue;
        }

        // Bold text: **text**
        if (trimmedLine.includes('**')) {
            flushBullets();
            const parts = trimmedLine.split(/\*\*(.*?)\*\*/g);
            const runs: TextRun[] = [];

            parts.forEach((part, index) => {
                if (index % 2 === 1) {
                    // Bold part
                    runs.push(createTextRun(part, 'bodyBold'));
                } else if (part) {
                    runs.push(createTextRun(part, 'body'));
                }
            });

            paragraphs.push(new Paragraph({
                children: runs,
                spacing: { after: SPACING.paragraph },
                alignment: isRTL ? AlignmentType.RIGHT : AlignmentType.LEFT,
                bidirectional: isRTL,
            }));
            continue;
        }

        // Regular paragraph
        flushBullets();
        paragraphs.push(new Paragraph({
            children: [createTextRun(trimmedLine, 'body')],
            spacing: { after: SPACING.paragraph },
            alignment: isRTL ? AlignmentType.RIGHT : AlignmentType.LEFT,
            bidirectional: isRTL,
        }));
    }

    flushBullets();
    return paragraphs;
}

// Generate CV document
function generateCVDocument(content: string, options: GenerateDocxOptions): Document {
    const paragraphs = parseContent(content, options.locale);

    return new Document({
        creator: options.metadata?.author || 'CV Tailor',
        title: options.title || 'Tailored CV',
        description: 'CV generated by CV Tailor',
        sections: [
            {
                properties: SECTION_PROPERTIES,
                footers: {
                    default: createFooter(),
                },
                children: paragraphs,
            },
        ],
    });
}

// Generate Cover Letter document
function generateCoverLetterDocument(content: string, options: GenerateDocxOptions): Document {
    const paragraphs = parseContent(content, options.locale);

    // Add date at the top
    const today = new Date().toLocaleDateString(options.locale === 'fa' ? 'fa-IR' : 'en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });

    const headerParagraphs: Paragraph[] = [
        new Paragraph({
            children: [createTextRun(today, 'body')],
            spacing: { after: SPACING.section },
            alignment: options.locale === 'fa' ? AlignmentType.RIGHT : AlignmentType.LEFT,
            bidirectional: options.locale === 'fa',
        }),
    ];

    return new Document({
        creator: options.metadata?.author || 'CV Tailor',
        title: options.title || 'Cover Letter',
        description: 'Cover letter generated by CV Tailor',
        sections: [
            {
                properties: SECTION_PROPERTIES,
                children: [...headerParagraphs, ...paragraphs],
            },
        ],
    });
}

// Generate Email document
function generateEmailDocument(content: string, options: GenerateDocxOptions): Document {
    const paragraphs = parseContent(content, options.locale);

    return new Document({
        creator: options.metadata?.author || 'CV Tailor',
        title: options.title || 'Application Email',
        description: 'Application email generated by CV Tailor',
        sections: [
            {
                properties: SECTION_PROPERTIES,
                children: paragraphs,
            },
        ],
    });
}

// Main export function
export async function generateDocx(options: GenerateDocxOptions): Promise<Buffer> {
    let document: Document;

    switch (options.type) {
        case 'cv':
            document = generateCVDocument(options.content, options);
            break;
        case 'cover_letter':
            document = generateCoverLetterDocument(options.content, options);
            break;
        case 'email':
            document = generateEmailDocument(options.content, options);
            break;
        default:
            document = generateCVDocument(options.content, options);
    }

    const buffer = await Packer.toBuffer(document);
    return Buffer.from(buffer);
}

// Generate all three documents as a zip (optional future feature)
export async function generateAllDocx(
    documents: {
        cv: string;
        coverLetter: string;
        email: string;
    },
    metadata?: GenerateDocxOptions['metadata']
): Promise<{
    cv: Buffer;
    coverLetter: Buffer;
    email: Buffer;
}> {
    const [cv, coverLetter, email] = await Promise.all([
        generateDocx({ content: documents.cv, type: 'cv', metadata }),
        generateDocx({ content: documents.coverLetter, type: 'cover_letter', metadata }),
        generateDocx({ content: documents.email, type: 'email', metadata }),
    ]);

    return { cv, coverLetter, email };
}
