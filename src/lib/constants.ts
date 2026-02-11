// ═══════════════════════════════════════════════════════════════
// [F078] src/lib/constants.ts
// Application Constants
// ═══════════════════════════════════════════════════════════════

import type {
    OutputLanguage,
    AIProviderName,
    TonePreset,
    AppLocale,
    NavigationItem
} from './types';

// ─────────────────────────────────────────────────────────────────
// APP INFO
// ─────────────────────────────────────────────────────────────────

export const APP_NAME = 'CV Tailor';
export const APP_VERSION = '1.0.0';

// ─────────────────────────────────────────────────────────────────
// SUPPORTED LOCALES (UI Language)
// ─────────────────────────────────────────────────────────────────

export const SUPPORTED_LOCALES: AppLocale[] = ['en', 'fa'];
export const DEFAULT_LOCALE: AppLocale = 'en';

export const LOCALE_CONFIG: Record<AppLocale, {
    name: string;
    nativeName: string;
    dir: 'ltr' | 'rtl';
    flag: string;
}> = {
    en: { name: 'English', nativeName: 'English', dir: 'ltr', flag: '🇬🇧' },
    fa: { name: 'Persian', nativeName: 'فارسی', dir: 'rtl', flag: '🇮🇷' },
};

// ─────────────────────────────────────────────────────────────────
// OUTPUT LANGUAGES (Document output)
// ─────────────────────────────────────────────────────────────────

export const SUPPORTED_OUTPUT_LANGUAGES: {
    code: OutputLanguage;
    label_en: string;
    label_fa: string;
    flag: string;
}[] = [
        { code: 'en', label_en: 'English', label_fa: 'انگلیسی', flag: '🇬🇧' },
        { code: 'fa', label_en: 'Persian (Farsi)', label_fa: 'فارسی', flag: '🇮🇷' },
        { code: 'fr', label_en: 'French', label_fa: 'فرانسوی', flag: '🇫🇷' },
        { code: 'de', label_en: 'German', label_fa: 'آلمانی', flag: '🇩🇪' },
        { code: 'es', label_en: 'Spanish', label_fa: 'اسپانیایی', flag: '🇪🇸' },
        { code: 'ar', label_en: 'Arabic', label_fa: 'عربی', flag: '🇸🇦' },
        { code: 'zh', label_en: 'Chinese', label_fa: 'چینی', flag: '🇨🇳' },
        { code: 'tr', label_en: 'Turkish', label_fa: 'ترکی', flag: '🇹🇷' },
    ];

// ─────────────────────────────────────────────────────────────────
// AI PROVIDERS
// ─────────────────────────────────────────────────────────────────

export const SUPPORTED_AI_PROVIDERS: {
    name: AIProviderName;
    label: string;
    website: string;
    icon: string;
    keyPlaceholder: string;
}[] = [
        {
            name: 'openai',
            label: 'OpenAI',
            website: 'https://platform.openai.com',
            icon: 'brain',
            keyPlaceholder: 'sk-...'
        },
        {
            name: 'anthropic',
            label: 'Anthropic (Claude)',
            website: 'https://console.anthropic.com',
            icon: 'bot',
            keyPlaceholder: 'sk-ant-...'
        },
        {
            name: 'google',
            label: 'Google AI (Gemini)',
            website: 'https://aistudio.google.com',
            icon: 'sparkles',
            keyPlaceholder: 'AIza...'
        },
    ];

export const DEFAULT_MODELS: Record<AIProviderName, string> = {
    openai: 'gpt-4o',
    anthropic: 'claude-3-5-sonnet-20241022',
    google: 'gemini-1.5-pro',
};

// ─────────────────────────────────────────────────────────────────
// TONE PRESETS
// ─────────────────────────────────────────────────────────────────

export const TONE_PRESETS: {
    value: TonePreset;
    label_en: string;
    label_fa: string;
    description_en: string;
    description_fa: string;
}[] = [
        {
            value: 'formal',
            label_en: 'Formal',
            label_fa: 'رسمی',
            description_en: 'Professional and traditional tone',
            description_fa: 'لحن حرفه‌ای و سنتی'
        },
        {
            value: 'semi-formal',
            label_en: 'Semi-Formal',
            label_fa: 'نیمه‌رسمی',
            description_en: 'Balance between formal and casual',
            description_fa: 'تعادل بین رسمی و غیررسمی'
        },
        {
            value: 'professional',
            label_en: 'Professional',
            label_fa: 'حرفه‌ای',
            description_en: 'Business-appropriate and competent',
            description_fa: 'مناسب کسب‌وکار و شایسته'
        },
        {
            value: 'friendly',
            label_en: 'Friendly',
            label_fa: 'دوستانه',
            description_en: 'Warm and approachable',
            description_fa: 'گرم و صمیمی'
        },
        {
            value: 'creative',
            label_en: 'Creative',
            label_fa: 'خلاقانه',
            description_en: 'Unique and imaginative',
            description_fa: 'منحصربه‌فرد و تخیلی'
        },
        {
            value: 'confident',
            label_en: 'Confident',
            label_fa: 'مطمئن',
            description_en: 'Assertive and self-assured',
            description_fa: 'قاطع و با اعتماد به نفس'
        },
    ];

