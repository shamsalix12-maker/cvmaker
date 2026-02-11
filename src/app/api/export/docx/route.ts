// ============================================
// [F025] src/app/api/export/docx/route.ts
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { generateDocx } from '@/lib/generators/docx-generator';
import { DocumentType } from '@/lib/types';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
    try {
        const supabase = await createServerSupabaseClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { content, type, filename, metadata, locale } = body;

        if (!content) {
            return NextResponse.json(
                { error: 'Content is required' },
                { status: 400 }
            );
        }

        const docType: DocumentType = type || 'cv';
        const buffer = await generateDocx({
            content,
            type: docType,
            title: filename,
            metadata,
            locale: locale || 'en',
        });

        const fileName = filename
            ? (filename.toLowerCase().endsWith('.docx') ? filename : `${filename}.docx`)
            : `${docType}-${Date.now()}.docx`;

        return new NextResponse(new Uint8Array(buffer), {
            status: 200,
            headers: {
                'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'Content-Disposition': `attachment; filename="${fileName}"`,
                'Content-Length': buffer.length.toString(),
            },
        });

    } catch (error: any) {
        console.error('DOCX generation error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to generate document' },
            { status: 500 }
        );
    }
}
