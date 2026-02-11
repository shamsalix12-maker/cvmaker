// ============================================
// [F142] src/lib/generators/document-formatter.ts
// ============================================

export interface DocumentSection {
    type: 'heading' | 'paragraph' | 'list' | 'divider';
    level?: 1 | 2 | 3;
    content?: string;
    items?: string[];
}

export function parseContentToSections(content: string): DocumentSection[] {
    const sections: DocumentSection[] = [];
    const lines = content.split('\n');
    let currentList: string[] = [];

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();

        if (!line) {
            if (currentList.length > 0) {
                sections.push({ type: 'list', items: [...currentList] });
                currentList = [];
            }
            continue;
        }

        if (line.startsWith('### ')) {
            if (currentList.length > 0) { sections.push({ type: 'list', items: [...currentList] }); currentList = []; }
            sections.push({ type: 'heading', level: 3, content: line.slice(4) });
        } else if (line.startsWith('## ')) {
            if (currentList.length > 0) { sections.push({ type: 'list', items: [...currentList] }); currentList = []; }
            sections.push({ type: 'heading', level: 2, content: line.slice(3) });
        } else if (line.startsWith('# ')) {
            if (currentList.length > 0) { sections.push({ type: 'list', items: [...currentList] }); currentList = []; }
            sections.push({ type: 'heading', level: 1, content: line.slice(2) });
        } else if (line.startsWith('- ') || line.startsWith('• ') || line.startsWith('* ')) {
            currentList.push(line.slice(2));
        } else if (/^\d+\.\s/.test(line)) {
            currentList.push(line.replace(/^\d+\.\s/, ''));
        } else if (line === '---' || line === '***' || line === '___') {
            if (currentList.length > 0) { sections.push({ type: 'list', items: [...currentList] }); currentList = []; }
            sections.push({ type: 'divider' });
        } else {
            if (currentList.length > 0) { sections.push({ type: 'list', items: [...currentList] }); currentList = []; }
            sections.push({ type: 'paragraph', content: line });
        }
    }

    if (currentList.length > 0) {
        sections.push({ type: 'list', items: currentList });
    }

    return sections;
}

export function cleanText(text: string): string {
    return text
        .replace(/\*\*(.*?)\*\*/g, '$1')
        .replace(/\*(.*?)\*/g, '$1')
        .replace(/`(.*?)`/g, '$1')
        .replace(/\[(.*?)\]\(.*?\)/g, '$1')
        .trim();
}

export function formatDate(date: Date, locale: string = 'en'): string {
    return date.toLocaleDateString(locale === 'fa' ? 'fa-IR' : 'en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}
