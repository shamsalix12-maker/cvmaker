// ============================================
// Phase 8: Final CV Rendering
// Generate professional CV text
// ============================================

import { RenderResult, RenderRequest } from '../types/pipeline.types';
import { CVDomainId } from '../../types/cv-domain.types';
import { CV_DOMAINS } from '../../cv/cv-domains';

export async function renderCV(request: RenderRequest): Promise<RenderResult> {
  const { cv, domains, format, language, templateId } = request;

  let output: string;

  switch (format) {
    case 'markdown':
      output = renderMarkdown(cv, domains, language);
      break;
    case 'docx':
      output = await renderDOCX(cv, domains, language);
      break;
    case 'pdf':
      output = await renderPDF(cv, domains, language);
      break;
    default:
      output = renderMarkdown(cv, domains, language);
  }

  const metadata = {
    wordCount: countWords(output),
    sectionCount: countSections(cv),
    domainCoverage: calculateDomainCoverage(cv, domains),
  };

  return {
    output,
    format,
    metadata,
  };
}

function renderMarkdown(cv: any, domains: CVDomainId[], language: 'en' | 'fa'): string {
  const isRtl = language === 'fa';
  const lines: string[] = [];

  if (isRtl) {
    lines.push('# رزومه\n');
  } else {
    lines.push('# CV\n');
  }

  if (cv.personal_info) {
    lines.push('## ' + (isRtl ? 'اطلاعات شخصی' : 'Personal Information'));
    lines.push('');
    
    const pi = cv.personal_info;
    if (pi.full_name) lines.push(`**${isRtl ? 'نام' : 'Name'}:** ${pi.full_name}`);
    if (pi.email) lines.push(`**${isRtl ? 'ایمیل' : 'Email'}:** ${pi.email}`);
    if (pi.phone) lines.push(`**${isRtl ? 'تلفن' : 'Phone'}:** ${pi.phone}`);
    if (pi.location) lines.push(`**${isRtl ? 'محل' : 'Location'}:** ${pi.location}`);
    if (pi.linkedin_url) lines.push(`**${isRtl ? 'لینکدین' : 'LinkedIn'}:** ${pi.linkedin_url}`);
    if (pi.website_url) lines.push(`**${isRtl ? 'وبسایت' : 'Website'}:** ${pi.website_url}`);
    if (pi.summary) {
      lines.push('');
      lines.push(`**${isRtl ? 'خلاصه' : 'Summary'}**`);
      lines.push(pi.summary);
    }
    lines.push('');
  }

  if (cv.work_experience?.length > 0) {
    lines.push('## ' + (isRtl ? 'تجربه شغلی' : 'Work Experience'));
    lines.push('');
    
    for (const exp of cv.work_experience) {
      lines.push(`### ${exp.job_title}`);
      lines.push(`**${exp.company}**${exp.location ? ` - ${exp.location}` : ''}`);
      lines.push(`${exp.start_date || ''} - ${exp.is_current ? (isRtl ? 'اکنون' : 'Present') : exp.end_date || ''}`);
      lines.push('');
      if (exp.description) {
        lines.push(exp.description);
        lines.push('');
      }
      if (exp.achievements?.length > 0) {
        lines.push(isRtl ? 'دستاوردها:' : 'Achievements:');
        for (const achievement of exp.achievements) {
          lines.push(`- ${achievement}`);
        }
        lines.push('');
      }
    }
  }

  if (cv.education?.length > 0) {
    lines.push('## ' + (isRtl ? 'تحصیلات' : 'Education'));
    lines.push('');
    
    for (const edu of cv.education) {
      lines.push(`### ${edu.degree}${edu.field_of_study ? ` - ${edu.field_of_study}` : ''}`);
      lines.push(`**${edu.institution}**${edu.location ? ` - ${edu.location}` : ''}`);
      lines.push(`${edu.start_date || ''} - ${edu.end_date || ''}`);
      if (edu.gpa) lines.push(`**GPA:** ${edu.gpa}`);
      if (edu.description) {
        lines.push('');
        lines.push(edu.description);
      }
      lines.push('');
    }
  }

  if (cv.skills?.length > 0) {
    lines.push('## ' + (isRtl ? 'مهارت‌ها' : 'Skills'));
    lines.push('');
    lines.push(cv.skills.join(', '));
    lines.push('');
  }

  if (cv.certifications?.length > 0) {
    lines.push('## ' + (isRtl ? 'گواهینامه‌ها' : 'Certifications'));
    lines.push('');
    
    for (const cert of cv.certifications) {
      lines.push(`- **${cert.name}**${cert.issuer ? ` - ${cert.issuer}` : ''}${cert.date_obtained ? ` (${cert.date_obtained})` : ''}`);
    }
    lines.push('');
  }

  if (cv.projects?.length > 0) {
    lines.push('## ' + (isRtl ? 'پروژه‌ها' : 'Projects'));
    lines.push('');
    
    for (const proj of cv.projects) {
      lines.push(`### ${proj.name}`);
      if (proj.description) lines.push(proj.description);
      if (proj.technologies?.length > 0) {
        lines.push(`**${isRtl ? 'فناوری‌ها' : 'Technologies'}:** ${proj.technologies.join(', ')}`);
      }
      if (proj.url) lines.push(`**URL:** ${proj.url}`);
      lines.push('');
    }
  }

  if (cv.languages?.length > 0) {
    lines.push('## ' + (isRtl ? 'زبان‌ها' : 'Languages'));
    lines.push('');
    
    for (const lang of cv.languages) {
      lines.push(`- ${lang.language}: ${lang.proficiency}`);
    }
    lines.push('');
  }

  return lines.join('\n');
}

