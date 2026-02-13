// ============================================
// src/components/cv/GapAnalysisDashboard.tsx
// Gap Analysis Dashboard Component
// ============================================

'use client';

import { useMemo } from 'react';
import {
  CVGapAnalysis,
  CVGapItem,
  GapSeverity,
  CVDomainId,
} from '@/lib/types/cv-domain.types';
import { CV_DOMAINS } from '@/lib/cv/cv-domains';

// ─── Props ───

interface GapAnalysisDashboardProps {
  /** نتیجه تحلیل نواقص */
  analysis: CVGapAnalysis;
  /** زبان رابط */
  locale: 'en' | 'fa';
  /** کلیک بر دکمه شروع رفع نواقص */
  onStartResolving: () => void;
  /** کلیک بر یک نقص خاص */
  onGapClick: (gap: CVGapItem) => void;
}

// ─── Severity Config ───

const SEVERITY_CONFIG: Record<
  GapSeverity,
  {
    icon: string;
    label_en: string;
    label_fa: string;
    textColor: string;
    bgColor: string;
    borderColor: string;
  }
> = {
  critical: {
    icon: '🚨',
    label_en: 'Critical',
    label_fa: 'بحرانی',
    textColor: 'text-red-700 dark:text-red-400',
    bgColor: 'bg-red-50 dark:bg-red-900/20',
    borderColor: 'border-red-200 dark:border-red-800',
  },
  important: {
    icon: '⚠️',
    label_en: 'Important',
    label_fa: 'مهم',
    textColor: 'text-orange-700 dark:text-orange-400',
    bgColor: 'bg-orange-50 dark:bg-orange-900/20',
    borderColor: 'border-orange-200 dark:border-orange-800',
  },
  recommended: {
    icon: '💡',
    label_en: 'Recommended',
    label_fa: 'پیشنهادی',
    textColor: 'text-yellow-700 dark:text-yellow-400',
    bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
    borderColor: 'border-yellow-200 dark:border-yellow-800',
  },
  optional: {
    icon: '✨',
    label_en: 'Optional',
    label_fa: 'اختیاری',
    textColor: 'text-blue-700 dark:text-blue-400',
    bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    borderColor: 'border-blue-200 dark:border-blue-800',
  },
};

const SEVERITY_ORDER: GapSeverity[] = ['critical', 'important', 'recommended', 'optional'];

// ─── Component ───

