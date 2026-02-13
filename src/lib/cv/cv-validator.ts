// ============================================
// src/lib/cv/cv-validator.ts
// CV Validation Utilities - Domain-Aware
// ============================================

import { ComprehensiveCV, CVFieldStatus } from '@/lib/types';
import {
  CVDomainId,
  GapSeverity,
} from '@/lib/types/cv-domain.types';
import {
  CV_DOMAINS,
  getCriticalFields,
  getDomainSpecificSections,
} from './cv-domains';

// ═══════════════════════════════════════════
// توابع اصلی (سازگار با کد قبلی)
// ═══════════════════════════════════════════

/**
 * اعتبارسنجی پایه CV استخراج‌شده
 * سازگار با نسخه قبلی - هیچ کد موجودی نمی‌شکند
 */
export function validateExtractedCV(cv: Partial<ComprehensiveCV>): CVFieldStatus[] {
  const statuses: CVFieldStatus[] = [];

  // ─── Personal Info Fields ───
  const personalFields: { key: string; label: string; required: boolean }[] = [
    { key: 'full_name', label: 'Full Name', required: true },
    { key: 'email', label: 'Email', required: true },
    { key: 'phone', label: 'Phone', required: false },
    { key: 'location', label: 'Location', required: false },
    { key: 'summary', label: 'Professional Summary', required: true },
    { key: 'linkedin_url', label: 'LinkedIn URL', required: false },
    { key: 'website_url', label: 'Website URL', required: false },
  ];

  for (const field of personalFields) {
    const value = cv.personal_info?.[field.key as keyof typeof cv.personal_info];
    const strValue = value ? String(value).trim() : '';

    statuses.push({
      field_path: `personal_info.${field.key}`,
      field_name: field.label,
      is_complete: strValue.length > 0,
      is_required: field.required,
      current_value: strValue || null,
      message: strValue.length === 0 && field.required
        ? `${field.label} is required`
        : undefined,
    });
  }

  // ─── Array Sections ───
  const arraySections: { path: string; label: string; required: boolean; data: any[] | undefined }[] = [
    { path: 'work_experience', label: 'Work Experience', required: true, data: cv.work_experience },
    { path: 'education', label: 'Education', required: true, data: cv.education },
    { path: 'skills', label: 'Skills', required: true, data: cv.skills },
    { path: 'certifications', label: 'Certifications', required: false, data: cv.certifications },
    { path: 'languages', label: 'Languages', required: false, data: cv.languages },
    { path: 'projects', label: 'Projects', required: false, data: cv.projects },
  ];

  for (const section of arraySections) {
    const count = section.data?.length || 0;

    statuses.push({
      field_path: section.path,
      field_name: section.label,
      is_complete: count > 0,
      is_required: section.required,
      current_value: section.data || [],
      message: count === 0 && section.required
        ? `At least one ${section.label.toLowerCase()} entry is required`
        : count === 0
          ? `No ${section.label.toLowerCase()} entries found`
          : `${count} ${section.label.toLowerCase()} entry(s) found`,
    });
  }

  return statuses;
}

/**
 * دریافت لیست فیلدهای ناقص
 * سازگار با نسخه قبلی
 */
export function getMissingFields(statuses: CVFieldStatus[]): string[] {
  return statuses
    .filter(s => !s.is_complete)
    .map(s => s.field_name);
}

/**
 * محاسبه درصد تکمیل
 * سازگار با نسخه قبلی
 */
export function getCompletionPercentage(statuses: CVFieldStatus[]): number {
  if (statuses.length === 0) return 0;
  const complete = statuses.filter(s => s.is_complete).length;
  return Math.round((complete / statuses.length) * 100);
}

/**
 * بررسی حداقل اطلاعات لازم
 * سازگار با نسخه قبلی + بهبود
 */
