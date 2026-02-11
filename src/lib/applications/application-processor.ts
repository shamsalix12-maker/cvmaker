import { getAIProvider } from '@/lib/ai/ai-factory';
import { KeyService } from '@/lib/ai/key-service';
import { ApplicationPrompts } from './application-prompts';
import {
    JobApplication,
    ComprehensiveCV,
    DraftOutput,
    FinalOutput,
    AIProviderName,
    AISelection
} from '@/lib/types';

export class ApplicationProcessor {
    /**
     * Generate individual drafts using selected AI models
     */
    static async generateDrafts(
        application: JobApplication,
        cv: ComprehensiveCV,
        userId: string
    ): Promise<DraftOutput[]> {
        const draftSelections = application.ai_selections.filter(s => s.role === 'draft');
        const drafts: DraftOutput[] = [];

        for (const selection of draftSelections) {
            try {
                const apiKey = await KeyService.getDecryptedKey(selection.provider, userId);
                if (!apiKey) continue;

                const provider = getAIProvider(selection.provider);
                const prompt = ApplicationPrompts.getDraftingPrompt(
                    cv,
                    application.job_description,
                    application.tone_setting,
                    application.output_language
                );

                const response = await provider.complete(
                    { apiKey },
                    {
                        model: selection.model_id,
                        messages: [{ id: '1', role: 'user', content: prompt, timestamp: new Date().toISOString() }]
                    }
                );

                drafts.push({
                    id: crypto.randomUUID(),
                    ai_provider: selection.provider,
                    ai_model: selection.model_id,
                    content: response,
                    created_at: new Date().toISOString()
                });
            } catch (error) {
                console.error(`Drafting failed for ${selection.provider}:`, error);
            }
        }

        return drafts;
    }

    /**
     * Consolidate multiple drafts into the final output
     */
    static async consolidateDrafts(
        application: JobApplication,
        userId: string
    ): Promise<FinalOutput | null> {
        const finalSelection = application.ai_selections.find(s => s.role === 'final');
        if (!finalSelection || application.draft_outputs.length === 0) return null;

        try {
            const apiKey = await KeyService.getDecryptedKey(finalSelection.provider, userId);
            if (!apiKey) throw new Error('No API key for final model');

            const provider = getAIProvider(finalSelection.provider);
            const prompt = ApplicationPrompts.getConsolidationPrompt(
                application.draft_outputs.map(d => d.content),
                application.output_language
            );

            const response = await provider.complete(
                { apiKey },
                {
                    model: finalSelection.model_id,
                    messages: [{ id: '1', role: 'user', content: prompt, timestamp: new Date().toISOString() }],
                    jsonMode: true
                }
            );

            // Expected JSON response
            try {
                // Find potential JSON block in case AI adds preamble
                const jsonMatch = response.match(/\{[\s\S]*\}/);
                const jsonStr = jsonMatch ? jsonMatch[0] : response;
                const result = JSON.parse(jsonStr);

                return {
                    tailored_cv: result.tailored_cv || '',
                    cover_letter: result.cover_letter || '',
                    application_email: result.application_email || ''
                };
            } catch (e) {
                console.error('Failed to parse consolidation JSON:', e);
                // Fallback: use raw response if it was meant to be one part
                return {
                    tailored_cv: response,
                    cover_letter: '',
                    application_email: ''
                };
            }
        } catch (error) {
            console.error('Consolidation failed:', error);
            return null;
        }
    }

    /**
     * Simple analysis/clarification step
     */
    static async getClarifyingQuestions(
        cv: ComprehensiveCV,
        jobDescription: string,
        selection: AISelection,
        userId: string
    ): Promise<string | null> {
        try {
            const apiKey = await KeyService.getDecryptedKey(selection.provider, userId);
            if (!apiKey) return null;

            const provider = getAIProvider(selection.provider);
            const prompt = ApplicationPrompts.getAnalysisPrompt(cv, jobDescription);

            return await provider.complete(
                { apiKey },
                {
                    model: selection.model_id,
                    messages: [{ id: '1', role: 'user', content: prompt, timestamp: new Date().toISOString() }]
                }
            );
        } catch (error) {
            console.error('Clarification failed:', error);
            return null;
        }
    }
}
