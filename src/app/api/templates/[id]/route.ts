// ============================================
// [F149] src/app/api/templates/[id]/route.ts
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createTemplateService } from '@/lib/templates';

interface RouteParams {
    params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;
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

        const service = createTemplateService(supabase);

        const template = await service.getTemplate(id, userId);

        if (!template) {
            return NextResponse.json({ error: 'Not found' }, { status: 404 });
        }

        return NextResponse.json({ template });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;
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

        const service = createTemplateService(supabase);

        const template = await service.updateTemplate(id, userId, body);

        return NextResponse.json({ template, success: true });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;
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

        const service = createTemplateService(supabase);

        await service.deleteTemplate(id, userId);

        return NextResponse.json({ success: true });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