export function isMinimumViable(cv: Partial<ComprehensiveCV>): boolean {
  const hasName = Boolean(cv.personal_info?.full_name?.trim());
  const hasContact = Boolean(
    cv.personal_info?.email?.trim() ||
    cv.personal_info?.phone?.trim()
  );
  const hasExperience = (cv.work_experience?.length || 0) > 0;
  const hasEducation = (cv.education?.length || 0) > 0;

  return hasName && hasContact && (hasExperience || hasEducation);
}

// ═══════════════════════════════════════════
// توابع جدید Domain-Aware
// ═══════════════════════════════════════════

/**
 * ارزیابی کیفیت یک فیلد متنی
 * برمی‌گرداند: weak | fair | good | excellent
 */
export type FieldQuality = 'empty' | 'weak' | 'fair' | 'good' | 'excellent';

export interface FieldQualityResult {
  field_path: string;
  quality: FieldQuality;
  score: number; // 0-100
  issues: string[];
  suggestions_en: string[];
  suggestions_fa: string[];
}

/**
 * ارزیابی کیفیت محتوای هر فیلد
 */
export function assessFieldQuality(
  fieldPath: string,
  value: unknown
): FieldQualityResult {
  const result: FieldQualityResult = {
    field_path: fieldPath,
    quality: 'empty',
    score: 0,
    issues: [],
    suggestions_en: [],
    suggestions_fa: [],
  };

  // ─── فیلد خالی ───
  if (value === null || value === undefined) {
    result.quality = 'empty';
    result.score = 0;
    return result;
  }

  // ─── آرایه‌ها ───
  if (Array.isArray(value)) {
    if (value.length === 0) {
      result.quality = 'empty';
      result.score = 0;
      return result;
    }

    // بررسی کیفیت محتوای آرایه
    if (fieldPath === 'skills') {
      return assessSkillsQuality(value as string[]);
    }
    if (fieldPath === 'work_experience') {
      return assessWorkExperienceQuality(value);
    }
    if (fieldPath === 'education') {
      return assessEducationQuality(value);
    }

    // آرایه عمومی
    result.quality = value.length >= 3 ? 'good' : value.length >= 1 ? 'fair' : 'empty';
    result.score = Math.min(100, value.length * 25);
    return result;
  }

  // ─── رشته‌ها ───
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed.length === 0) {
      result.quality = 'empty';
      result.score = 0;
      return result;
    }

    // ارزیابی بر اساس نوع فیلد
    if (fieldPath === 'personal_info.summary') {
      return assessSummaryQuality(trimmed);
    }
    if (fieldPath === 'personal_info.email') {
      return assessEmailQuality(trimmed);
    }
    if (fieldPath.includes('url') || fieldPath.includes('linkedin')) {
      return assessUrlQuality(fieldPath, trimmed);
    }

    // رشته عمومی
    result.quality = trimmed.length >= 10 ? 'good' : 'fair';
    result.score = Math.min(100, trimmed.length * 5);
    return result;
  }

  result.quality = 'fair';
  result.score = 50;
  return result;
}

