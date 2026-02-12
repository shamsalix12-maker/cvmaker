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
    CV_REFINE_SYSTEM_PROMPT,
    CV_REFINE_USER_PROMPT,
} from './cv-extraction-prompt';
import { validateExtractedCV, getCompletionPercentage } from './cv-validator';
import { generateId } from '@/lib/helpers';

/**
 * Transforms raw AI output into a standardized ComprehensiveCV structure
 */
function transformAICVData(parsed: any, rawText?: string): Partial<ComprehensiveCV> {
    return {
        personal_info: parsed.personal_info || {},
        work_experience: (parsed.work_experience || []).map((w: any) => ({
            job_title: w.job_title || '',
            company: w.company || '',
            location: w.location || '',
            start_date: w.start_date || '',
            end_date: w.end_date || null,
            is_current: !!w.is_current,
            description: w.description || '',
            achievements: w.achievements || [],
            id: w.id || generateId(),
        })),
        education: (parsed.education || []).map((e: any) => ({
            degree: e.degree || '',
            field_of_study: e.field_of_study || '',
            institution: e.institution || '',
            location: e.location || '',
            start_date: e.start_date || '',
            end_date: e.end_date || '',
            gpa: e.gpa || null,
            description: e.description || '',
            id: e.id || generateId(),
        })),
        skills: parsed.skills || [],
        certifications: (parsed.certifications || []).map((c: any) => ({
            name: c.name || '',
            issuer: c.issuer || '',
            date_obtained: c.date_obtained || '',
            expiry_date: c.expiry_date || null,
            credential_id: c.credential_id || null,
            credential_url: c.credential_url || null,
            id: c.id || generateId(),
        })),
        languages: (parsed.languages || []).map((l: any) => ({
            language: l.language || '',
            proficiency: (l.proficiency?.toLowerCase() || 'intermediate') as any,
        })),
        projects: (parsed.projects || []).map((p: any) => ({
            name: p.name || '',
            description: p.description || '',
            technologies: p.technologies || [],
            url: p.url || null,
            start_date: p.start_date || null,
            end_date: p.end_date || null,
            id: p.id || generateId(),
        })),
        additional_sections: [],
        raw_text: rawText || parsed.raw_text,
    };
}

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
        console.log(`[CV Extractor] Starting extraction with ${aiProvider}: ${aiModel}`);
        const response = await provider.complete(config, options);
        console.log(`[CV Extractor] Raw response received. Length: ${response.length}`);

        const parsed = provider.parseJsonResponse<any>(response);
        console.log(`[CV Extractor] Parsed response:`, parsed ? 'SUCCESS' : 'FAILED');

        if (!parsed) {
            console.error(`[CV Extractor] Failed to parse JSON. Raw response head: ${response.substring(0, 100)}...`);
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
        const cv = transformAICVData(parsed, rawText);

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
        console.error(`[CV Extractor] Critical error:`, error);
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

/**
 * Refines an existing CV based on user edits or instructions
 */
export async function refineCVWithAI(
    currentCV: Partial<ComprehensiveCV>,
    apiKey: string,
    aiProvider: string,
    aiModel: string,
    instructions?: string,
    additionalText?: string
): Promise<CVExtractionResult> {
    const provider = getAIProvider(aiProvider as any);

    const config: AIProviderConfig = {
        apiKey,
        temperature: 0.2, // Slightly higher for refinement creativity
        maxTokens: 4096,
    };

    const options: AICompletionOptions = {
        model: aiModel,
        messages: [
            { id: 'sys-refine', role: 'system', content: CV_REFINE_SYSTEM_PROMPT, timestamp: new Date().toISOString() },
            { id: 'usr-refine', role: 'user', content: CV_REFINE_USER_PROMPT(currentCV, additionalText, instructions), timestamp: new Date().toISOString() },
        ],
        jsonMode: true,
    };

    try {
        console.log(`[CV Refiner] Starting refinement with ${aiProvider}: ${aiModel}`);
        const response = await provider.complete(config, options);
        const parsed = provider.parseJsonResponse<any>(response);

        if (!parsed) {
            throw new Error('Failed to parse AI response as JSON');
        }

        const cv = transformAICVData(parsed, additionalText || currentCV.raw_text);
        const fieldStatuses = validateExtractedCV(cv);
        const completionPercentage = getCompletionPercentage(fieldStatuses);

        return {
            success: true,
            cv,
            fieldStatuses,
            confidence: parsed.confidence || completionPercentage,
            rawText: additionalText || currentCV.raw_text || '',
            aiProvider: aiProvider as any,
            aiModel,
            extractionNotes: parsed.notes,
        };
    } catch (error: any) {
        console.error(`[CV Refiner] Error:`, error);
        return {
            success: false,
            cv: currentCV,
            fieldStatuses: validateExtractedCV(currentCV),
            confidence: 0,
            rawText: additionalText || currentCV.raw_text || '',
            aiProvider: aiProvider as any,
            aiModel,
            extractionNotes: `Refinement failed: ${error.message}`,
        };
    }
}

