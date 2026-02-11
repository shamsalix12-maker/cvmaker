// ============================================
// [F105] src/app/api/ai/keys/route.ts
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { encryptApiKey, decryptApiKey } from '@/lib/encryption';
import { getAIProvider } from '@/lib/ai';
import { AIProviderName, AIApiKey } from '@/lib/types';
import { isDevUser } from '@/lib/auth/dev-auth';

// GET - List all API keys for current user (without decrypted keys)
export async function GET(request: NextRequest) {
    const supabase = await createServerSupabaseClient();

    const { data: { user } } = await supabase.auth.getUser();

    // Support Dev Auth
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

    const { data, error } = await supabase
        .from('ai_api_keys')
        .select('id, provider_name, is_valid, available_models, token_balance, last_validated_at')
        .eq('user_id', userId);

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ keys: data });
}

// POST - Add or update an API key
export async function POST(request: NextRequest) {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Support Dev Auth
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
    const { provider_name, api_key } = body;

    if (!provider_name || !api_key) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    try {
        // Validate the key
        const provider = getAIProvider(provider_name as AIProviderName);
        const validation = await provider.validateKey(api_key);

        // Encrypt the key
        const encryptedKey = encryptApiKey(api_key);

        // Upsert the key
        const { data, error } = await supabase
            .from('ai_api_keys')
            .upsert({
                user_id: userId,
                provider_name,
                api_key_encrypted: encryptedKey,
                is_valid: validation.valid,
                available_models: validation.models || [],
                token_balance: validation.balance,
                last_validated_at: new Date().toISOString()
            }, {
                onConflict: 'user_id,provider_name'
            })
            .select()
            .single();

        if (error) {
            console.error('Supabase error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Don't return the encrypted key
        const { api_key_encrypted, ...safeData } = data;

        return NextResponse.json({
            key: safeData,
            validation: {
                valid: validation.valid,
                error: validation.error,
                models: validation.models
            }
        });
    } catch (err: any) {
        console.error('Error in POST /api/ai/keys:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

// DELETE - Remove an API key
export async function DELETE(request: NextRequest) {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Support Dev Auth
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
    const provider = searchParams.get('provider');

    if (!provider) {
        return NextResponse.json({ error: 'Provider required' }, { status: 400 });
    }

    const { error } = await supabase
        .from('ai_api_keys')
        .delete()
        .eq('user_id', userId)
        .eq('provider_name', provider);

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
}
