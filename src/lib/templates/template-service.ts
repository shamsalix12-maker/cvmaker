// ============================================
// [F145] src/lib/templates/template-service.ts
// ============================================

import { SupabaseClient } from '@supabase/supabase-js';
import { Template, TemplateType, FileFormat } from '@/lib/types';

export class TemplateService {
    constructor(private supabase: SupabaseClient) { }

    async getTemplates(userId: string): Promise<Template[]> {
        const { data, error } = await this.supabase
            .from('templates')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    }

    async getTemplatesByType(userId: string, type: TemplateType): Promise<Template[]> {
        const { data, error } = await this.supabase
            .from('templates')
            .select('*')
            .eq('user_id', userId)
            .eq('template_type', type)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    }

    async getTemplate(id: string, userId: string): Promise<Template | null> {
        const { data, error } = await this.supabase
            .from('templates')
            .select('*')
            .eq('id', id)
            .eq('user_id', userId)
            .single();

        if (error) {
            if (error.code === 'PGRST116') return null;
            throw error;
        }

        return data;
    }

    async createTemplate(
        userId: string,
        template: {
            template_name: string;
            template_type: TemplateType;
            file_format: FileFormat;
            file_content: string;
        }
    ): Promise<Template> {
        const { data, error } = await this.supabase
            .from('templates')
            .insert({
                user_id: userId,
                ...template
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    async updateTemplate(
        id: string,
        userId: string,
        updates: Partial<Template>
    ): Promise<Template> {
        const { id: _, user_id, created_at, ...validUpdates } = updates as any;

        const { data, error } = await this.supabase
            .from('templates')
            .update(validUpdates)
            .eq('id', id)
            .eq('user_id', userId)
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    async deleteTemplate(id: string, userId: string): Promise<void> {
        const { error } = await this.supabase
            .from('templates')
            .delete()
            .eq('id', id)
            .eq('user_id', userId);

        if (error) throw error;
    }
}

export function createTemplateService(supabase: SupabaseClient): TemplateService {
    return new TemplateService(supabase);
}
