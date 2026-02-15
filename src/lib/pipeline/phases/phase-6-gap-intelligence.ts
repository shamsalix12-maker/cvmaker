// ============================================
// Phase 6: Gap Intelligence Generation
// Generate guidance for the user to fill missing or incomplete fields
// ============================================

import { GapIntelligenceResult, GapGuidance } from '../types/pipeline.types';
import { CVDomainId, CVGapItem } from '../../types/cv-domain.types';
import { CV_DOMAINS } from '../../cv/cv-domains';
import { FieldAudit } from '../types/pipeline.types';

export function generateGapIntelligence(
  cv: any,
  assessmentResult: any,
  selectedDomains: CVDomainId[],
  cvLanguage: 'en' | 'fa' = 'en'
): GapIntelligenceResult {
  const gapGuidance: GapGuidance[] = [];
  const prioritizedGaps: string[] = [];
  const domainSpecificGuidance: Record<CVDomainId, GapGuidance[]> = {} as any;

  const gaps = assessmentResult.fieldAudits?.filter(
    (audit: FieldAudit) => audit.completenessScore < 70 || !audit.exists
  ) || [];

  const severityOrder: Record<string, number> = {
    critical: 0,
    important: 1,
    recommended: 2,
    optional: 3,
  };

  for (const gap of gaps) {
    const guidance = createGapGuidance(gap, selectedDomains, cvLanguage);
    gapGuidance.push(guidance);
    prioritizedGaps.push(gap.fieldPath);
  }

  for (const domainId of selectedDomains) {
    const domain = CV_DOMAINS[domainId];
    if (!domain) continue;

    domainSpecificGuidance[domainId] = [];

    for (const section of domain.specific_sections) {
      if (section.is_required) {
        const gapForSection = gaps.find(
          (g: FieldAudit) => g.fieldPath.includes(section.id)
        );

        if (gapForSection || !hasSection(cv, section.id)) {
          domainSpecificGuidance[domainId].push({
            field: `additional_sections.${section.id}`,
            guidanceText: section.description_en,
            guidanceTextFa: section.description_fa,
            example: section.example_en,
            exampleFa: section.example_fa,
            skipAllowed: !section.is_required,
          });
        }
      }
    }
  }

  prioritizedGaps.sort((a, b) => {
    const gapA = gaps.find((g: FieldAudit) => g.fieldPath === a);
    const gapB = gaps.find((g: FieldAudit) => g.fieldPath === b);
    return (gapA?.completenessScore || 0) - (gapB?.completenessScore || 0);
  });

  return {
    gapGuidance,
    prioritizedGaps,
    domainSpecificGuidance,
  };
}

function createGapGuidance(
  gap: FieldAudit,
  domains: CVDomainId[],
  lang: 'en' | 'fa'
): GapGuidance {
  const fieldName = gap.fieldPath.split('.').pop() || gap.fieldPath;
  
  const guidanceTemplates: Record<string, { en: string; fa: string; exampleEn: string; exampleFa: string }> = {
    'personal_info.summary': {
      en: 'Write a professional summary highlighting your experience, key skills, and career goals.',
      fa: 'یک خلاصه حرفه‌ای بنویسید که تجربه، مهارت‌های کلیدی و اهداف شغلی شما را برجسته کند.',
      exampleEn: 'Experienced software engineer with 5+ years in web development...',
      exampleFa: 'مهندس نرم‌افزار باتجربه با بیش از ۵ سال در توسعه وب...',
    },
    'personal_info.phone': {
      en: 'Add your phone number with country code.',
      fa: 'شماره تلفن خود را با کد کشور اضافه کنید.',
      exampleEn: '+98 912 345 6789',
      exampleFa: '+۹۸ ۹۱۲ ۳۴۵ ۶۷۸۹',
    },
    'personal_info.linkedin_url': {
      en: 'Add your LinkedIn profile URL.',
      fa: 'آدرس پروفایل لینکدین خود را اضافه کنید.',
      exampleEn: 'https://linkedin.com/in/yourprofile',
      exampleFa: 'https://linkedin.com/in/yourprofile',
    },
    'work_experience': {
      en: 'Add your work experience with job titles, companies, and dates.',
      fa: 'سوابق شغلی خود را با عناوین، شرکت‌ها و تاریخ‌ها اضافه کنید.',
      exampleEn: 'Software Engineer at Tech Company (2020-Present)',
      exampleFa: 'مهندس نرم‌افزار در شرکت فناوری (۱۴۰۰-اکنون)',
    },
    'education': {
      en: 'Add your educational background.',
      fa: 'تحصیلات خود را اضافه کنید.',
      exampleEn: 'B.Sc. Computer Science, University Name (2016-2020)',
      exampleFa: 'کارشناسی علوم کامپیوتر، نام دانشگاه (۱۳۹۵-۱۳۹۹)',
    },
    'skills': {
      en: 'List your technical and soft skills.',
      fa: 'مهارت‌های فنی و نرم خود را فهرست کنید.',
      exampleEn: 'JavaScript, Python, Project Management, Communication',
      exampleFa: 'جاوااسکریپت، پایتون، مدیریت پروژه، ارتباطات',
    },
    'certifications': {
      en: 'Add any relevant certifications.',
      fa: 'هر گواهینامه مرتبطی اضافه کنید.',
      exampleEn: 'AWS Solutions Architect (2023)',
      exampleFa: 'معماری AWS (۱۴۰۲)',
    },
    'projects': {
      en: 'Add 2-3 notable projects.',
      fa: '۲-۳ پروژه شاخص اضافه کنید.',
      exampleEn: 'E-commerce Platform - React, Node.js, PostgreSQL',
      exampleFa: 'پلتفرم تجارت الکترونیک - React, Node.js, PostgreSQL',
    },
  };

  const template = guidanceTemplates[fieldName] || guidanceTemplates[gap.fieldPath] || {
    en: `Please provide information for: ${fieldName}`,
    fa: `لطفاً اطلاعات را برای: ${fieldName} ارائه دهید`,
    exampleEn: '',
    exampleFa: '',
  };

  return {
    field: gap.fieldPath,
    guidanceText: lang === 'fa' ? template.fa : template.en,
    guidanceTextFa: template.fa,
    example: template.exampleEn,
    exampleFa: template.exampleFa,
    skipAllowed: !isCriticalField(gap.fieldPath, domains),
  };
}

function isCriticalField(fieldPath: string, domains: CVDomainId[]): boolean {
  const criticalPatterns = [
    'personal_info.summary',
    'work_experience',
    'education',
    'skills',
  ];

  return criticalPatterns.some(pattern => fieldPath.includes(pattern));
}

function hasSection(cv: any, sectionId: string): boolean {
  if (cv.additional_sections) {
    return cv.additional_sections.some(
      (s: any) => s.id === sectionId || s.title?.toLowerCase().includes(sectionId.replace(/_/g, ' '))
    );
  }
  return false;
}

export const PHASE_6_GAP_INTELLIGENCE_PROMPT = `Based on domain rules and field audits, create actionable guidance for the user to fill incomplete fields.

Output JSON:
{
  "gapGuidance": [
    {
      "field": string,
      "guidanceText": string,
      "guidanceTextFa": string,
      "example": string,
      "exampleFa": string,
      "skipAllowed": boolean
    }
  ],
  "prioritizedGaps": string[],
  "domainSpecificGuidance": Record<DomainId, GapGuidance[]>
}

Rules:
- Include examples and skip instructions
- Tailor guidance to domain rules
- Prioritize critical gaps first`;
