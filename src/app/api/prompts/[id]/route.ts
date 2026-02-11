// ============================================
// [F118] src/app/api/prompts/[id]/route.ts
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createPromptService } from '@/lib/prompts';

// GET - Get single prompt
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const supabase = await createServerSupabaseClient();
        const { data: { user } } = await supabase.auth.getUser();

        // Support Dev Auth (Optional for GET usually, but good for consistency)
        let userId = user?.id;
        if (!userId) {
            const devUserId = request.headers.get('x-user-id');
            if (devUserId && devUserId.startsWith('dev-user-')) {
                userId = devUserId;
            }
        }

        // Allow unauthenticated GET for prompts if needed? No, user wanted secured routes.
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const promptService = createPromptService(supabase);

        const prompt = await promptService.getPromptById(id);
        if (!prompt) {
            return NextResponse.json({ error: 'Prompt not found' }, { status: 404 });
        }
        return NextResponse.json({ prompt });
    } catch (error: any) {
        return NextResponse.json(
            { error: error.message || 'Failed to fetch prompt' },
            { status: 500 }
        );
    }
}

// PUT - Update prompt
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
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
        const promptService = createPromptService(supabase);

        const existing = await promptService.getPromptById(id);
        if (!existing) {
            return NextResponse.json({ error: 'Prompt not found' }, { status: 404 });
        }

        const prompt = await promptService.updatePrompt(id, body);
        return NextResponse.json({ prompt, success: true });
    } catch (error: any) {
        return NextResponse.json(
            { error: error.message || 'Failed to update prompt' },
            { status: 500 }
        );
    }
}

// DELETE - Delete prompt
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
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

        const promptService = createPromptService(supabase);

        await promptService.deletePrompt(id);
        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json(
            { error: error.message || 'Failed to delete prompt' },
            { status: 500 }
        );
    }
}

// PATCH - Toggle active status
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
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

        const promptService = createPromptService(supabase);

        const prompt = await promptService.togglePromptActive(id);
        return NextResponse.json({ prompt, success: true });
    } catch (error: any) {
        return NextResponse.json(
            { error: error.message || 'Failed to toggle prompt' },
            { status: 500 }
        );
    }
}
