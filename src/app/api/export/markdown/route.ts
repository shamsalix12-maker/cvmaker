// ============================================
// [F026] src/app/api/export/markdown/route.ts
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { generateMarkdown } from '@/lib/generators/markdown-generator';
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
        const { content, type, filename, includeMetadata, metadata } = body;

        if (!content) {
            return NextResponse.json(
                { error: 'Content is required' },
                { status: 400 }
            );
        }

        const docType: DocumentType = type || 'cv';
        const markdown = generateMarkdown({
            content,
            type: docType,
            title: filename,
            includeMetadata: includeMetadata ?? false,
            metadata,
        });

        const fileName = filename
            ? (filename.toLowerCase().endsWith('.md') ? filename : `${filename}.md`)
            : `${docType}-${Date.now()}.md`;

        return new NextResponse(markdown, {
            status: 200,
            headers: {
                'Content-Type': 'text/markdown; charset=utf-8',
                'Content-Disposition': `attachment; filename="${fileName}"`,
                'Content-Length': Buffer.byteLength(markdown, 'utf8').toString(),
            },
        });

    } catch (error: any) {
        console.error('Markdown generation error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to generate markdown' },
            { status: 500 }
        );
    }
}

// PUT - Convert HTML to Markdown (utility endpoint)
export async function PUT(request: NextRequest) {
    try {
        const supabase = await createServerSupabaseClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { html } = body;

        if (!html) {
            return NextResponse.json(
                { error: 'HTML content is required' },
                { status: 400 }
            );
        }

        const { htmlToMarkdown } = await import('@/lib/generators/markdown-generator');
        const markdown = htmlToMarkdown(html);

        return NextResponse.json({ markdown });

    } catch (error: any) {
        return NextResponse.json(
            { error: error.message || 'Conversion failed' },
            { status: 500 }
        );
    }
}
