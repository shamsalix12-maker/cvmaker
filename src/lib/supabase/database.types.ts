// ═══════════════════════════════════════════════════════════════
// [F093] src/lib/supabase/database.types.ts
// Supabase Database Types
// ═══════════════════════════════════════════════════════════════

export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export interface Database {
    public: {
        Tables: {
            users: {
                Row: {
                    id: string
                    google_id: string | null
                    email: string
                    name: string
                    avatar_url: string | null
                    preferred_language: string
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    google_id?: string | null
                    email: string
                    name: string
                    avatar_url?: string | null
                    preferred_language?: string
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    google_id?: string | null
                    email?: string
                    name?: string
                    avatar_url?: string | null
                    preferred_language?: string
                    created_at?: string
                    updated_at?: string
                }
            }
            comprehensive_cvs: {
                Row: {
                    id: string
                    user_id: string
                    personal_info: Json
                    work_experience: Json
                    education: Json
                    skills: Json
                    certifications: Json
                    languages: Json
                    projects: Json
                    additional_sections: Json
                    raw_text: string
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    personal_info?: Json
                    work_experience?: Json
                    education?: Json
                    skills?: Json
                    certifications?: Json
                    languages?: Json
                    projects?: Json
                    additional_sections?: Json
                    raw_text?: string
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    personal_info?: Json
                    work_experience?: Json
                    education?: Json
                    skills?: Json
                    certifications?: Json
                    languages?: Json
                    projects?: Json
                    additional_sections?: Json
                    raw_text?: string
                    created_at?: string
                    updated_at?: string
                }
            }
            prompts: {
                Row: {
                    id: string
                    title_en: string
                    title_fa: string
                    description_en: string
                    description_fa: string
                    prompt_text: string
                    category: string
                    is_active: boolean
                    sort_order: number
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    title_en: string
                    title_fa: string
                    description_en?: string
                    description_fa?: string
                    prompt_text: string
                    category?: string
                    is_active?: boolean
                    sort_order?: number
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    title_en?: string
                    title_fa?: string
                    description_en?: string
                    description_fa?: string
                    prompt_text?: string
                    category?: string
                    is_active?: boolean
                    sort_order?: number
                    created_at?: string
                    updated_at?: string
                }
            }
            ai_api_keys: {
                Row: {
                    id: string
                    user_id: string
                    provider_name: string
                    api_key_encrypted: string
                    is_valid: boolean
                    available_models: Json
                    token_balance: string | null
                    last_validated_at: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    provider_name: string
                    api_key_encrypted: string
                    is_valid?: boolean
                    available_models?: Json
                    token_balance?: string | null
                    last_validated_at?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    provider_name?: string
                    api_key_encrypted?: string
                    is_valid?: boolean
                    available_models?: Json
                    token_balance?: string | null
                    last_validated_at?: string | null
                    created_at?: string
                    updated_at?: string
                }
            }
            templates: {
                Row: {
                    id: string
                    user_id: string
                    template_name: string
                    template_type: string
                    file_format: string
                    file_content: string
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    template_name: string
                    template_type: string
                    file_format: string
                    file_content: string
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    template_name?: string
                    template_type?: string
                    file_format?: string
                    file_content?: string
                    created_at?: string
                    updated_at?: string
                }
            }
            job_applications: {
                Row: {
                    id: string
                    user_id: string
                    job_title: string
                    company_name: string
                    job_description: string
                    selected_prompt_ids: Json
                    ai_selections: Json
                    output_language: string
                    tone_setting: Json
                    selected_template_ids: Json
                    conversation_history: Json
                    draft_outputs: Json
                    final_output: Json | null
                    edited_output: Json | null
                    status: string
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    job_title?: string
                    company_name?: string
                    job_description: string
                    selected_prompt_ids?: Json
                    ai_selections?: Json
                    output_language?: string
                    tone_setting?: Json
                    selected_template_ids?: Json
                    conversation_history?: Json
                    draft_outputs?: Json
                    final_output?: Json | null
                    edited_output?: Json | null
                    status?: string
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    job_title?: string
                    company_name?: string
                    job_description?: string
                    selected_prompt_ids?: Json
                    ai_selections?: Json
                    output_language?: string
                    tone_setting?: Json
                    selected_template_ids?: Json
                    conversation_history?: Json
                    draft_outputs?: Json
                    final_output?: Json | null
                    edited_output?: Json | null
                    status?: string
                    created_at?: string
                    updated_at?: string
                }
            }
        }
    }
}
