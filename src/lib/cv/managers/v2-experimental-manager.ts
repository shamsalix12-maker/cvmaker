import {
    CVExtractionRequest,
    ComprehensiveCV,
    AIProviderName
} from '@/lib/types';
import {
    CVDomainId,
    CVGapAnalysis
} from '@/lib/types/cv-domain.types';
import { getAIProvider } from '@/lib/ai';
import { AIProviderConfig, AICompletionOptions } from '@/lib/ai/ai-provider';
import {
    buildExtractionUserPrompt,
    buildStageExtractionPrompt
} from '../cv-extraction-prompt';
import { validateExtractedCV } from '../cv-validator';
import { detectDomains } from '../cv-domains';
import {
    safeParseJSON,
} from '../multi-stage-extractor';
import {
    CVRefinementRequest,
    EnhancedCVExtractionResult,
    CVExtractionStage
} from './types';
import { V1StableManager } from './v1-stable-manager';

/**
 * Experimental Manager (V2)
 * Implements a sequential section-by-section extraction strategy.
 */
export class V2ExperimentalManager extends V1StableManager {
    readonly id: string = 'v2-experimental';
    readonly name: string = 'Experimental Manager';
    readonly version: string = '2.0.0-alpha';

    async extract(request: CVExtractionRequest & { selectedDomains?: CVDomainId[], cvLanguage?: string }): Promise<EnhancedCVExtractionResult> {
        const { rawText, aiProvider, aiModel, apiKey, extractionStage, existingCV } = request as any;

        // If no stage is provided, or it's 'full', use the standard V1 logic
        if (!extractionStage || extractionStage === CVExtractionStage.FULL) {
            console.log(`[${this.name}] Running full extraction (V1 fallback)`);
            return super.extract(request);
        }

        console.log(`[${this.name}] Running sequential extraction: Stage "${extractionStage}"`);

        const selectedDomains: CVDomainId[] =
            (request.selectedDomains && Array.isArray(request.selectedDomains) && request.selectedDomains.length > 0)
                ? request.selectedDomains
                : ['general' as CVDomainId];

        const cvLanguage: string = request.cvLanguage || 'en';
        const detectedDomains = detectDomains(rawText || '');

        try {
            const provider = getAIProvider(aiProvider);
            const config: AIProviderConfig = {
                apiKey,
                temperature: 0,
                maxTokens: 32768,
            };

            const systemPrompt = buildStageExtractionPrompt(extractionStage, selectedDomains, cvLanguage);

            let userPrompt = buildExtractionUserPrompt(rawText, selectedDomains);
            if (existingCV) {
                userPrompt += `\n\nCURRENT PROGRESS (ALREADY EXTRACTED DATA):\n${JSON.stringify(existingCV, null, 2)}\n\nIMPORTANT: Focus on the requested stage. Ensure consistency with already extracted data.`;
            }

            const options: AICompletionOptions = {
                model: aiModel,
                messages: [
                    { id: 'sys-extract', role: 'system', content: systemPrompt, timestamp: new Date().toISOString() },
                    { id: 'usr-extract', role: 'user', content: userPrompt, timestamp: new Date().toISOString() },
                ],
                jsonMode: true,
            };

            const response = await provider.complete(config, options);
            if (!response) throw new Error('AI provider returned an empty response');

            let parsed = safeParseJSON(response);
            if (!parsed) throw new Error('AI returned invalid JSON');

            const cv = this.transformExtractedData(parsed, rawText);
            const aiGapAnalysis = this.transformGapAnalysis(parsed, selectedDomains);
            const allGaps = this.buildComprehensiveGaps(cv, selectedDomains, aiGapAnalysis?.gaps || []);

            // Filter gaps to only include those relevant to the current stage
            let filteredGaps = allGaps;
            if (extractionStage === 'personal_info') {
                filteredGaps = allGaps.filter(g => g.field_path.startsWith('personal_info') || g.field_path === '');
            } else if (extractionStage === 'work_experience') {
                filteredGaps = allGaps.filter(g => g.field_path.startsWith('work_experience'));
            } else if (extractionStage === 'education') {
                filteredGaps = allGaps.filter(g => g.field_path.startsWith('education'));
            } else if (extractionStage === 'skills') {
                filteredGaps = allGaps.filter(g => g.field_path.startsWith('skills'));
            } else if (extractionStage === 'others') {
                const otherPaths = ['projects', 'certifications', 'languages', 'additional_sections'];
                filteredGaps = allGaps.filter(g => otherPaths.some(path => g.field_path.startsWith(path)));
            }

            const gapAnalysis: CVGapAnalysis = {
                selected_domains: selectedDomains,
                detected_domains: aiGapAnalysis?.detected_domains || [],
                overall_score: aiGapAnalysis?.overall_score || 0,
                domain_scores: aiGapAnalysis?.domain_scores || {},
                gaps: filteredGaps,
                strengths: aiGapAnalysis?.strengths || [],
                analysis_summary: aiGapAnalysis?.analysis_summary || '',
                general_recommendations: aiGapAnalysis?.general_recommendations || [],
            };

            const metadata = this.transformMetadata(parsed);
            const fieldStatuses = validateExtractedCV(cv);

            return {
                success: true,
                cv,
                fieldStatuses,
                confidence: metadata?.confidence || aiGapAnalysis?.overall_score || 0,
                rawText,
                aiProvider: aiProvider as AIProviderName,
                aiModel,
                extractionNotes: `Stage: ${extractionStage}. ${metadata?.notes || ''}`,
                gapAnalysis,
                detectedDomains,
                metadata,
                suggestedImprovements: [],
                translationsApplied: [],
                cvLanguage,
                extractionStage: extractionStage as CVExtractionStage,
            };
        } catch (error: any) {
            console.error(`[${this.name}] Stage Extraction Error:`, error);
            const result = this.buildErrorResult(rawText, aiProvider, aiModel, detectedDomains, error.message);
            return { ...result, extractionStage: extractionStage as CVExtractionStage };
        }
    }
}
