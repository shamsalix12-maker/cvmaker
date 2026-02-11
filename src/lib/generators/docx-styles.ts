// ============================================
// [F142] src/lib/generators/docx-styles.ts
// ============================================

import {
    HeadingLevel,
    AlignmentType,
    TabStopPosition,
    TabStopType,
    convertInchesToTwip,
    BorderStyle,
} from 'docx';

// Color palette
export const COLORS = {
    primary: '2563EB',      // Blue
    secondary: '64748B',    // Slate
    text: '1E293B',         // Dark slate
    lightText: '64748B',    // Light slate
    accent: '0EA5E9',       // Sky blue
    border: 'E2E8F0',       // Light border
    background: 'F8FAFC',   // Light background
};

// Font sizes in half-points (1 point = 2 half-points)
export const FONT_SIZES = {
    title: 48,          // 24pt
    heading1: 36,       // 18pt
    heading2: 28,       // 14pt
    heading3: 24,       // 12pt
    body: 22,           // 11pt
    small: 20,          // 10pt
    caption: 18,        // 9pt
};

// Spacing in twips (1 inch = 1440 twips)
export const SPACING = {
    paragraph: 240,     // 12pt after paragraph
    section: 480,       // 24pt after section
    line: 276,          // 1.15 line spacing
};

// Common text run styles
export const TEXT_STYLES = {
    title: {
        bold: true,
        size: FONT_SIZES.title,
        color: COLORS.text,
        font: 'Calibri',
    },
    heading1: {
        bold: true,
        size: FONT_SIZES.heading1,
        color: COLORS.primary,
        font: 'Calibri',
    },
    heading2: {
        bold: true,
        size: FONT_SIZES.heading2,
        color: COLORS.text,
        font: 'Calibri',
    },
    heading3: {
        bold: true,
        size: FONT_SIZES.heading3,
        color: COLORS.text,
        font: 'Calibri',
    },
    body: {
        size: FONT_SIZES.body,
        color: COLORS.text,
        font: 'Calibri',
    },
    bodyBold: {
        bold: true,
        size: FONT_SIZES.body,
        color: COLORS.text,
        font: 'Calibri',
    },
    subtle: {
        size: FONT_SIZES.small,
        color: COLORS.lightText,
        font: 'Calibri',
    },
    link: {
        size: FONT_SIZES.body,
        color: COLORS.primary,
        font: 'Calibri',
        underline: {},
    },
    caption: {
        size: FONT_SIZES.caption,
        color: COLORS.lightText,
        font: 'Calibri',
    },
};

// Paragraph styles
export const PARAGRAPH_STYLES = {
    title: {
        alignment: AlignmentType.CENTER,
        spacing: { after: SPACING.paragraph },
    },
    heading: {
        spacing: { before: SPACING.section, after: SPACING.paragraph },
    },
    body: {
        spacing: { after: SPACING.paragraph, line: SPACING.line },
    },
    bullet: {
        spacing: { after: 120, line: SPACING.line },
    },
    contact: {
        alignment: AlignmentType.CENTER,
        spacing: { after: 60 },
    },
};

// Page margins
export const PAGE_MARGINS = {
    top: convertInchesToTwip(0.75),
    right: convertInchesToTwip(0.75),
    bottom: convertInchesToTwip(0.75),
    left: convertInchesToTwip(0.75),
};

// Section properties
export const SECTION_PROPERTIES = {
    page: {
        margin: PAGE_MARGINS,
    },
};