// ─── Helper: ارزیابی خلاصه حرفه‌ای ───
function assessSummaryQuality(summary: string): FieldQualityResult {
  const result: FieldQualityResult = {
    field_path: 'personal_info.summary',
    quality: 'empty',
    score: 0,
    issues: [],
    suggestions_en: [],
    suggestions_fa: [],
  };

  const wordCount = summary.split(/\s+/).length;
  const hasNumbers = /\d/.test(summary);
  const sentenceCount = summary.split(/[.!?؟۔]+/).filter(s => s.trim().length > 0).length;

  let score = 0;

  // طول مناسب (۲۰-۸۰ کلمه ایده‌آل)
  if (wordCount < 10) {
    score += 10;
    result.issues.push('Too short');
    result.suggestions_en.push('Write at least 2-3 sentences describing your professional background, key skills, and career goals.');
    result.suggestions_fa.push('حداقل ۲-۳ جمله درباره سوابق حرفه‌ای، مهارت‌های کلیدی و اهداف شغلی بنویسید.');
  } else if (wordCount < 20) {
    score += 25;
    result.issues.push('Could be more detailed');
    result.suggestions_en.push('Add more specific details about your experience level and key achievements.');
    result.suggestions_fa.push('جزئیات بیشتری درباره سطح تجربه و دستاوردهای کلیدی اضافه کنید.');
  } else if (wordCount <= 80) {
    score += 40;
  } else {
    score += 30;
    result.issues.push('Might be too long');
    result.suggestions_en.push('Consider condensing to 2-4 impactful sentences.');
    result.suggestions_fa.push('سعی کنید در ۲-۴ جمله تأثیرگذار خلاصه کنید.');
  }

  // دارای اعداد/معیار (نشانه کمی‌سازی)
  if (hasNumbers) {
    score += 20;
  } else {
    result.issues.push('No quantifiable metrics');
    result.suggestions_en.push('Include numbers: years of experience, team sizes, or key results (e.g., "8+ years", "led team of 12").');
    result.suggestions_fa.push('اعداد اضافه کنید: سال‌های تجربه، اندازه تیم، یا نتایج کلیدی (مثلاً "بیش از ۸ سال"، "رهبری تیم ۱۲ نفره").');
  }

  // چند جمله‌ای
  if (sentenceCount >= 2) {
    score += 20;
  } else {
    result.issues.push('Only one sentence');
    result.suggestions_en.push('Use multiple sentences: background → skills → goals.');
    result.suggestions_fa.push('چند جمله استفاده کنید: سوابق ← مهارت‌ها ← اهداف.');
  }

  // حاوی کلمات عمل
  const actionWords = /\b(led|managed|developed|built|created|improved|increased|decreased|launched|designed|implemented|achieved|delivered|optimized)\b/i;
  const actionWordsFa = /(رهبری|مدیریت|توسعه|ساخت|ایجاد|بهبود|افزایش|کاهش|راه‌اندازی|طراحی|پیاده‌سازی|دستیابی|تحویل|بهینه‌سازی)/;

  if (actionWords.test(summary) || actionWordsFa.test(summary)) {
    score += 20;
  } else {
    result.issues.push('Missing action verbs');
    result.suggestions_en.push('Start with strong action verbs: "Led", "Built", "Managed", "Developed".');
    result.suggestions_fa.push('با افعال عملی قوی شروع کنید: "رهبری"، "توسعه"، "مدیریت"، "طراحی".');
  }

  result.score = Math.min(100, score);
  result.quality =
    score >= 80 ? 'excellent' :
    score >= 60 ? 'good' :
    score >= 30 ? 'fair' : 'weak';

  return result;
}

// ─── Helper: ارزیابی ایمیل ───
function assessEmailQuality(email: string): FieldQualityResult {
  const result: FieldQualityResult = {
    field_path: 'personal_info.email',
    quality: 'empty',
    score: 0,
    issues: [],
    suggestions_en: [],
    suggestions_fa: [],
  };

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    result.quality = 'weak';
    result.score = 20;
    result.issues.push('Invalid email format');
    result.suggestions_en.push('Please provide a valid email address.');
    result.suggestions_fa.push('لطفاً یک آدرس ایمیل معتبر وارد کنید.');
    return result;
  }

  // بررسی حرفه‌ای بودن
  const unprofessionalPatterns = /\b(sexy|hot|cool|babe|baby|love|cute|ninja|420|69)\b/i;
  if (unprofessionalPatterns.test(email)) {
    result.quality = 'fair';
    result.score = 50;
    result.issues.push('Email may not appear professional');
    result.suggestions_en.push('Consider using a professional email (e.g., firstname.lastname@gmail.com).');
    result.suggestions_fa.push('استفاده از ایمیل حرفه‌ای را در نظر بگیرید (مثلاً firstname.lastname@gmail.com).');
    return result;
  }

  result.quality = 'good';
  result.score = 100;
  return result;
}

