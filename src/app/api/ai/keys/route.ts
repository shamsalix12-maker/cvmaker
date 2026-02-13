// ============================================
// [F105] src/app/api/ai/keys/route.ts
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase/server';
import { encryptApiKey, decryptApiKey } from '@/lib/encryption';
import { getAIProvider } from '@/lib/ai';
import { AIProviderName, AIApiKey } from '@/lib/types';
import { isDevUser } from '@/lib/auth/dev-auth';
import { getUserId } from '@/lib/auth/server-auth';

// GET - List all API keys for current user (without decrypted keys)
export async function GET(request: NextRequest) {
    const userId = await getUserId(request);
    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createServerSupabaseClient();

    const { data, error } = await supabase
        .from('ai_api_keys')
        .select('id, provider_name, is_valid, available_models, token_balance, last_validated_at')
        .eq('user_id', userId);

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (isDevUser(userId)) {
        const mockKeys = [
            {
                id: 'mock-openai-key',
                provider_name: 'openai' as AIProviderName,
                is_valid: true,
                available_models: [
                    { model_id: 'gpt-4o', model_name: 'GPT-4o' },
                    { model_id: 'gpt-4o-mini', model_name: 'GPT-4o Mini' },
                ],
                token_balance: null,
                last_validated_at: new Date().toISOString(),
            },
            {
                id: 'mock-anthropic-key',
                provider_name: 'anthropic' as AIProviderName,
                is_valid: true,
                available_models: [
                    { model_id: 'claude-3-5-sonnet-20241022', model_name: 'Claude 3.5 Sonnet' },
                    { model_id: 'claude-3-opus-20240229', model_name: 'Claude 3 Opus' },
                ],
                token_balance: null,
                last_validated_at: new Date().toISOString(),
            },
            {
                id: 'mock-google-key',
                provider_name: 'google' as AIProviderName,
                is_valid: true,
                available_models: [
                    { model_id: 'gemini-2.5-flash', model_name: 'Gemini 2.5 Flash' },
                    { model_id: 'gemini-2.0-flash', model_name: 'Gemini 2.0 Flash' },
                ],
                token_balance: null,
                last_validated_at: new Date().toISOString(),
            },
        ];
        const combinedKeys = [...(data || []), ...mockKeys];
        console.log('[API Keys GET] Dev user - returning mock keys + DB keys:', combinedKeys.length);
        return NextResponse.json({ keys: combinedKeys });
    }

    return NextResponse.json({ keys: data });
}

// POST - Add or update an API key
export async function POST(request: NextRequest) {
    const userId = await getUserId(request);
    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createServerSupabaseClient();

    const body = await request.json();
    const { provider_name, api_key } = body;

    if (!provider_name || !api_key) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Verify key validation
    const provider = getAIProvider(provider_name as AIProviderName);
    const validation = await provider.validateKey(api_key);

    // MOCK BYPASS: If test key, return success immediately without DB write
    if (api_key === 'TEST_KEY_MOCK') {
        return NextResponse.json({
            key: {
                id: 'mock-key-id',
                provider_name,
                is_valid: true,
                available_models: validation.models,
                token_balance: 0,
                last_validated_at: new Date().toISOString()
            },
            validation: {
                valid: true,
                error: null,
                models: validation.models
            }
        });
    }

    try {
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
    const userId = await getUserId(request);
    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createServerSupabaseClient();

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