export function GapAnalysisDashboard({
  analysis,
  locale,
  onStartResolving,
  onGapClick,
}: GapAnalysisDashboardProps) {
  const isRTL = locale === 'fa';

  // دسته‌بندی نواقص
  const { gapsBySeverity, activeGaps, resolvedGaps, skippedGaps } = useMemo(() => {
    const groups: Record<GapSeverity, CVGapItem[]> = {
      critical: [],
      important: [],
      recommended: [],
      optional: [],
    };

    const active: CVGapItem[] = [];
    const resolved: CVGapItem[] = [];
    const skipped: CVGapItem[] = [];

    for (const gap of analysis.gaps) {
      if (gap.is_resolved) {
        resolved.push(gap);
      } else if (gap.is_skipped) {
        skipped.push(gap);
      } else {
        active.push(gap);
        groups[gap.severity].push(gap);
      }
    }

    return { gapsBySeverity: groups, activeGaps: active, resolvedGaps: resolved, skippedGaps: skipped };
  }, [analysis.gaps]);

  // رنگ امتیاز
  const scoreColor = useMemo(() => {
    const s = analysis.overall_score;
    if (s >= 80) return 'text-green-600 dark:text-green-400';
    if (s >= 60) return 'text-yellow-600 dark:text-yellow-400';
    if (s >= 40) return 'text-orange-600 dark:text-orange-400';
    return 'text-red-600 dark:text-red-400';
  }, [analysis.overall_score]);

  return (
    <div className={`space-y-6 ${isRTL ? 'rtl text-right' : 'ltr text-left'}`}>

      {/* ═══ Score & Summary Card ═══ */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">

          {/* Score + Summary */}
          <div className="flex items-center gap-4">
            {/* Score circle */}
            <ScoreCircle score={analysis.overall_score} color={scoreColor} />

            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {locale === 'fa' ? 'امتیاز رزومه' : 'CV Score'}
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 max-w-md mt-1">
                {analysis.analysis_summary || (locale === 'fa'
                  ? 'تحلیل رزومه شما تکمیل شد.'
                  : 'Your CV analysis is complete.')}
              </p>
            </div>
          </div>

          {/* Stats badges */}
          <div className="flex gap-3 flex-shrink-0">
            <StatBadge
              count={activeGaps.length}
              label={locale === 'fa' ? 'نقص فعال' : 'Active'}
              colorClass="text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20"
            />
            <StatBadge
              count={resolvedGaps.length}
              label={locale === 'fa' ? 'رفع‌شده' : 'Fixed'}
              colorClass="text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20"
            />
            <StatBadge
              count={skippedGaps.length}
              label={locale === 'fa' ? 'رد شده' : 'Skipped'}
              colorClass="text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700/50"
            />
          </div>
        </div>

        {/* Domain scores */}
        {Object.keys(analysis.domain_scores).length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide">
              {locale === 'fa' ? 'امتیاز به تفکیک حوزه' : 'Score by Domain'}
            </h3>
            <div className="flex flex-wrap gap-2">
              {Object.entries(analysis.domain_scores).map(([domainId, score]) => {
                const domain = CV_DOMAINS[domainId as CVDomainId];
                if (!domain) return null;
                const numScore = score as number;
                const barColor =
                  numScore >= 70 ? 'bg-green-500' :
                  numScore >= 40 ? 'bg-yellow-500' : 'bg-red-500';

                return (
                  <div
                    key={domainId}
                    className="flex items-center gap-2 bg-gray-50 dark:bg-gray-700/50 px-3 py-2 rounded-lg min-w-[160px]"
                  >
                    <span className="text-lg">{domain.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-gray-700 dark:text-gray-300 truncate">
                        {locale === 'fa' ? domain.label_fa : domain.label_en}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <div className="flex-1 h-1.5 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${barColor}`}
                            style={{ width: `${numScore}%` }}
                          />
                        </div>
                        <span className="text-xs font-semibold text-gray-600 dark:text-gray-400 w-8 text-end">
                          {numScore}%
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ═══ Strengths ═══ */}
      {analysis.strengths.length > 0 && (
        <div className="bg-green-50 dark:bg-green-900/10 rounded-xl border border-green-200 dark:border-green-800 p-4">
          <h3 className="font-medium text-green-800 dark:text-green-300 mb-3 flex items-center gap-2">
            <span>💪</span>
            {locale === 'fa' ? 'نقاط قوت رزومه شما' : 'Your CV Strengths'}
          </h3>
          <div className="space-y-2">
            {analysis.strengths.map((s, i) => (
              <div key={i} className="flex items-start gap-2 text-sm">
                <span className="text-green-500 mt-0.5 flex-shrink-0">✓</span>
                <div>
                  <span className="font-medium text-green-800 dark:text-green-300">
                    {locale === 'fa' ? s.title_fa : s.title_en}
                  </span>
                  {(s.description_en || s.description_fa) && (
                    <>
                      {' — '}
                      <span className="text-green-700 dark:text-green-400">
                        {locale === 'fa' ? s.description_fa : s.description_en}
                      </span>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ═══ Gaps by severity ═══ */}
      {activeGaps.length > 0 && (
        <div className="space-y-4">
          {/* Header + CTA */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <span>📋</span>
              {locale === 'fa' ? 'نواقص و پیشنهادات بهبود' : 'Gaps & Improvement Suggestions'}
            </h3>
            <button
              onClick={onStartResolving}
              className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 active:bg-blue-800 transition-colors text-sm font-medium flex items-center gap-2 shadow-sm"
            >
              <span>🔧</span>
              {locale === 'fa' ? 'شروع رفع نواقص' : 'Start Fixing Gaps'}
            </button>
          </div>

          {/* Gap groups */}
          {SEVERITY_ORDER.map(severity => {
            const gaps = gapsBySeverity[severity];
            if (gaps.length === 0) return null;
            const config = SEVERITY_CONFIG[severity];

            return (
              <div key={severity}>
                {/* Severity label */}
                <h4 className={`text-sm font-medium ${config.textColor} mb-2 flex items-center gap-1.5`}>
                  <span>{config.icon}</span>
                  <span>{locale === 'fa' ? config.label_fa : config.label_en}</span>
                  <span className="bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-2 py-0.5 rounded-full text-xs ms-1">
                    {gaps.length}
                  </span>
                </h4>

                {/* Gap cards */}
                <div className="space-y-2">
                  {gaps.map(gap => (
                    <GapCard
                      key={gap.id}
                      gap={gap}
                      locale={locale}
                      config={config}
                      onClick={() => onGapClick(gap)}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ═══ All clear ═══ */}
      {activeGaps.length === 0 && (
        <div className="text-center py-10 bg-green-50 dark:bg-green-900/10 rounded-xl border border-green-200 dark:border-green-800">
          <span className="text-5xl">🎉</span>
          <h3 className="text-lg font-semibold text-green-800 dark:text-green-300 mt-3">
            {locale === 'fa' ? 'عالی! تمام نواقص بررسی شده‌اند!' : 'Great! All gaps have been reviewed!'}
          </h3>
          <p className="text-sm text-green-600 dark:text-green-400 mt-1 max-w-md mx-auto">
            {locale === 'fa'
              ? 'رزومه جامع شما آماده استفاده است. می‌توانید آن را بازبینی و ذخیره کنید.'
              : 'Your comprehensive CV is ready. You can review and save it.'}
          </p>
        </div>
      )}

      {/* ═══ General Recommendations ═══ */}
      {analysis.general_recommendations.length > 0 && (
        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <h3 className="font-medium text-gray-800 dark:text-gray-200 mb-2 flex items-center gap-2">
            <span>📝</span>
            {locale === 'fa' ? 'توصیه‌های کلی' : 'General Recommendations'}
          </h3>
          <ul className="space-y-1.5">
            {analysis.general_recommendations.map((rec, i) => (
              <li key={i} className="text-sm text-gray-600 dark:text-gray-400 flex items-start gap-2">
                <span className="text-gray-400 mt-0.5 flex-shrink-0">•</span>
                <span>{rec}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════
// Sub-components
// ═══════════════════════════════════════════

function ScoreCircle({ score, color }: { score: number; color: string }) {
  const circumference = 2 * Math.PI * 35; // r=35
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="relative w-20 h-20 flex-shrink-0">
      <svg className="w-20 h-20 transform -rotate-90" viewBox="0 0 80 80">
        {/* Background circle */}
        <circle
          cx="40" cy="40" r="35"
          fill="none"
          stroke="currentColor"
          strokeWidth="6"
          className="text-gray-200 dark:text-gray-700"
        />
        {/* Score arc */}
        <circle
          cx="40" cy="40" r="35"
          fill="none"
          stroke="currentColor"
          strokeWidth="6"
          className={color}
          strokeDasharray={`${circumference}`}
          strokeDashoffset={`${offset}`}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 1s ease-out' }}
        />
      </svg>
      <span className={`absolute inset-0 flex items-center justify-center text-xl font-bold ${color}`}>
        {score}
      </span>
    </div>
  );
}

function StatBadge({
  count,
  label,
  colorClass,
}: {
  count: number;
  label: string;
  colorClass: string;
}) {
  return (
    <div className={`flex flex-col items-center px-3 py-2 rounded-lg ${colorClass}`}>
      <span className="text-xl font-bold">{count}</span>
      <span className="text-[10px] uppercase tracking-wide">{label}</span>
    </div>
  );
}

function GapCard({
  gap,
  locale,
  config,
  onClick,
}: {
  gap: CVGapItem;
  locale: 'en' | 'fa';
  config: (typeof SEVERITY_CONFIG)[GapSeverity];
  onClick: () => void;
}) {
  const isRTL = locale === 'fa';

  return (
    <button
      onClick={onClick}
      className={`w-full p-3 rounded-lg border ${config.bgColor} ${config.borderColor} hover:shadow-sm transition-shadow cursor-pointer`}
      dir={isRTL ? 'rtl' : 'ltr'}
      style={{ textAlign: isRTL ? 'right' : 'left' }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          {/* Title + domain badges */}
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              {locale === 'fa' ? gap.title_fa || gap.title_en : gap.title_en}
            </span>
            {gap.relevant_domains.slice(0, 3).map(d => {
              const domain = CV_DOMAINS[d as CVDomainId];
              return domain ? (
                <span key={d} className="text-xs" title={locale === 'fa' ? domain.label_fa : domain.label_en}>
                  {domain.icon}
                </span>
              ) : null;
            })}
          </div>

          {/* Description */}
          <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
            {locale === 'fa' ? gap.description_fa || gap.description_en : gap.description_en}
          </p>
        </div>

        {/* Arrow */}
        <span className="text-gray-400 flex-shrink-0 mt-1">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d={isRTL ? 'M15 19l-7-7 7-7' : 'M9 5l7 7-7 7'}
            />
          </svg>
        </span>
      </div>
    </button>
  );
}