// ─── Helper: ارزیابی URL ───
function assessUrlQuality(fieldPath: string, url: string): FieldQualityResult {
  const result: FieldQualityResult = {
    field_path: fieldPath,
    quality: 'empty',
    score: 0,
    issues: [],
    suggestions_en: [],
    suggestions_fa: [],
  };

  const hasProtocol = /^https?:\/\//i.test(url);
  const hasValidDomain = /\.[a-z]{2,}/i.test(url);

  if (!hasValidDomain) {
    result.quality = 'weak';
    result.score = 20;
    result.issues.push('Invalid URL format');
    result.suggestions_en.push('Provide a complete URL starting with https://');
    result.suggestions_fa.push('URL کامل با https:// وارد کنید');
    return result;
  }

  if (!hasProtocol) {
    result.quality = 'fair';
    result.score = 70;
    result.issues.push('URL missing protocol');
    result.suggestions_en.push('Add https:// at the beginning.');
    result.suggestions_fa.push('https:// را در ابتدا اضافه کنید.');
    return result;
  }

  result.quality = 'good';
  result.score = 100;
  return result;
}

// ─── Helper: ارزیابی مهارت‌ها ───
function assessSkillsQuality(skills: string[]): FieldQualityResult {
  const result: FieldQualityResult = {
    field_path: 'skills',
    quality: 'empty',
    score: 0,
    issues: [],
    suggestions_en: [],
    suggestions_fa: [],
  };

  if (skills.length === 0) {
    result.quality = 'empty';
    return result;
  }

  let score = 0;

  // تعداد مهارت‌ها
  if (skills.length >= 10) {
    score += 30;
  } else if (skills.length >= 5) {
    score += 20;
  } else {
    score += 10;
    result.issues.push('Few skills listed');
    result.suggestions_en.push('List at least 8-12 relevant skills including both technical and soft skills.');
    result.suggestions_fa.push('حداقل ۸-۱۲ مهارت مرتبط شامل مهارت‌های فنی و نرم فهرست کنید.');
  }

  // بررسی مهارت‌های تکراری
  const lowerSkills = skills.map(s => s.toLowerCase().trim());
  const uniqueSkills = new Set(lowerSkills);
  if (uniqueSkills.size < lowerSkills.length) {
    result.issues.push('Duplicate skills found');
    result.suggestions_en.push('Remove duplicate skills.');
    result.suggestions_fa.push('مهارت‌های تکراری را حذف کنید.');
  } else {
    score += 15;
  }

  // بررسی مهارت‌های خیلی عمومی
  const genericSkills = ['communication', 'teamwork', 'leadership', 'problem solving', 'microsoft office', 'ارتباطات', 'کار تیمی'];
  const genericCount = lowerSkills.filter(s => genericSkills.some(g => s.includes(g))).length;
  const specificCount = skills.length - genericCount;

  if (specificCount > genericCount) {
    score += 25;
  } else {
    result.issues.push('Too many generic skills');
    result.suggestions_en.push('Include more specific, domain-relevant skills. Replace generic terms with concrete tools and technologies.');
    result.suggestions_fa.push('مهارت‌های تخصصی‌تر و مرتبط با حوزه اضافه کنید. اصطلاحات عمومی را با ابزارها و فناوری‌های مشخص جایگزین کنید.');
  }

  // بررسی طول هر مهارت (خیلی کوتاه یا خیلی بلند)
  const wellFormatted = skills.filter(s => s.trim().length >= 2 && s.trim().length <= 50);
  if (wellFormatted.length === skills.length) {
    score += 15;
  }

  // بررسی ترکیب مهارت‌های فنی و نرم
  score += 15; // bonus اگر تا اینجا رسیده

  result.score = Math.min(100, score);
  result.quality =
    score >= 80 ? 'excellent' :
    score >= 60 ? 'good' :
    score >= 30 ? 'fair' : 'weak';

  return result;
}

