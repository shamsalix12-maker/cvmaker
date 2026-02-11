// ═══════════════════════════════════════════════════════════════
// [F080] src/lib/helpers.ts
// Utility Functions
// ═══════════════════════════════════════════════════════════════

import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { AppLocale } from './types';

// ─────────────────────────────────────────────────────────────────
// CLASSNAMES
// ─────────────────────────────────────────────────────────────────

/**
 * Merge Tailwind classes with clsx
 */
export function cn(...inputs: ClassValue[]): string {
    return twMerge(clsx(inputs));
}

// ─────────────────────────────────────────────────────────────────
// ID GENERATION
// ─────────────────────────────────────────────────────────────────

/**
 * Generate a unique UUID
 */
export function generateId(): string {
    return crypto.randomUUID();
}

/**
 * Generate a short ID (8 characters)
 */
export function generateShortId(): string {
    return crypto.randomUUID().split('-')[0];
}

// ─────────────────────────────────────────────────────────────────
// DATE FORMATTING
// ─────────────────────────────────────────────────────────────────

/**
 * Format a date string for display
 */
export function formatDate(
    dateString: string,
    locale: AppLocale = 'en',
    options?: Intl.DateTimeFormatOptions
): string {
    const localeCode = locale === 'fa' ? 'fa-IR' : 'en-US';
    const defaultOptions: Intl.DateTimeFormatOptions = {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    };
    return new Date(dateString).toLocaleDateString(localeCode, options || defaultOptions);
}

/**
 * Format a date for forms (YYYY-MM-DD)
 */
export function formatDateForInput(dateString: string): string {
    return new Date(dateString).toISOString().split('T')[0];
}

/**
 * Get relative time (e.g., "2 hours ago")
 */
export function getRelativeTime(dateString: string, locale: AppLocale = 'en'): string {
    const localeCode = locale === 'fa' ? 'fa-IR' : 'en-US';
    const rtf = new Intl.RelativeTimeFormat(localeCode, { numeric: 'auto' });
    const now = new Date();
    const date = new Date(dateString);
    const diffInSeconds = Math.floor((date.getTime() - now.getTime()) / 1000);

    const intervals: { unit: Intl.RelativeTimeFormatUnit; seconds: number }[] = [
        { unit: 'year', seconds: 31536000 },
        { unit: 'month', seconds: 2592000 },
        { unit: 'week', seconds: 604800 },
        { unit: 'day', seconds: 86400 },
        { unit: 'hour', seconds: 3600 },
        { unit: 'minute', seconds: 60 },
        { unit: 'second', seconds: 1 },
    ];

    for (const interval of intervals) {
        const count = Math.floor(Math.abs(diffInSeconds) / interval.seconds);
        if (count >= 1) {
            return rtf.format(diffInSeconds > 0 ? count : -count, interval.unit);
        }
    }
    return rtf.format(0, 'second');
}

// ─────────────────────────────────────────────────────────────────
// TEXT UTILITIES
// ─────────────────────────────────────────────────────────────────

/**
 * Truncate text to a maximum length
 */
export function truncateText(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + '...';
}

/**
 * Capitalize first letter
 */
export function capitalize(text: string): string {
    return text.charAt(0).toUpperCase() + text.slice(1);
}

/**
 * Convert to title case
 */
export function toTitleCase(text: string): string {
    return text
        .toLowerCase()
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

/**
 * Slugify a string
 */
export function slugify(text: string): string {
    return text
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

// ─────────────────────────────────────────────────────────────────
// LOCALE UTILITIES
// ─────────────────────────────────────────────────────────────────

/**
 * Check if locale is RTL
 */
export function isRTL(locale: AppLocale): boolean {
    return locale === 'fa';
}

/**
 * Get direction for a locale
 */
export function getDirection(locale: AppLocale): 'ltr' | 'rtl' {
    return isRTL(locale) ? 'rtl' : 'ltr';
}

// ─────────────────────────────────────────────────────────────────
// VALIDATION
// ─────────────────────────────────────────────────────────────────

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Validate URL format
 */
export function isValidUrl(url: string): boolean {
    try {
        new URL(url);
        return true;
    } catch {
        return false;
    }
}

/**
 * Check if string is empty or whitespace only
 */
export function isEmpty(value: string | null | undefined): boolean {
    return value === null || value === undefined || value.trim() === '';
}

// ─────────────────────────────────────────────────────────────────
// FILE UTILITIES
// ─────────────────────────────────────────────────────────────────

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Get file extension from filename
 */
export function getFileExtension(filename: string): string {
    return filename.slice(((filename.lastIndexOf('.') - 1) >>> 0) + 2).toLowerCase();
}

// ─────────────────────────────────────────────────────────────────
// ASYNC UTILITIES
// ─────────────────────────────────────────────────────────────────

/**
 * Sleep for a given number of milliseconds
 */
export function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Debounce a function
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
    func: T,
    wait: number
): (...args: Parameters<T>) => void {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    return (...args: Parameters<T>) => {
        if (timeoutId) {
            clearTimeout(timeoutId);
        }
        timeoutId = setTimeout(() => {
            func(...args);
        }, wait);
    };
}

// ─────────────────────────────────────────────────────────────────
// OBJECT UTILITIES
// ─────────────────────────────────────────────────────────────────

/**
 * Deep clone an object
 */
export function deepClone<T>(obj: T): T {
    return JSON.parse(JSON.stringify(obj));
}

/**
 * Check if two objects are deeply equal
 */
export function deepEqual(a: unknown, b: unknown): boolean {
    return JSON.stringify(a) === JSON.stringify(b);
}

/**
 * Pick specific keys from an object
 */
export function pick<T extends object, K extends keyof T>(
    obj: T,
    keys: K[]
): Pick<T, K> {
    const result = {} as Pick<T, K>;
    for (const key of keys) {
        if (key in obj) {
            result[key] = obj[key];
        }
    }
    return result;
}

/**
 * Omit specific keys from an object
 */
export function omit<T extends object, K extends keyof T>(
    obj: T,
    keys: K[]
): Omit<T, K> {
    const result = { ...obj };
    for (const key of keys) {
        delete result[key];
    }
    return result as Omit<T, K>;
}
