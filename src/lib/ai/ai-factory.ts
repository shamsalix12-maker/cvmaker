// ============================================
// [F070] src/lib/ai/ai-factory.ts
// ============================================

import { AIProviderName } from '@/lib/types';
import { AIProvider } from './ai-provider';
import { OpenAIProvider } from './openai-provider';
import { AnthropicProvider } from './anthropic-provider';
import { GoogleAIProvider } from './google-ai-provider';

// Singleton instances
const openAIProvider = new OpenAIProvider();
const anthropicProvider = new AnthropicProvider();
const googleAIProvider = new GoogleAIProvider();

const providers: Record<AIProviderName, AIProvider> = {
    openai: openAIProvider,
    anthropic: anthropicProvider,
    google: googleAIProvider,
};

export function getAIProvider(name: AIProviderName): AIProvider {
    const provider = providers[name];
    if (!provider) {
        throw new Error(`Unknown AI provider: ${name}`);
    }
    return provider;
}

export function getAllProviders(): AIProvider[] {
    return Object.values(providers);
}

export function getProviderNames(): AIProviderName[] {
    return Object.keys(providers) as AIProviderName[];
}