// ─── Helper: ارزیابی تجربه کاری ───
function assessWorkExperienceQuality(experiences: any[]): FieldQualityResult {
  const result: FieldQualityResult = {
    field_path: 'work_experience',
    quality: 'empty',
    score: 0,
    issues: [],
    suggestions_en: [],
    suggestions_fa: [],
  };

  if (experiences.length === 0) {
    result.quality = 'empty';
    return result;
  }

  let score = 0;
  let totalIssues = 0;

  // تعداد تجربه‌ها
  score += Math.min(20, experiences.length * 5);

  for (let i = 0; i < experiences.length; i++) {
    const exp = experiences[i];
    const prefix = `Experience ${i + 1} (${exp.company || 'Unknown'})`;

    // عنوان شغلی
    if (!exp.job_title?.trim()) {
      totalIssues++;
      result.issues.push(`${prefix}: Missing job title`);
    }

    // شرکت
    if (!exp.company?.trim()) {
      totalIssues++;
      result.issues.push(`${prefix}: Missing company name`);
    }

    // تاریخ‌ها
    if (!exp.start_date) {
      totalIssues++;
      result.issues.push(`${prefix}: Missing start date`);
    }

    // توضیحات
    const desc = exp.description?.trim() || '';
    if (desc.length === 0) {
      totalIssues++;
      result.issues.push(`${prefix}: Missing description`);
    } else if (desc.split(/\s+/).length < 15) {
      totalIssues++;
      result.issues.push(`${prefix}: Description is too brief`);
    }

    // دستاوردها
    const achievements = exp.achievements || [];
    if (achievements.length === 0) {
      totalIssues++;
      result.issues.push(`${prefix}: No achievements listed`);
    } else {
      // بررسی وجود اعداد در دستاوردها
      const hasMetrics = achievements.some((a: string) => /\d/.test(a));
      if (!hasMetrics) {
        result.issues.push(`${prefix}: Achievements lack quantifiable metrics`);
      }
    }
  }

  // محاسبه امتیاز بر اساس مشکلات
  const maxIssues = experiences.length * 5; // حداکثر ۵ مشکل در هر تجربه
  const issueRatio = totalIssues / maxIssues;
  score += Math.round((1 - issueRatio) * 80);

  if (totalIssues > 0) {
    result.suggestions_en.push('For each experience: include a clear job title, company name, dates, detailed description, and 2-3 quantifiable achievements.');
    result.suggestions_fa.push('برای هر تجربه: عنوان شغلی واضح، نام شرکت، تاریخ، توضیحات مفصل و ۲-۳ دستاورد قابل‌اندازه‌گیری بنویسید.');
  }

  result.score = Math.min(100, Math.max(0, score));
  result.quality =
    result.score >= 80 ? 'excellent' :
    result.score >= 60 ? 'good' :
    result.score >= 30 ? 'fair' : 'weak';

  return result;
}

