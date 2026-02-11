// ============================================
// [F146] src/lib/templates/template-parser.ts
// ============================================

export interface TemplatePlaceholders {
    // Personal Info
    '{{NAME}}': string;
    '{{EMAIL}}': string;
    '{{PHONE}}': string;
    '{{LOCATION}}': string;
    '{{LINKEDIN}}': string;
    '{{WEBSITE}}': string;

    // Content
    '{{CONTENT}}': string;
    '{{CV_CONTENT}}': string;
    '{{COVER_LETTER_CONTENT}}': string;
    '{{EMAIL_CONTENT}}': string;

    // Job Info
    '{{JOB_TITLE}}': string;
    '{{COMPANY}}': string;

    // Date
    '{{DATE}}': string;
    '{{YEAR}}': string;

    [key: string]: string;
}

export function applyTemplate(
    templateContent: string,
    placeholders: Partial<TemplatePlaceholders>
): string {
    let result = templateContent;

    for (const [placeholder, value] of Object.entries(placeholders)) {
        if (value) {
            const regex = new RegExp(escapeRegex(placeholder), 'g');
            result = result.replace(regex, value);
        }
    }

    // Remove any remaining placeholders
    result = result.replace(/\{\{[A-Z_]+\}\}/g, '');

    return result;
}

function escapeRegex(string: string): string {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function extractPlaceholders(templateContent: string): string[] {
    const matches = templateContent.match(/\{\{[A-Z_]+\}\}/g);
    return matches ? [...new Set(matches)] : [];
}

export function validateTemplate(templateContent: string): {
    isValid: boolean;
    errors: string[];
    placeholders: string[];
} {
    const errors: string[] = [];
    const placeholders = extractPlaceholders(templateContent);

    // Check for required placeholders
    if (!placeholders.includes('{{CONTENT}}') &&
        !placeholders.includes('{{CV_CONTENT}}') &&
        !placeholders.includes('{{COVER_LETTER_CONTENT}}') &&
        !placeholders.includes('{{EMAIL_CONTENT}}')) {
        errors.push('Template must include at least one content placeholder ({{CONTENT}}, {{CV_CONTENT}}, etc.)');
    }

    // Check for unclosed placeholders
    const unclosed = templateContent.match(/\{\{[^}]*$/gm);
    if (unclosed) {
        errors.push('Template has unclosed placeholders');
    }

    return {
        isValid: errors.length === 0,
        errors,
        placeholders
    };
}

export const DEFAULT_CV_TEMPLATE = `# {{NAME}}

{{EMAIL}} | {{PHONE}} | {{LOCATION}}
{{LINKEDIN}} | {{WEBSITE}}

---

{{CV_CONTENT}}
`;

export const DEFAULT_COVER_LETTER_TEMPLATE = `{{DATE}}

Dear Hiring Manager,

{{COVER_LETTER_CONTENT}}

Sincerely,
{{NAME}}
{{EMAIL}}
{{PHONE}}
`;

export const DEFAULT_EMAIL_TEMPLATE = `Subject: Application for {{JOB_TITLE}} Position

{{EMAIL_CONTENT}}

Best regards,
{{NAME}}
`;
