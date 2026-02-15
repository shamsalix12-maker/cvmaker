import { getAIProvider } from '@/lib/ai';
import { AIProviderConfig, AICompletionOptions } from '@/lib/ai/ai-provider';
import { AIProviderName } from '@/lib/types';
import { CanonicalCV } from './types';
import {
    buildRenderingSystemPrompt,
    buildRenderingUserPrompt
} from './prompts';

export interface RenderingResult {
    success: boolean;
    text: string | null;
    error?: string;
}

export class Renderer {
    constructor(
        private providerName: AIProviderName,
        private model: string,
        private apiKey: string
    ) { }

    async render(cv: CanonicalCV, domains: string[] = ['general']): Promise<RenderingResult> {
        console.log(`[Renderer] Starting rendering for CV ${cv.id} for domains: ${domains.join(', ')}`);

        try {
            const provider = getAIProvider(this.providerName);

            const config: AIProviderConfig = {
                apiKey: this.apiKey,
                temperature: 0, // Keep deterministic
                maxTokens: 32768, // Allow for long CVs
            };

            const options: AICompletionOptions = {
                model: this.model,
                messages: [
                    {
                        id: 'sys-render',
                        role: 'system',
                        content: buildRenderingSystemPrompt(),
                        timestamp: new Date().toISOString(),
                    },
                    {
                        id: 'usr-render',
                        role: 'user',
                        content: buildRenderingUserPrompt(JSON.stringify(cv, null, 2), domains),
                        timestamp: new Date().toISOString(),
                    },
                ],
                jsonMode: false, // Output is text
            };

            const response = await provider.complete(config, options);
            if (!response) {
                throw new Error('AI provider returned empty response');
            }

            return {
                success: true,
                text: response.trim(),
            };

        } catch (error: any) {
            console.error('[Renderer] Rendering error:', error);
            return {
                success: true, // We might fallback to basic rendering if AI fails
                text: null,
                error: error.message,
            };
        }
    }

    /**
     * Deterministic fallback rendering if AI fails.
     */
    renderTextFallback(cv: CanonicalCV): string {
        let text = `${cv.identity.full_name}\n`;
        text += `${cv.identity.email} | ${cv.identity.phone} | ${cv.identity.location}\n`;
        if (cv.identity.linkedin_url) text += `LinkedIn: ${cv.identity.linkedin_url}\n`;
        if (cv.identity.website_url) text += `Website: ${cv.identity.website_url}\n`;
        if (cv.identity.summary) text += `\nSUMMARY\n${cv.identity.summary}\n`;

        const renderSection = (title: string, items: any[]) => {
            if (items.length === 0) return '';
            let s = `\n${title.toUpperCase()}\n`;
            for (const item of items) {
                if (item.job_title) {
                    s += `${item.job_title} @ ${item.company} (${item.start_date} - ${item.end_date || 'Present'})\n`;
                    if (item.description) s += `${item.description}\n`;
                    if (item.achievements?.length > 0) s += `Achievements:\n - ${item.achievements.join('\n - ')}\n`;
                } else if (item.degree) {
                    s += `${item.degree} in ${item.field_of_study}, ${item.institution} (${item.start_date} - ${item.end_date})\n`;
                    if (item.description) s += `${item.description}\n`;
                } else if (item.title) {
                    s += `${item.title}\n${item.content}\n`;
                } else if (typeof item === 'string') {
                    s += `- ${item}\n`;
                }

                // Render metadata (Lossless Extraction)
                if (item.metadata && Object.keys(item.metadata).length > 0) {
                    Object.entries(item.metadata).forEach(([k, v]) => {
                        if (v) s += `${k}: ${typeof v === 'object' ? JSON.stringify(v) : v}\n`;
                    });
                }
                s += `\n`;
            }
            return s;
        };

        text += renderSection('Experience', cv.experience);
        text += renderSection('Education', cv.education);
        text += renderSection('Skills', cv.skills);
        text += renderSection('Projects', cv.projects);
        text += renderSection('Certifications', cv.certifications);
        text += renderSection('Publications', cv.publications);
        text += renderSection('Awards', cv.awards);
        text += renderSection('Teaching', cv.teaching);
        text += renderSection('Clinical', cv.clinical);
        text += renderSection('Volunteering', cv.volunteering);
        text += renderSection('Other', cv.other);

        // Global metadata
        if (cv.metadata && Object.keys(cv.metadata).length > 0) {
            text += `\nADDITIONAL DATA\n`;
            Object.entries(cv.metadata).forEach(([k, v]) => {
                text += `${k}: ${typeof v === 'object' ? JSON.stringify(v) : v}\n`;
            });
        }

        return text;
    }
}
