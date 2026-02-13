import { NextRequest, NextResponse } from 'next/server';
import { getAIProvider } from '@/lib/ai';
import { AIProviderConfig, AICompletionOptions } from '@/lib/ai/ai-provider';
import { AIProviderName } from '@/lib/types';
import { CV_EXTRACTION_SYSTEM_PROMPT, CV_EXTRACTION_USER_PROMPT } from '@/lib/cv/cv-extraction-prompt';

export async function POST(request: NextRequest) {
    console.log('[Test Extract] Starting...');

    try {
        const contentType = request.headers.get('content-type') || '';
        if (!contentType.includes('multipart/form-data')) {
            return NextResponse.json({ error: 'Expected multipart/form-data' }, { status: 400 });
        }

        const formData = await request.formData();
        const rawText = formData.get('rawText') as string | null;
        const provider = formData.get('provider') as AIProviderName;
        const model = formData.get('model') as string;
        const apiKey = request.headers.get('x-api-key-bypass');

        console.log('[Test Extract] Params:', {
            hasText: !!rawText,
            textLength: rawText?.length || 0,
            provider,
            model,
            hasKey: !!apiKey
        });

        if (!rawText || !provider || !model || !apiKey) {
            return NextResponse.json({ 
                error: 'Missing required fields',
                hasText: !!rawText,
                hasProvider: !!provider,
                hasModel: !!model,
                hasKey: !!apiKey
            }, { status: 400 });
        }

        const aiProvider = getAIProvider(provider);
        
        const config: AIProviderConfig = {
            apiKey,
            temperature: 0.1,
            maxTokens: 8192,
        };

        const systemPrompt = CV_EXTRACTION_SYSTEM_PROMPT;
        const userPrompt = CV_EXTRACTION_USER_PROMPT(rawText);

        console.log('[Test Extract] System prompt length:', systemPrompt.length);
        console.log('[Test Extract] User prompt length:', userPrompt.length);

        const options: AICompletionOptions = {
            model,
            messages: [
                { id: 'sys-1', role: 'system', content: systemPrompt, timestamp: new Date().toISOString() },
                { id: 'usr-1', role: 'user', content: userPrompt, timestamp: new Date().toISOString() },
            ],
            jsonMode: true,
        };

        console.log('[Test Extract] Calling AI...');
        const rawAIResponse = await aiProvider.complete(config, options);
        console.log('[Test Extract] AI response length:', rawAIResponse?.length || 0);
        console.log('[Test Extract] AI response preview:', rawAIResponse?.substring(0, 500));

        let parsed = null;
        let parseError = null;

        try {
            parsed = aiProvider.parseJsonResponse<any>(rawAIResponse);
            console.log('[Test Extract] Parse success:', !!parsed);
        } catch (e: any) {
            parseError = e.message;
            console.log('[Test Extract] Parse failed:', e.message);
        }

        return NextResponse.json({
            success: !!parsed,
            rawAIResponse,
            parsed,
            parseError,
            meta: {
                provider,
                model,
                textLength: rawText.length,
                responseLength: rawAIResponse?.length || 0
            }
        });

    } catch (error: any) {
        console.error('[Test Extract] Error:', error);
        return NextResponse.json({
            error: error.message,
            stack: error.stack
        }, { status: 500 });
    }
}
