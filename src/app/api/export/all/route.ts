// ============================================
// [F144] src/app/api/export/all/route.ts
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { generateDocx } from '@/lib/generators';
import JSZip from 'jszip';

export async function POST(request: NextRequest) {
    try {
        const { documents, name, format, locale } = await request.json();

        if (!documents || !documents.tailored_cv || !documents.cover_letter || !documents.application_email) {
            return NextResponse.json({ error: 'All documents are required' }, { status: 400 });
        }

        const zip = new JSZip();
        const baseName = name || 'application';

        if (format === 'docx' || format === 'both') {
            const cvBuffer = await generateDocx({
                content: documents.tailored_cv,
                title: `${baseName} - CV`,
                type: 'cv',
                locale: locale || 'en'
            });
            zip.file(`${baseName}-cv.docx`, cvBuffer);

            const coverBuffer = await generateDocx({
                content: documents.cover_letter,
                title: `${baseName} - Cover Letter`,
                type: 'cover_letter',
                locale: locale || 'en'
            });
            zip.file(`${baseName}-cover-letter.docx`, coverBuffer);

            const emailBuffer = await generateDocx({
                content: documents.application_email,
                title: `${baseName} - Application Email`,
                type: 'email',
                locale: locale || 'en'
            });
            zip.file(`${baseName}-email.docx`, emailBuffer);
        }

        if (format === 'md' || format === 'both') {
            zip.file(`${baseName}-cv.md`, documents.tailored_cv);
            zip.file(`${baseName}-cover-letter.md`, documents.cover_letter);
            zip.file(`${baseName}-email.md`, documents.application_email);
        }

        const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });

        return new NextResponse(new Uint8Array(zipBuffer), {
            headers: {
                'Content-Type': 'application/zip',
                'Content-Disposition': `attachment; filename="${baseName}-documents.zip"`,
            },
        });
    } catch (error: any) {
        console.error('ZIP export error:', error);
        return NextResponse.json({ error: error.message || 'Export failed' }, { status: 500 });
    }
}
