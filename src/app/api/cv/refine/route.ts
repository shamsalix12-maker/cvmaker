// ============================================
// src/app/api/cv/refine/route.ts
// CV Refinement API Route
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { refineCVWithAI } from '@/lib/cv';
import { decryptApiKey } from '@/lib/encryption';
import { AIProviderName } from '@/lib/types';
import { getUserId } from '@/lib/auth/server-auth';
import { DEFAULT_MODELS } from '@/lib/constants';

export async function POST(request: NextRequest) {
    const userId = await getUserId(request);

    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createServerSupabaseClient();
    const body = await request.json();

    const { cv, instructions, provider, model } = body;

    const aiProvider = provider || 'google';
    const aiModel = model || DEFAULT_MODELS[aiProvider as AIProviderName];

    // Get the user's API key for this provider
    const { data: keyData, error: keyError } = await supabase
        .from('ai_api_keys')
        .select('api_key_encrypted')
        .eq('user_id', userId)
        .eq('provider_name', aiProvider)
        .single();

    if (keyError || !keyData) {
        return NextResponse.json({
            error: `No API key found for ${aiProvider}. Please add one in Settings.`,
        }, { status: 400 });
    }

    // Decrypt the API key
    let apiKey: string;
    try {
        apiKey = decryptApiKey(keyData.api_key_encrypted);
    } catch {
        return NextResponse.json({
            error: 'Failed to decrypt API key',
        }, { status: 500 });
    }

    // Refine CV using AI
    const result = await refineCVWithAI(
        cv,
        apiKey,
        aiProvider,
        aiModel,
        instructions
    );

    return NextResponse.json(result);
}
