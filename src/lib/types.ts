// ═══════════════════════════════════════════════════════════════
// [F079] src/lib/types.ts
// Central TypeScript Type Definitions
// ALL types for the entire application are defined here
// ═══════════════════════════════════════════════════════════════

// ─────────────────────────────────────────────────────────────────
// USER TYPES
// ─────────────────────────────────────────────────────────────────

export interface User {
    id: string;
    google_id: string | null;
    email: string;
    name: string;
    avatar_url: string | null;
    preferred_language: AppLocale;
    created_at: string;
    updated_at: string;
}

// ─────────────────────────────────────────────────────────────────
// CV TYPES
// ─────────────────────────────────────────────────────────────────

export interface PersonalInfo {
    full_name: string;
    email: string;
    phone: string;
    location: string;
    linkedin_url: string;
    website_url: string;
    summary: string;
}

export interface WorkExperience {
    id: string;
    job_title: string;
    company: string;
    location: string;
    start_date: string;
    end_date: string | null;
    is_current: boolean;
    description: string;
    achievements: string[];
}

export interface Education {
    id: string;
    degree: string;
    field_of_study: string;
    institution: string;
    location: string;
    start_date: string;
    end_date: string;
    gpa: string | null;
    description: string;
}

export interface Certification {
    id: string;
    name: string;
    issuer: string;
    date_obtained: string;
    expiry_date: string | null;
    credential_id: string | null;
    credential_url: string | null;
}

export interface Language {
    language: string;
    proficiency: 'native' | 'fluent' | 'advanced' | 'intermediate' | 'beginner';
}

export interface Project {
    id: string;
    name: string;
    description: string;
    technologies: string[];
    url: string | null;
    start_date: string | null;
    end_date: string | null;
}

export interface AdditionalSection {
    id: string;
    title: string;
    content: string;
}

export interface ComprehensiveCV {
    id: string;
    user_id: string;
    personal_info: PersonalInfo;
    work_experience: WorkExperience[];
    education: Education[];
    skills: string[];
    certifications: Certification[];
    languages: Language[];
    projects: Project[];
    additional_sections: AdditionalSection[];
    raw_text: string;
    created_at: string;
    updated_at: string;
}

export interface CVFieldStatus {
    field_path: string;
    field_name: string;
    is_complete: boolean;
    is_required: boolean;
    current_value: unknown;
    message?: string;
}

export type CVSection =
    | 'personal_info'
    | 'work_experience'
    | 'education'
    | 'skills'
    | 'certifications'
    | 'languages'
    | 'projects'
    | 'additional_sections';

// ─────────────────────────────────────────────────────────────────
// PROMPT TYPES
// ─────────────────────────────────────────────────────────────────

export interface Prompt {
    id: string;
    title_en: string;
    title_fa: string;
    description_en: string;
    description_fa: string;
    prompt_text: string;
    category: string;
    is_active: boolean;
    sort_order: number;
    created_at: string;
    updated_at: string;
}

export interface PromptCategory {
    id: string;
    name_en: string;
    name_fa: string;
    sort_order: number;
}

// ─────────────────────────────────────────────────────────────────
// AI TYPES
// ─────────────────────────────────────────────────────────────────

export type AIProviderName = 'openai' | 'anthropic' | 'google';

export interface AIModel {
    model_id: string;
    model_name: string;
    provider: AIProviderName;
    context_window?: number;
    supports_streaming: boolean;
}

export interface AIApiKey {
    id: string;
    user_id: string;
    provider_name: AIProviderName;
    api_key_encrypted: string;
    is_valid: boolean;
    available_models: AIModel[];
    token_balance: string | null;
    last_validated_at: string | null;
    created_at: string;
    updated_at: string;
}

export interface AISelection {
    provider: AIProviderName;
    model_id: string;
    role: 'draft' | 'final';
}

export interface AIChatMessage {
    id: string;
    role: 'system' | 'user' | 'assistant';
    content: string;
    timestamp: string;
}

