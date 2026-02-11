// ============================================
// [F148] src/app/api/templates/route.ts
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createTemplateService } from '@/lib/templates';
import { TemplateType } from '@/lib/types';

export async function GET(request: NextRequest) {
    try {
        const supabase = await createServerSupabaseClient();
        const { data: { user } } = await supabase.auth.getUser();

        // Support Dev Auth
        let userId = user?.id;
        if (!userId) {
            const devUserId = request.headers.get('x-user-id');
            if (devUserId && devUserId.startsWith('dev-user-')) {
                userId = devUserId;
            }
        }

        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const type = searchParams.get('type');

        const service = createTemplateService(supabase);

        const templates = type
            ? await service.getTemplatesByType(userId, type as TemplateType)
            : await service.getTemplates(userId);

        return NextResponse.json({ templates });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const supabase = await createServerSupabaseClient();
        const { data: { user } } = await supabase.auth.getUser();

        // Support Dev Auth
        let userId = user?.id;
        if (!userId) {
            const devUserId = request.headers.get('x-user-id');
            if (devUserId && devUserId.startsWith('dev-user-')) {
                userId = devUserId;
            }
        }

        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { template_name, template_type, file_format, file_content } = body;

        if (!template_name || !template_type || !file_format || !file_content) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const service = createTemplateService(supabase);

        const template = await service.createTemplate(userId, {
            template_name,
            template_type,
            file_format,
            file_content
        });

        return NextResponse.json({ template, success: true });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