// ─── Helper: ارزیابی تحصیلات ───
function assessEducationQuality(educations: any[]): FieldQualityResult {
  const result: FieldQualityResult = {
    field_path: 'education',
    quality: 'empty',
    score: 0,
    issues: [],
    suggestions_en: [],
    suggestions_fa: [],
  };

  if (educations.length === 0) {
    result.quality = 'empty';
    return result;
  }

  let score = 20; // حداقل امتیاز برای داشتن تحصیلات
  let totalIssues = 0;

  for (let i = 0; i < educations.length; i++) {
    const edu = educations[i];
    const prefix = `Education ${i + 1}`;

    if (!edu.degree?.trim()) {
      totalIssues++;
      result.issues.push(`${prefix}: Missing degree`);
    }

    if (!edu.institution?.trim()) {
      totalIssues++;
      result.issues.push(`${prefix}: Missing institution`);
    }

    if (!edu.field_of_study?.trim()) {
      totalIssues++;
      result.issues.push(`${prefix}: Missing field of study`);
    }

    if (!edu.end_date && !edu.start_date) {
      totalIssues++;
      result.issues.push(`${prefix}: Missing dates`);
    }
  }

  const maxIssues = educations.length * 4;
  const issueRatio = totalIssues / maxIssues;
  score += Math.round((1 - issueRatio) * 80);

  if (totalIssues > 0) {
    result.suggestions_en.push('For each education entry: include degree name, field of study, institution name, and graduation date.');
    result.suggestions_fa.push('برای هر مدرک تحصیلی: نام مدرک، رشته تحصیلی، نام مؤسسه و تاریخ فارغ‌التحصیلی را بنویسید.');
  }

  result.score = Math.min(100, Math.max(0, score));
  result.quality =
    result.score >= 80 ? 'excellent' :
    result.score >= 60 ? 'good' :
    result.score >= 30 ? 'fair' : 'weak';

  return result;
}

// ═══════════════════════════════════════════
// اعتبارسنجی Domain-Aware
// ═══════════════════════════════════════════

export interface DomainValidationResult {
  /** حوزه‌ای که اعتبارسنجی برایش انجام شده */
  domain: CVDomainId;
  /** امتیاز کلی برای این حوزه (0-100) */
  score: number;
  /** فیلدهای حیاتی این حوزه و وضعیتشان */
  critical_field_statuses: CVFieldStatus[];
  /** بخش‌های اختصاصی حوزه و وضعیتشان */
  specific_section_statuses: {
    section_id: string;
    section_label_en: string;
    section_label_fa: string;
    is_present: boolean;
    is_required: boolean;
    quality: FieldQuality;
  }[];
  /** ارزیابی‌های کیفی فیلدها */
  quality_assessments: FieldQualityResult[];
}

/**
 * اعتبارسنجی CV برای حوزه‌های مشخص
 * هر حوزه جداگانه امتیازدهی می‌شود
 */
export function validateForDomains(
  cv: Partial<ComprehensiveCV>,
  domainIds: CVDomainId[]
): DomainValidationResult[] {
  const results: DomainValidationResult[] = [];

  for (const domainId of domainIds) {
    const domain = CV_DOMAINS[domainId];
    if (!domain) continue;

    const result: DomainValidationResult = {
      domain: domainId,
      score: 0,
      critical_field_statuses: [],
      specific_section_statuses: [],
      quality_assessments: [],
    };

    let totalScore = 0;
    let totalWeight = 0;

    // ─── ارزیابی فیلدهای حیاتی حوزه ───
    for (const fieldPath of domain.critical_fields) {
      const value = getNestedValue(cv, fieldPath);
      const isComplete = isFieldComplete(value);
      const quality = assessFieldQuality(fieldPath, value);

      result.critical_field_statuses.push({
        field_path: fieldPath,
        field_name: fieldPathToLabel(fieldPath),
        is_complete: isComplete,
        is_required: true,
        current_value: value,
      });

      result.quality_assessments.push(quality);

      // وزن‌دهی: فیلدهای حیاتی حوزه وزن بیشتری دارند
      totalScore += quality.score * 2;
      totalWeight += 2;
    }

    // ─── ارزیابی بخش‌های اختصاصی حوزه ───
    for (const section of domain.specific_sections) {
      const sectionData = findSectionInCV(cv, section.id);
      const isPresent = sectionData !== null && sectionData !== undefined;
      const sectionQuality = isPresent ? 'good' : 'empty';

      result.specific_section_statuses.push({
        section_id: section.id,
        section_label_en: section.label_en,
        section_label_fa: section.label_fa,
        is_present: isPresent,
        is_required: section.is_required,
        quality: sectionQuality,
      });

      const weight = section.is_required ? 1.5 : 0.5;
      totalScore += (isPresent ? 80 : 0) * weight;
      totalWeight += weight;
    }

    // ─── ارزیابی بخش‌های عمومی ───
    const generalFields = [
      'personal_info.full_name',
      'personal_info.email',
      'personal_info.phone',
    ];

    for (const fieldPath of generalFields) {
      if (!domain.critical_fields.includes(fieldPath)) {
        const value = getNestedValue(cv, fieldPath);
        const quality = assessFieldQuality(fieldPath, value);
        totalScore += quality.score;
        totalWeight += 1;
      }
    }

    // محاسبه امتیاز نهایی
    result.score = totalWeight > 0
      ? Math.round(totalScore / totalWeight)
      : 0;

    results.push(result);
  }

  return results;
}