async function renderDOCX(cv: any, domains: CVDomainId[], language: 'en' | 'fa'): Promise<string> {
  const markdown = renderMarkdown(cv, domains, language);
  const { generateDocx } = await import('../../generators/docx-generator');
  const buffer = await generateDocx({
    content: markdown,
    type: 'cv',
    locale: language,
  });
  return buffer.toString('base64');
}

async function renderPDF(cv: any, domains: CVDomainId[], language: 'en' | 'fa'): Promise<string> {
  const markdown = renderMarkdown(cv, domains, language);
  return markdown;
}

function countWords(text: string): number {
  return text.split(/\s+/).filter(w => w.length > 0).length;
}

function countSections(cv: any): number {
  let count = 0;
  if (cv.personal_info) count++;
  if (cv.work_experience?.length > 0) count++;
  if (cv.education?.length > 0) count++;
  if (cv.skills?.length > 0) count++;
  if (cv.certifications?.length > 0) count++;
  if (cv.projects?.length > 0) count++;
  if (cv.languages?.length > 0) count++;
  if (cv.additional_sections?.length > 0) count += cv.additional_sections.length;
  return count;
}

function calculateDomainCoverage(cv: any, domains: CVDomainId[]): Record<CVDomainId, number> {
  const coverage: Record<string, number> = {};

  for (const domainId of domains) {
    const domain = CV_DOMAINS[domainId];
    if (!domain) continue;

    let score = 0;
    let maxScore = 0;

    for (const field of domain.critical_fields) {
      maxScore += 2;
      const value = getNestedValue(cv, field);
      if (isPopulated(value)) {
        score += 2;
      }
    }

    coverage[domainId] = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
  }

  return coverage as Record<CVDomainId, number>;
}

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

function isPopulated(value: unknown): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === 'object') return Object.keys(value).length > 0;
  return true;
}

export const PHASE_8_RENDERING_PROMPT = `Render a professional CV text from the canonical CV JSON.

Rules:
- Do not invent or remove any data
- Focus on readability, clarity, formatting
- Respect multi-domain context
- No hallucination or data loss

Input: Canonical CV + Selected Domains
Output: Professional formatted CV text`;
