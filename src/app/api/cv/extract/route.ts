// ============================================
// [F110] src/app/api/cv/extract/route.ts
// CV Extraction API Route
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { extractCVWithAI } from '@/lib/cv';
import { decryptApiKey } from '@/lib/encryption';
import { parseFile } from '@/lib/parsers';
import { AIProviderName } from '@/lib/types';

export async function POST(request: NextRequest) {
    const supabase = await createServerSupabaseClient();
    const userId = request.headers.get('x-user-id');

    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const rawText = formData.get('rawText') as string | null;
    const provider = formData.get('provider') as AIProviderName;
    const model = formData.get('model') as string;

    if (!provider || !model) {
        return NextResponse.json({
            error: 'AI provider and model are required',
        }, { status: 400 });
    }

    // Get the user's API key for this provider
    const { data: keyData, error: keyError } = await supabase
        .from('ai_api_keys')
        .select('api_key_encrypted')
        .eq('user_id', userId)
        .eq('provider_name', provider)
        .single();

    if (keyError || !keyData) {
        return NextResponse.json({
            error: `No API key found for ${provider}. Please add one in Settings.`,
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

    // Get the raw text (either from file or direct input)
    let textToProcess: string;

    if (file) {
        try {
            const parsed = await parseFile(file);
            textToProcess = parsed.text;
        } catch (error: any) {
            return NextResponse.json({
                error: `Failed to parse file: ${error.message}`,
            }, { status: 400 });
        }
    } else if (rawText) {
        textToProcess = rawText;
    } else {
        return NextResponse.json({
            error: 'Either file or rawText is required',
        }, { status: 400 });
    }

    // Extract CV fields using AI
    const result = await extractCVWithAI(
        {
            rawText: textToProcess,
            aiProvider: provider,
            aiModel: model,
        },
        apiKey
    );

    return NextResponse.json(result);
}