/**
 * محاسبه امتیاز تکمیل به تفکیک حوزه
 */
export function getDomainCompletionScore(
  cv: Partial<ComprehensiveCV>,
  domainId: CVDomainId
): number {
  const results = validateForDomains(cv, [domainId]);
  return results[0]?.score || 0;
}

/**
 * خلاصه کامل اعتبارسنجی
 */
export interface ValidationSummary {
  /** آیا CV حداقل اطلاعات لازم را دارد */
  is_viable: boolean;
  /** درصد تکمیل پایه (بدون در نظر گرفتن حوزه) */
  base_completion: number;
  /** امتیاز به تفکیک حوزه */
  domain_scores: Record<CVDomainId, number>;
  /** تعداد فیلدهای ناقص */
  missing_required_count: number;
  /** تعداد فیلدهای اختیاری ناقص */
  missing_optional_count: number;
  /** کیفیت کلی */
  overall_quality: FieldQuality;
  /** فیلدهای با کیفیت ضعیف */
  weak_fields: string[];
  /** فیلدهای خالی مهم */
  empty_required_fields: string[];
}

export function generateValidationSummary(
  cv: Partial<ComprehensiveCV>,
  domainIds: CVDomainId[]
): ValidationSummary {
  const baseStatuses = validateExtractedCV(cv);
  const baseCompletion = getCompletionPercentage(baseStatuses);
  const domainResults = validateForDomains(cv, domainIds);

  const domainScores: Record<string, number> = {};
  for (const r of domainResults) {
    domainScores[r.domain] = r.score;
  }

  const missingRequired = baseStatuses.filter(s => !s.is_complete && s.is_required);
  const missingOptional = baseStatuses.filter(s => !s.is_complete && !s.is_required);

  // فیلدهای با کیفیت ضعیف
  const weakFields: string[] = [];
  const fieldsToCheck = [
    'personal_info.summary',
    'skills',
    'work_experience',
    'education',
  ];

  for (const fp of fieldsToCheck) {
    const value = getNestedValue(cv, fp);
    const quality = assessFieldQuality(fp, value);
    if (quality.quality === 'weak' || quality.quality === 'empty') {
      weakFields.push(fp);
    }
  }

  // کیفیت کلی
  const avgScore = domainResults.length > 0
    ? domainResults.reduce((sum, r) => sum + r.score, 0) / domainResults.length
    : baseCompletion;

  const overallQuality: FieldQuality =
    avgScore >= 80 ? 'excellent' :
    avgScore >= 60 ? 'good' :
    avgScore >= 30 ? 'fair' : 'weak';

  return {
    is_viable: isMinimumViable(cv),
    base_completion: baseCompletion,
    domain_scores: domainScores as Record<CVDomainId, number>,
    missing_required_count: missingRequired.length,
    missing_optional_count: missingOptional.length,
    overall_quality: overallQuality,
    weak_fields: weakFields,
    empty_required_fields: missingRequired.map(s => s.field_path),
  };
}

// ═══════════════════════════════════════════
// توابع کمکی داخلی
// ═══════════════════════════════════════════

/**
 * دسترسی به مقدار nested در object
 * مثال: getNestedValue(cv, 'personal_info.summary')
 */
