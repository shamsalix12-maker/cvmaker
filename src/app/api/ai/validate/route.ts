// ============================================
// [F106] src/app/api/ai/validate/route.ts
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getAIProvider } from '@/lib/ai';
import { AIProviderName } from '@/lib/types';

// POST - Validate an API key without storing it
// POST - Validate an API key without storing it
export async function POST(request: NextRequest) {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { provider_name, api_key } = await request.json();

    if (!provider_name || !api_key) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    try {
        const provider = getAIProvider(provider_name as AIProviderName);
        const validation = await provider.validateKey(api_key);

        return NextResponse.json(validation);
    } catch (error: any) {
        return NextResponse.json({
            valid: false,
            error: error.message
        });
    }
}
