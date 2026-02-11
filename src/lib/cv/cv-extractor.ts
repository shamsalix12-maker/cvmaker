// ============================================
// [F074] src/lib/cv/cv-extractor.ts
// AI-Powered CV Field Extraction
// ============================================

import { getAIProvider } from '@/lib/ai';
import { AIProviderConfig, AICompletionOptions } from '@/lib/ai/ai-provider';
import {
    CVExtractionResult,
    CVExtractionRequest,
    ComprehensiveCV,
} from '@/lib/types';
import {
    CV_EXTRACTION_SYSTEM_PROMPT,
    CV_EXTRACTION_USER_PROMPT,
} from './cv-extraction-prompt';
import { validateExtractedCV, getCompletionPercentage } from './cv-validator';
import { generateId } from '@/lib/helpers';

export async function extractCVWithAI(
    request: CVExtractionRequest,
    apiKey: string
): Promise<CVExtractionResult> {
    const { rawText, aiProvider, aiModel } = request;

    const provider = getAIProvider(aiProvider);

    const config: AIProviderConfig = {
        apiKey,
        temperature: 0.1, // Low temperature for consistent extraction
        maxTokens: 4096,
    };

    const options: AICompletionOptions = {
        model: aiModel,
        messages: [
            { id: 'sys-1', role: 'system', content: CV_EXTRACTION_SYSTEM_PROMPT, timestamp: new Date().toISOString() },
            { id: 'usr-1', role: 'user', content: CV_EXTRACTION_USER_PROMPT(rawText), timestamp: new Date().toISOString() },
        ],
        jsonMode: true, // Request JSON output where supported
    };

    try {
        const response = await provider.complete(config, options);
        const parsed = provider.parseJsonResponse<any>(response);

        if (!parsed) {
            return {
                success: false,
                cv: {},
                fieldStatuses: [],
                confidence: 0,
                rawText,
                aiProvider,
                aiModel,
                extractionNotes: 'Failed to parse AI response as JSON',
            };
        }

        // Transform parsed data to our CV structure
        const cv: Partial<ComprehensiveCV> = {
            personal_info: parsed.personal_info || {},
            work_experience: (parsed.work_experience || []).map((w: any) => ({
                ...w,
                id: w.id || generateId(),
            })),
            education: (parsed.education || []).map((e: any) => ({
                ...e,
                id: e.id || generateId(),
            })),
            skills: parsed.skills || [],
            certifications: (parsed.certifications || []).map((c: any) => ({
                ...c,
                id: c.id || generateId(),
            })),
            languages: parsed.languages || [],
            projects: (parsed.projects || []).map((p: any) => ({
                ...p,
                id: p.id || generateId(),
            })),
            additional_sections: [],
            raw_text: rawText,
        };

        const fieldStatuses = validateExtractedCV(cv);
        const completionPercentage = getCompletionPercentage(fieldStatuses);

        return {
            success: true,
            cv,
            fieldStatuses,
            confidence: parsed.confidence || completionPercentage,
            rawText,
            aiProvider,
            aiModel,
            extractionNotes: parsed.notes,
        };
    } catch (error: any) {
        return {
            success: false,
            cv: {},
            fieldStatuses: [],
            confidence: 0,
            rawText,
            aiProvider,
            aiModel,
            extractionNotes: `Extraction failed: ${error.message}`,
        };
    }
}