function getNestedValue(obj: any, path: string): unknown {
  if (!obj || !path) return undefined;

  const parts = path.split('.');
  let current = obj;

  for (const part of parts) {
    if (current === null || current === undefined) return undefined;
    current = current[part];
  }

  return current;
}

/**
 * بررسی اینکه آیا یک فیلد کامل (غیرخالی) است
 */
function isFieldComplete(value: unknown): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === 'object') return Object.keys(value as object).length > 0;
  return true;
}

/**
 * تبدیل field_path به عنوان خوانا
 */
function fieldPathToLabel(path: string): string {
  const labels: Record<string, string> = {
    'personal_info.full_name': 'Full Name',
    'personal_info.email': 'Email',
    'personal_info.phone': 'Phone',
    'personal_info.location': 'Location',
    'personal_info.summary': 'Professional Summary',
    'personal_info.linkedin_url': 'LinkedIn URL',
    'personal_info.website_url': 'Website URL',
    'work_experience': 'Work Experience',
    'education': 'Education',
    'skills': 'Skills',
    'certifications': 'Certifications',
    'languages': 'Languages',
    'projects': 'Projects',
  };
  return labels[path] || path.split('.').pop() || path;
}

/**
 * جستجوی یک بخش اختصاصی در CV
 * ابتدا در additional_sections و سپس در سایر فیلدها
 */
function findSectionInCV(cv: Partial<ComprehensiveCV>, sectionId: string): unknown {
  // بررسی additional_sections
  if (cv.additional_sections) {
    const found = cv.additional_sections.find(
      s => s.id === sectionId || s.title?.toLowerCase().includes(sectionId.replace(/_/g, ' '))
    );
    if (found && found.content?.trim()) {
      return found.content;
    }
  }

  // بررسی فیلدهای خاص بر اساس ID بخش
  const sectionMap: Record<string, () => unknown> = {
    'technical_skills': () => cv.skills?.length ? cv.skills : null,
    'ml_frameworks': () => cv.skills?.length ? cv.skills : null,
    'design_tools': () => cv.skills?.length ? cv.skills : null,
    'ee_tools': () => cv.skills?.length ? cv.skills : null,
    'cad_software': () => cv.skills?.length ? cv.skills : null,
    'github_portfolio': () => cv.personal_info?.website_url || null,
    'design_portfolio': () => cv.personal_info?.website_url || null,
    'creative_portfolio': () => cv.personal_info?.website_url || null,
    'publications_list': () => cv.projects?.length ? cv.projects : null,
    'publications': () => cv.projects?.length ? cv.projects : null,
    'research_publications': () => cv.projects?.length ? cv.projects : null,
    'published_work': () => cv.projects?.length ? cv.projects : null,
    'teaching_experience': () => cv.work_experience?.some(w =>
      /teach|lecture|professor|instructor|تدریس|استاد/i.test(`${w.job_title} ${w.description}`)
    ) ? true : null,
    'clinical_experience': () => cv.work_experience?.some(w =>
      /clinical|hospital|patient|بالینی|بیمارستان/i.test(`${w.job_title} ${w.description}`)
    ) ? true : null,
    'licenses': () => cv.certifications?.length ? cv.certifications : null,
    'bar_admission': () => cv.certifications?.length ? cv.certifications : null,
    'pe_license': () => cv.certifications?.length ? cv.certifications : null,
    'teaching_credentials': () => cv.certifications?.length ? cv.certifications : null,
    'financial_certifications': () => cv.certifications?.length ? cv.certifications : null,
    'hr_certifications': () => cv.certifications?.length ? cv.certifications : null,
    'ops_certifications': () => cv.certifications?.length ? cv.certifications : null,
    'professional_summary': () => cv.personal_info?.summary?.trim() || null,
  };

  const mapper = sectionMap[sectionId];
  if (mapper) {
    return mapper();
  }

  return null;
}