// ─────────────────────────────────────────────────────────────────
// CV FIELDS
// ─────────────────────────────────────────────────────────────────

export const CV_REQUIRED_FIELDS = [
    'personal_info.full_name',
    'personal_info.email',
    'personal_info.phone',
    'personal_info.summary',
] as const;

export const CV_RECOMMENDED_FIELDS = [
    'personal_info.location',
    'personal_info.linkedin_url',
    'work_experience',
    'education',
    'skills',
] as const;

export const CV_SECTION_LABELS: Record<string, { en: string; fa: string }> = {
    personal_info: { en: 'Personal Information', fa: 'اطلاعات شخصی' },
    work_experience: { en: 'Work Experience', fa: 'سوابق کاری' },
    education: { en: 'Education', fa: 'تحصیلات' },
    skills: { en: 'Skills', fa: 'مهارت‌ها' },
    certifications: { en: 'Certifications', fa: 'گواهینامه‌ها' },
    languages: { en: 'Languages', fa: 'زبان‌ها' },
    projects: { en: 'Projects', fa: 'پروژه‌ها' },
    additional_sections: { en: 'Additional', fa: 'سایر' },
};

// ─────────────────────────────────────────────────────────────────
// FILE LIMITS
// ─────────────────────────────────────────────────────────────────

export const MAX_FILE_SIZE_MB = 10;
export const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

export const ACCEPTED_CV_FILE_TYPES = {
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    'text/markdown': ['.md'],
    'text/plain': ['.txt'],
} as const;

export const ACCEPTED_TEMPLATE_FILE_TYPES = {
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    'text/markdown': ['.md'],
} as const;

// ─────────────────────────────────────────────────────────────────
// NAVIGATION
// ─────────────────────────────────────────────────────────────────

export const MAIN_NAVIGATION: NavigationItem[] = [
    { id: 'dashboard', label_key: 'nav.dashboard', href: '/dashboard', icon: 'LayoutDashboard' },
    { id: 'cv-manager', label_key: 'nav.cv_manager', href: '/cv-manager', icon: 'FileText' },
    { id: 'new-application', label_key: 'nav.new_application', href: '/new-application', icon: 'PlusCircle' },
    { id: 'applications', label_key: 'nav.applications', href: '/applications', icon: 'FolderOpen' },
    { id: 'prompts', label_key: 'nav.prompts', href: '/prompts', icon: 'MessageSquare' },
    { id: 'settings', label_key: 'nav.settings', href: '/settings', icon: 'Settings' },
];

// ─────────────────────────────────────────────────────────────────
// PROMPT CATEGORIES
// ─────────────────────────────────────────────────────────────────

export const PROMPT_CATEGORIES = [
    { id: 'general', label_en: 'General', label_fa: 'عمومی' },
    { id: 'tech', label_en: 'Technology', label_fa: 'فناوری' },
    { id: 'creative', label_en: 'Creative', label_fa: 'خلاقانه' },
    { id: 'academic', label_en: 'Academic', label_fa: 'دانشگاهی' },
    { id: 'executive', label_en: 'Executive', label_fa: 'مدیریتی' },
];

// ─────────────────────────────────────────────────────────────────
// APPLICATION STATUS
// ─────────────────────────────────────────────────────────────────

export const APPLICATION_STATUS_CONFIG: Record<string, {
    label_en: string;
    label_fa: string;
    color: string;
    icon: string;
}> = {
    input: { label_en: 'Input', label_fa: 'ورودی', color: 'gray', icon: 'Edit' },
    processing: { label_en: 'Processing', label_fa: 'در حال پردازش', color: 'blue', icon: 'Loader' },
    clarification: { label_en: 'Clarification', label_fa: 'پرسش', color: 'yellow', icon: 'HelpCircle' },
    draft_ready: { label_en: 'Draft Ready', label_fa: 'پیش‌نویس آماده', color: 'purple', icon: 'FileCheck' },
    editing: { label_en: 'Editing', label_fa: 'ویرایش', color: 'orange', icon: 'Pencil' },
    finalized: { label_en: 'Finalized', label_fa: 'نهایی', color: 'green', icon: 'CheckCircle' },
};
