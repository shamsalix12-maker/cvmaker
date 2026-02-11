// ============================================
// [F108] src/lib/cv/cv-validator.ts
// CV Validation Utilities
// ============================================

import { ComprehensiveCV, CVFieldStatus } from '@/lib/types';

export function validateExtractedCV(cv: Partial<ComprehensiveCV>): CVFieldStatus[] {
    const statuses: CVFieldStatus[] = [];

    // Check personal info fields
    const personalFields: { key: string; required: boolean }[] = [
        { key: 'full_name', required: true },
        { key: 'email', required: true },
        { key: 'phone', required: false },
        { key: 'location', required: false },
        { key: 'summary', required: true },
        { key: 'linkedin_url', required: false },
        { key: 'website_url', required: false },
    ];

    for (const field of personalFields) {
        const value = cv.personal_info?.[field.key as keyof typeof cv.personal_info];
        statuses.push({
            field_path: `personal_info.${field.key}`,
            field_name: field.key,
            is_complete: Boolean(value && String(value).trim().length > 0),
            is_required: field.required,
            current_value: value || null,
        });
    }

    // Check work experience
    statuses.push({
        field_path: 'work_experience',
        field_name: 'work_experience',
        is_complete: (cv.work_experience?.length || 0) > 0,
        is_required: true,
        current_value: cv.work_experience || [],
    });

    // Check education
    statuses.push({
        field_path: 'education',
        field_name: 'education',
        is_complete: (cv.education?.length || 0) > 0,
        is_required: true,
        current_value: cv.education || [],
    });

    // Check skills
    statuses.push({
        field_path: 'skills',
        field_name: 'skills',
        is_complete: (cv.skills?.length || 0) > 0,
        is_required: true,
        current_value: cv.skills || [],
    });

    // Check certifications
    statuses.push({
        field_path: 'certifications',
        field_name: 'certifications',
        is_complete: (cv.certifications?.length || 0) > 0,
        is_required: false,
        current_value: cv.certifications || [],
    });

    // Check languages
    statuses.push({
        field_path: 'languages',
        field_name: 'languages',
        is_complete: (cv.languages?.length || 0) > 0,
        is_required: false,
        current_value: cv.languages || [],
    });

    return statuses;
}

export function getMissingFields(statuses: CVFieldStatus[]): string[] {
    return statuses
        .filter(s => !s.is_complete)
        .map(s => s.field_name);
}

export function getCompletionPercentage(statuses: CVFieldStatus[]): number {
    if (statuses.length === 0) return 0;
    const complete = statuses.filter(s => s.is_complete).length;
    return Math.round((complete / statuses.length) * 100);
}

export function isMinimumViable(cv: Partial<ComprehensiveCV>): boolean {
    // A CV is minimally viable if it has at least:
    // - Name
    // - Email OR Phone
    // - At least one work experience OR education
    const hasName = Boolean(cv.personal_info?.full_name);
    const hasContact = Boolean(cv.personal_info?.email || cv.personal_info?.phone);
    const hasExperience = (cv.work_experience?.length || 0) > 0;
    const hasEducation = (cv.education?.length || 0) > 0;

    return hasName && hasContact && (hasExperience || hasEducation);
}
