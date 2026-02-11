// ============================================
// [F119] src/lib/prompts/prompt-service.ts
// ============================================

import { SupabaseClient } from '@supabase/supabase-js';
import { Prompt } from '@/lib/types';
import { DEFAULT_PROMPTS } from './default-prompts';

export class PromptService {
    constructor(private supabase: SupabaseClient) { }

    async getAllPrompts(activeOnly: boolean = false): Promise<Prompt[]> {
        let query = this.supabase
            .from('prompts')
            .select('*')
            .order('sort_order', { ascending: true });

        if (activeOnly) {
            query = query.eq('is_active', true);
        }

        const { data, error } = await query;
        if (error) throw error;
        return data || [];
    }

    async getPromptById(id: string): Promise<Prompt | null> {
        const { data, error } = await this.supabase
            .from('prompts')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            if (error.code === 'PGRST116') return null;
            throw error;
        }
        return data;
    }

    async getPromptsByCategory(category: string): Promise<Prompt[]> {
        const { data, error } = await this.supabase
            .from('prompts')
            .select('*')
            .eq('category', category)
            .eq('is_active', true)
            .order('sort_order', { ascending: true });

        if (error) throw error;
        return data || [];
    }

    async getPromptsByIds(ids: string[]): Promise<Prompt[]> {
        if (ids.length === 0) return [];
        const { data, error } = await this.supabase
            .from('prompts')
            .select('*')
            .in('id', ids);

        if (error) throw error;
        return data || [];
    }

    async createPrompt(prompt: Omit<Prompt, 'id' | 'created_at' | 'updated_at'>): Promise<Prompt> {
        const { data, error } = await this.supabase
            .from('prompts')
            .insert(prompt)
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    async updatePrompt(id: string, updates: Partial<Prompt>): Promise<Prompt> {
        const { id: _, created_at, updated_at, ...validUpdates } = updates as any;
        const { data, error } = await this.supabase
            .from('prompts')
            .update(validUpdates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    async deletePrompt(id: string): Promise<void> {
        const { error } = await this.supabase
            .from('prompts')
            .delete()
            .eq('id', id);

        if (error) throw error;
    }

    async togglePromptActive(id: string): Promise<Prompt> {
        const prompt = await this.getPromptById(id);
        if (!prompt) throw new Error('Prompt not found');
        return this.updatePrompt(id, { is_active: !prompt.is_active });
    }

    async reorderPrompts(orderedIds: string[]): Promise<void> {
        const updates = orderedIds.map((id, index) =>
            this.supabase.from('prompts').update({ sort_order: index }).eq('id', id)
        );
        await Promise.all(updates);
    }

    async seedDefaultPrompts(): Promise<void> {
        const existing = await this.getAllPrompts();
        if (existing.length > 0) return;

        const { error } = await this.supabase.from('prompts').insert(DEFAULT_PROMPTS);
        if (error) throw error;
    }

    async searchPrompts(query: string, locale: 'en' | 'fa' = 'en'): Promise<Prompt[]> {
        const searchField = locale === 'fa' ? 'title_fa' : 'title_en';
        const descField = locale === 'fa' ? 'description_fa' : 'description_en';

        const { data, error } = await this.supabase
            .from('prompts')
            .select('*')
            .or(`${searchField}.ilike.%${query}%,${descField}.ilike.%${query}%`)
            .eq('is_active', true)
            .order('sort_order', { ascending: true });

        if (error) throw error;
        return data || [];
    }
}

export function createPromptService(supabase: SupabaseClient): PromptService {
    return new PromptService(supabase);
}