export interface AIConnectionStatus {
    provider: AIProviderName;
    is_connected: boolean;
    error_message?: string;
    available_models: AIModel[];
    token_balance?: string;
    last_checked: string;
}

// ─────────────────────────────────────────────────────────────────
// APPLICATION TYPES
// ─────────────────────────────────────────────────────────────────

export type OutputLanguage = 'en' | 'fa' | 'fr' | 'de' | 'es' | 'ar' | 'zh' | 'tr';

export type ToneMode = 'preset' | 'custom';

export type TonePreset =
    | 'formal'
    | 'semi-formal'
    | 'professional'
    | 'friendly'
    | 'creative'
    | 'confident';

export interface ToneSetting {
    mode: ToneMode;
    preset_value: TonePreset | null;
    custom_text: string | null;
}

export type ApplicationStatus =
    | 'input'
    | 'processing'
    | 'clarification'
    | 'draft_ready'
    | 'editing'
    | 'finalized';

export interface DraftOutput {
    id: string;
    ai_provider: AIProviderName;
    ai_model: string;
    content: string;
    created_at: string;
}

export interface FinalOutput {
    tailored_cv: string;
    cover_letter: string;
    application_email: string;
}

export interface JobApplication {
    id: string;
    user_id: string;
    job_title: string;
    company_name: string;
    job_description: string;
    selected_prompt_ids: string[];
    ai_selections: AISelection[];
    output_language: OutputLanguage;
    tone_setting: ToneSetting;
    selected_template_ids: {
        cv: string | null;
        cover_letter: string | null;
        email: string | null;
    };
    conversation_history: AIChatMessage[];
    draft_outputs: DraftOutput[];
    final_output: FinalOutput | null;
    edited_output: FinalOutput | null;
    status: ApplicationStatus;
    created_at: string;
    updated_at: string;
}

// ─────────────────────────────────────────────────────────────────
// TEMPLATE TYPES
// ─────────────────────────────────────────────────────────────────

export type TemplateType = 'cv' | 'cover_letter' | 'email';
export type DocumentType = TemplateType;
export type FileFormat = 'docx' | 'md';

export interface Template {
    id: string;
    user_id: string;
    template_name: string;
    template_type: TemplateType;
    file_format: FileFormat;
    file_content: string;
    preview_url?: string;
    created_at: string;
    updated_at: string;
}

// ─────────────────────────────────────────────────────────────────
// UI / APP TYPES
// ─────────────────────────────────────────────────────────────────

export type AppLocale = 'en' | 'fa';

export interface NavigationItem {
    id: string;
    label_key: string;
    href: string;
    icon: string;
    badge?: number;
}

export interface BreadcrumbItem {
    label_key: string;
    href?: string;
}

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastMessage {
    id: string;
    type: ToastType;
    title: string;
    description?: string;
    duration?: number;
}

// ─────────────────────────────────────────────────────────────────
// API RESPONSE TYPES
// ─────────────────────────────────────────────────────────────────

export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: {
        code: string;
        message: string;
        details?: unknown;
    };
}

export interface PaginatedResponse<T> {
    items: T[];
    total: number;
    page: number;
    page_size: number;
    has_more: boolean;
}

// ─────────────────────────────────────────────────────────────────
// FORM TYPES
// ─────────────────────────────────────────────────────────────────

export interface FormFieldError {
    field: string;
    message: string;
}

export interface FormState<T> {
    data: T;
    errors: FormFieldError[];
    isSubmitting: boolean;
    isValid: boolean;
}

// ─────────────────────────────────────────────────────────────────
// CV Extraction Types
// ─────────────────────────────────────────────────────────────────

export interface CVExtractionResult {
    success: boolean;
    cv: Partial<ComprehensiveCV>;
    fieldStatuses: CVFieldStatus[];
    confidence: number; // 0-100
    rawText: string;
    aiProvider: AIProviderName;
    aiModel: string;
    extractionNotes?: string;
}

export interface CVExtractionRequest {
    rawText: string;
    aiProvider: AIProviderName;
    aiModel: string;
    language?: 'en' | 'fa' | 'auto';
}
