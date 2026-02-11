// ============================================
// [F143] src/lib/generators/docx-templates.ts
// ============================================

import {
    Document,
    Paragraph,
    TextRun,
    HeadingLevel,
    AlignmentType,
    BorderStyle,
    Table,
    TableRow,
    TableCell,
    WidthType,
    Header,
    Footer,
    PageNumber,
    NumberFormat,
} from 'docx';
import { TEXT_STYLES, PARAGRAPH_STYLES, SECTION_PROPERTIES, COLORS, SPACING } from './docx-styles';

// Helper to create a styled text run
export function createTextRun(
    text: string,
    style: keyof typeof TEXT_STYLES = 'body'
): TextRun {
    return new TextRun({
        text,
        ...TEXT_STYLES[style],
    });
}

// Helper to create a paragraph with runs
export function createParagraph(
    runs: TextRun | TextRun[],
    options: {
        heading?: (typeof HeadingLevel)[keyof typeof HeadingLevel];
        alignment?: (typeof AlignmentType)[keyof typeof AlignmentType];
        spacing?: { before?: number; after?: number };
        bullet?: { level: number };
    } = {}
): Paragraph {
    const runsArray = Array.isArray(runs) ? runs : [runs];

    return new Paragraph({
        children: runsArray,
        heading: options.heading,
        alignment: options.alignment,
        spacing: options.spacing || PARAGRAPH_STYLES.body.spacing,
        bullet: options.bullet,
    });
}

// Create section header with line
export function createSectionHeader(title: string): Paragraph[] {
    return [
        new Paragraph({
            children: [createTextRun(title, 'heading1')],
            spacing: { before: SPACING.section, after: 120 },
            border: {
                bottom: {
                    color: COLORS.primary,
                    space: 4,
                    size: 12,
                    style: BorderStyle.SINGLE,
                },
            },
        }),
    ];
}

// Create contact info line
export function createContactLine(items: string[]): Paragraph {
    const runs: TextRun[] = [];

    items.forEach((item, index) => {
        if (index > 0) {
            runs.push(new TextRun({
                text: '  •  ',
                ...TEXT_STYLES.subtle,
            }));
        }
        runs.push(new TextRun({
            text: item,
            ...TEXT_STYLES.subtle,
        }));
    });

    return new Paragraph({
        children: runs,
        alignment: AlignmentType.CENTER,
        spacing: { after: 60 },
    });
}

// Create experience/education entry
export function createExperienceEntry(
    title: string,
    subtitle: string,
    dateRange: string,
    description?: string,
    bullets?: string[]
): Paragraph[] {
    const paragraphs: Paragraph[] = [];

    // Title and date on same line
    paragraphs.push(new Paragraph({
        children: [
            createTextRun(title, 'bodyBold'),
            new TextRun({ text: '\t' }),
            createTextRun(dateRange, 'subtle'),
        ],
        tabStops: [
            {
                type: 'right' as any,
                position: 9360, // Right align at 6.5 inches
            },
        ],
        spacing: { after: 60 },
    }));

    // Subtitle (company/institution)
    paragraphs.push(new Paragraph({
        children: [createTextRun(subtitle, 'subtle')],
        spacing: { after: 120 },
    }));

    // Description
    if (description) {
        paragraphs.push(new Paragraph({
            children: [createTextRun(description, 'body')],
            spacing: { after: 120 },
        }));
    }

    // Bullet points
    if (bullets && bullets.length > 0) {
        bullets.forEach(bullet => {
            paragraphs.push(new Paragraph({
                children: [createTextRun(bullet, 'body')],
                bullet: { level: 0 },
                spacing: { after: 60 },
            }));
        });
    }

    return paragraphs;
}

// Create skills section
export function createSkillsSection(skills: string[]): Paragraph[] {
    const skillText = skills.join('  •  ');

    return [
        ...createSectionHeader('Skills'),
        new Paragraph({
            children: [createTextRun(skillText, 'body')],
            spacing: { after: SPACING.paragraph },
        }),
    ];
}

// Create footer with page numbers
export function createFooter(): Footer {
    return new Footer({
        children: [
            new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                    new TextRun({
                        children: [PageNumber.CURRENT],
                        ...TEXT_STYLES.caption,
                    }),
                    new TextRun({
                        text: ' / ',
                        ...TEXT_STYLES.caption,
                    }),
                    new TextRun({
                        children: [PageNumber.TOTAL_PAGES],
                        ...TEXT_STYLES.caption,
                    }),
                ],
            }),
        ],
    });
}
