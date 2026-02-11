// ═══════════════════════════════════════════════════════════════
// [F086] src/i18n/config.ts
// i18n Configuration
// ═══════════════════════════════════════════════════════════════

export const locales = ['en', 'fa'] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'en';

export const localeNames: Record<Locale, string> = {
    en: 'English',
    fa: 'فارسی',
};

export const localeDirections: Record<Locale, 'ltr' | 'rtl'> = {
    en: 'ltr',
    fa: 'rtl',
};
