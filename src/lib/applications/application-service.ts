import { createServerSupabaseClient, getServerUserId } from '@/lib/supabase/server';
import {
    JobApplication,
    ApplicationStatus,
    DraftOutput,
    FinalOutput,
    ApiResponse,
    ComprehensiveCV
} from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';

export class ApplicationService {
    /**
     * Create a new job application record
     */
    static async createApplication(params: Partial<JobApplication>): Promise<ApiResponse<JobApplication>> {
        const userId = await getServerUserId();
        if (!userId) return { success: false, error: { code: 'UNAUTHORIZED', message: 'User not authenticated' } };

        const supabase = await createServerSupabaseClient();

        const newApp: Partial<JobApplication> = {
            id: uuidv4(),
            user_id: userId,
            job_title: params.job_title || 'Untitled Application',
            company_name: params.company_name || 'Generic Company',
            job_description: params.job_description || '',
            selected_prompt_ids: params.selected_prompt_ids || [],
            ai_selections: params.ai_selections || [],
            output_language: params.output_language || 'en',
            tone_setting: params.tone_setting || { mode: 'preset', preset_value: 'professional', custom_text: null },
            selected_template_ids: params.selected_template_ids || { cv: null, cover_letter: null, email: null },
            conversation_history: [],
            draft_outputs: [],
            final_output: null,
            edited_output: null,
            status: 'input',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        };

        const { data, error } = await supabase
            .from('job_applications')
            .insert(newApp as any)
            .select()
            .single();

        if (error) return { success: false, error: { code: error.code, message: error.message } };
        return { success: true, data: data as JobApplication };
    }

    /**
     * Get a single application by ID
     */
    static async getApplication(id: string): Promise<ApiResponse<JobApplication>> {
        const supabase = await createServerSupabaseClient();
        const { data, error } = await supabase
            .from('job_applications')
            .select('*')
            .eq('id', id)
            .single();

        if (error) return { success: false, error: { code: error.code, message: error.message } };
        return { success: true, data: data as JobApplication };
    }

    /**
     * Update an application record
     */
    static async updateApplication(id: string, updates: Partial<JobApplication>): Promise<ApiResponse<JobApplication>> {
        const supabase = await createServerSupabaseClient();
        const { data, error } = await supabase
            .from('job_applications')
            .update({ ...updates, updated_at: new Date().toISOString() } as any)
            .eq('id', id)
            .select()
            .single();

        if (error) return { success: false, error: { code: error.code, message: error.message } };
        return { success: true, data: data as JobApplication };
    }

    /**
     * List applications for the current user
     */
    static async listApplications(): Promise<ApiResponse<JobApplication[]>> {
        const userId = await getServerUserId();
        if (!userId) return { success: false, error: { code: 'UNAUTHORIZED', message: 'User not authenticated' } };

        const supabase = await createServerSupabaseClient();

        const { data, error } = await supabase
            .from('job_applications')
            .select('*')
            .eq('user_id', userId)
            .order('updated_at', { ascending: false });

        if (error) return { success: false, error: { code: error.code, message: error.message } };
        return { success: true, data: data as JobApplication[] };
    }

    /**
     * Delete an application
     */
    static async deleteApplication(id: string): Promise<ApiResponse<void>> {
        const supabase = await createServerSupabaseClient();
        const { error } = await supabase
            .from('job_applications')
            .delete()
            .eq('id', id);

        if (error) return { success: false, error: { code: error.code, message: error.message } };
        return { success: true };
    }

    /**
     * Update status of an application
     */
    static async updateStatus(id: string, status: ApplicationStatus): Promise<ApiResponse<JobApplication>> {
        return this.updateApplication(id, { status });
    }

    /**
     * Get user's comprehensive CV data
     */
    static async getLatestCV(): Promise<ComprehensiveCV | null> {
        const userId = await getServerUserId();
        if (!userId) return null;

        const supabase = await createServerSupabaseClient();

        const { data, error } = await supabase
            .from('comprehensive_cvs')
            .select('*')
            .eq('user_id', userId)
            .order('updated_at', { ascending: false })
            .limit(1)
            .maybeSingle();

        if (error || !data) return null;
        return data as ComprehensiveCV;
    }
}
