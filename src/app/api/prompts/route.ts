// ============================================
// [F024] src/app/api/prompts/route.ts
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createPromptService } from '@/lib/prompts';
import { isDevUser } from '@/lib/auth/dev-auth';

// GET - List all prompts
export async function GET(request: NextRequest) {
    try {
        const supabase = await createServerSupabaseClient();
        const { data: { user } } = await supabase.auth.getUser();

        let userId = user?.id;
        if (!userId) {
            const devUserId = request.headers.get('x-user-id');
            if (isDevUser(devUserId)) {
                userId = devUserId as string;
            }
        }

        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const activeOnly = searchParams.get('active') === 'true';
        const category = searchParams.get('category');
        const search = searchParams.get('search');
        const locale = (searchParams.get('locale') || 'en') as 'en' | 'fa';
        const promptService = createPromptService(supabase);

        let prompts;

        if (search) {
            prompts = await promptService.searchPrompts(search, locale);
        } else if (category) {
            prompts = await promptService.getPromptsByCategory(category);
        } else {
            prompts = await promptService.getAllPrompts(activeOnly);
        }

        return NextResponse.json({ prompts });
    } catch (error: any) {
        console.error('GET /api/prompts error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to fetch prompts' },
            { status: 500 }
        );
    }
}

// POST - Create new prompt
export async function POST(request: NextRequest) {
    try {
        const supabase = await createServerSupabaseClient();
        const { data: { user } } = await supabase.auth.getUser();

        let userId = user?.id;
        if (!userId) {
            const devUserId = request.headers.get('x-user-id');
            if (isDevUser(devUserId)) {
                userId = devUserId as string;
            }
        }

        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const {
            title_en, title_fa, description_en, description_fa,
            prompt_text, category, is_active = true, sort_order = 0
        } = body;

        if (!title_en || !title_fa || !prompt_text) {
            return NextResponse.json(
                { error: 'title_en, title_fa, and prompt_text are required' },
                { status: 400 }
            );
        }

        const promptService = createPromptService(supabase);

        const prompt = await promptService.createPrompt({
            title_en, title_fa,
            description_en: description_en || '',
            description_fa: description_fa || '',
            prompt_text,
            category: category || 'general',
            is_active, sort_order
        });

        return NextResponse.json({ prompt, success: true });
    } catch (error: any) {
        console.error('POST /api/prompts error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to create prompt' },
            { status: 500 }
        );
    }
}
