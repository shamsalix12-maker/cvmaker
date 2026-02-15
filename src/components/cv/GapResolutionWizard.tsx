// ============================================
// src/components/cv/GapResolutionWizard.tsx
// Step-by-step Gap Resolution Wizard
// ============================================

'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import {
  CVGapItem,
  GapSeverity,
  CVDomainId,
} from '@/lib/types/cv-domain.types';
import { CV_DOMAINS } from '@/lib/cv/cv-domains';

// ─── Props ───

interface GapResolutionWizardProps {
  gaps: CVGapItem[];
  locale: 'en' | 'fa';
  onResolve: (gapId: string, userInput: string) => void;
  onSkip: (gapId: string) => void;
  onComplete: () => void;
  onBack: () => void;
  isLoading?: boolean;
}

// ─── Severity styles ───

const SEVERITY_STYLES: Record<GapSeverity, {
  borderColor: string;
  badgeClass: string;
  icon: string;
}> = {
  critical: {
    borderColor: 'border-red-500',
    badgeClass: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300',
    icon: '🚨',
  },
  important: {
    borderColor: 'border-orange-500',
    badgeClass: 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300',
    icon: '⚠️',
  },
  recommended: {
    borderColor: 'border-yellow-500',
    badgeClass: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300',
    icon: '💡',
  },
  optional: {
    borderColor: 'border-blue-500',
    badgeClass: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300',
    icon: '✨',
  },
};

const SEVERITY_ORDER: GapSeverity[] = ['critical', 'important', 'recommended', 'optional'];

// ─── Component ───

export function GapResolutionWizard({
  gaps,
  locale,
  onResolve,
  onSkip,
  onComplete,
  onBack,
  isLoading = false,
}: GapResolutionWizardProps) {
  const isRTL = locale === 'fa';

  const activeGaps = useMemo(() => {
    return gaps
      .filter(g => !g.is_resolved && !g.is_skipped)
      .sort((a, b) => SEVERITY_ORDER.indexOf(a.severity) - SEVERITY_ORDER.indexOf(b.severity));
  }, [gaps]);

  const [inputValue, setInputValue] = useState(() => {
    const gap = activeGaps[0];
    return gap?.suggested_value || '';
  });
  const [showGuidance, setShowGuidance] = useState(true);
  const [confirmSkip, setConfirmSkip] = useState(false);
  const [prevGapId, setPrevGapId] = useState<string | null>(null);

  const currentGap = activeGaps[0] || null;
  const totalGaps = gaps.length;
  const resolvedCount = gaps.filter(g => g.is_resolved).length;
  const skippedCount = gaps.filter(g => g.is_skipped).length;
  const progressPercent = totalGaps > 0
    ? Math.round(((resolvedCount + skippedCount) / totalGaps) * 100)
    : 100;

  // Reset input when gap changes (useEffect to avoid render-during-render)
  useEffect(() => {
    if (currentGap?.id !== prevGapId) {
      setPrevGapId(currentGap?.id || null);
      setInputValue(currentGap?.suggested_value || '');
      setConfirmSkip(false);
      setShowGuidance(true);
    }
  }, [currentGap?.id, prevGapId]);

  // ─── Actions ───

  const handleResolve = useCallback(() => {
    if (!currentGap) return;

    const value = currentGap.input_type === 'confirm'
      ? (currentGap.suggested_value || 'confirmed')
      : inputValue.trim();

    if (!value) return;

    onResolve(currentGap.id, value);
    setInputValue('');
  }, [currentGap, inputValue, onResolve]);

  const handleSkip = useCallback(() => {
    if (!currentGap) return;

    if (currentGap.severity === 'critical' && !confirmSkip) {
      setConfirmSkip(true);
      return;
    }

    onSkip(currentGap.id);
    setConfirmSkip(false);
    setInputValue('');
  }, [currentGap, onSkip, confirmSkip]);

  const handleAcceptSuggestion = useCallback(() => {
    if (currentGap?.suggested_value) {
      setInputValue(currentGap.suggested_value);
    }
  }, [currentGap]);

  // ─── All done state ───

  if (!currentGap) {
    return (
      <div className={`text-center py-16 ${isRTL ? 'rtl' : 'ltr'}`}>
        <span className="text-6xl block">🎉</span>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mt-4">
          {locale === 'fa' ? 'تمام نواقص بررسی شدند!' : 'All gaps reviewed!'}
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mt-2 max-w-md mx-auto">
          {locale === 'fa'
            ? `${resolvedCount} مورد رفع شد، ${skippedCount} مورد رد شد. اکنون می‌توانید رزومه جامع خود را مشاهده و ذخیره کنید.`
            : `${resolvedCount} resolved, ${skippedCount} skipped. You can now view and save your comprehensive CV.`}
        </p>
        <button
          onClick={onComplete}
          disabled={isLoading}
          className="mt-6 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center gap-2 mx-auto disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <span className="animate-spin text-xl">⚙️</span>
              {locale === 'fa' ? 'در حال رفاین...' : 'Refining...'}
            </>
          ) : (
            <>
              {locale === 'fa' ? '✅ مشاهده رزومه نهایی' : '✅ View Final CV'}
            </>
          )}
        </button>
      </div>
    );
  }

  // ─── Current gap rendering ───

  const style = SEVERITY_STYLES[currentGap.severity];
  const severityLabel = locale === 'fa'
    ? { critical: 'بحرانی', important: 'مهم', recommended: 'پیشنهادی', optional: 'اختیاری' }[currentGap.severity]
    : currentGap.severity.charAt(0).toUpperCase() + currentGap.severity.slice(1);

  const canSubmit =
    currentGap.input_type === 'confirm' ||
    inputValue.trim().length > 0;

  return (
    <div className={`max-w-2xl mx-auto ${isRTL ? 'rtl text-right' : 'ltr text-left'}`}>

      {/* ═══ Progress bar ═══ */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <button
            onClick={onBack}
            className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white flex items-center gap-1 transition-colors"
          >
            <span>{isRTL ? '→' : '←'}</span>
            {locale === 'fa' ? 'بازگشت به نمای کلی' : 'Back to Overview'}
          </button>
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {locale === 'fa'
              ? `${resolvedCount} از ${totalGaps} رفع شده`
              : `${resolvedCount} of ${totalGaps} resolved`}
          </span>
        </div>
        <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 rounded-full transition-all duration-700 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* ═══ Gap Card ═══ */}
      <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-lg border-2 ${style.borderColor} overflow-hidden`}>

        {/* ─── Header ─── */}
        <div className="p-4 bg-gray-50 dark:bg-gray-800/80 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              {/* Badges */}
              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${style.badgeClass}`}>
                  {style.icon} {severityLabel}
                </span>
                {currentGap.relevant_domains.map(d => {
                  const domain = CV_DOMAINS[d as CVDomainId];
                  return domain ? (
                    <span key={d} className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded-full text-xs text-gray-600 dark:text-gray-400">
                      {domain.icon}
                      <span className="hidden sm:inline">
                        {locale === 'fa' ? domain.label_fa : domain.label_en}
                      </span>
                    </span>
                  ) : null;
                })}
              </div>

              {/* Title */}
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {locale === 'fa' ? currentGap.title_fa || currentGap.title_en : currentGap.title_en}
              </h3>

              {/* Description */}
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {locale === 'fa' ? currentGap.description_fa || currentGap.description_en : currentGap.description_en}
              </p>
            </div>

            {/* Counter */}
            <span className="text-xs text-gray-400 whitespace-nowrap flex-shrink-0 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
              1/{activeGaps.length}
            </span>
          </div>
        </div>

        {/* ─── Current value (if exists) ─── */}
        {currentGap.current_value && (
          <div className="px-4 py-3 bg-gray-50/50 dark:bg-gray-800/30 border-b border-gray-200 dark:border-gray-700">
            <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
              📄 {locale === 'fa' ? 'مقدار فعلی:' : 'Current value:'}
            </div>
            <div className="text-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700/50 p-2.5 rounded border border-gray-200 dark:border-gray-600">
              {currentGap.current_value}
            </div>
          </div>
        )}

        {/* ─── Guidance (collapsible) ─── */}
        <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setShowGuidance(!showGuidance)}
            className="flex items-center gap-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 transition-colors w-full"
            style={{ textAlign: isRTL ? 'right' : 'left' }}
          >
            <span className="transition-transform" style={{ transform: showGuidance ? 'rotate(90deg)' : 'rotate(0deg)' }}>
              ▶
            </span>
            <span>📖 {locale === 'fa' ? 'راهنمای تکمیل' : 'How to fill this'}</span>
          </button>

          {showGuidance && (
            <div className="mt-3 space-y-3">
              {/* Guidance */}
              <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                <div className="text-xs font-medium text-blue-700 dark:text-blue-400 mb-1">
                  🔧 {locale === 'fa' ? 'چگونه رفع کنید:' : 'How to fix:'}
                </div>
                <p className="text-sm text-blue-800 dark:text-blue-300 leading-relaxed">
                  {locale === 'fa'
                    ? currentGap.fix_guidance_fa || currentGap.fix_guidance_en
                    : currentGap.fix_guidance_en}
                </p>
              </div>

              {/* Example */}
              {(currentGap.fix_example_en || currentGap.fix_example_fa) && (
                <div className="bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800 rounded-lg p-3">
                  <div className="text-xs font-medium text-green-700 dark:text-green-400 mb-1">
                    📝 {locale === 'fa' ? 'مثال:' : 'Example:'}
                  </div>
                  <p className="text-sm text-green-800 dark:text-green-300 italic leading-relaxed">
                    &ldquo;{locale === 'fa'
                      ? currentGap.fix_example_fa || currentGap.fix_example_en
                      : currentGap.fix_example_en}&rdquo;
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ─── Input area ─── */}
        <div className="p-4 space-y-3">

          {/* AI Suggestion (clickable to accept) */}
          {currentGap.suggested_value && inputValue !== currentGap.suggested_value && currentGap.input_type !== 'confirm' && (
            <button
              onClick={handleAcceptSuggestion}
              className="w-full p-3 bg-purple-50 dark:bg-purple-900/10 border border-purple-200 dark:border-purple-800 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/20 transition-colors"
              dir={isRTL ? 'rtl' : 'ltr'}
              style={{ textAlign: isRTL ? 'right' : 'left' }}
            >
              <div className="text-xs font-medium text-purple-700 dark:text-purple-400 mb-1">
                🤖 {locale === 'fa' ? 'پیشنهاد AI (برای استفاده کلیک کنید):' : 'AI Suggestion (click to use):'}
              </div>
              <p className="text-sm text-purple-800 dark:text-purple-300">
                {currentGap.suggested_value}
              </p>
            </button>
          )}

          {/* Input fields based on type */}
          {currentGap.input_type === 'confirm' ? (
            <div className="p-4 bg-purple-50 dark:bg-purple-900/10 border border-purple-200 dark:border-purple-800 rounded-lg">
              <div className="text-xs font-medium text-purple-700 dark:text-purple-400 mb-2">
                🤖 {locale === 'fa' ? 'پیشنهاد AI:' : 'AI Suggestion:'}
              </div>
              <p className="text-sm text-purple-800 dark:text-purple-300 leading-relaxed">
                {currentGap.suggested_value}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                {locale === 'fa'
                  ? 'آیا با اعمال این پیشنهاد موافقید؟'
                  : 'Do you want to apply this suggestion?'}
              </p>
            </div>
          ) : currentGap.input_type === 'list' ? (
            <div>
              <textarea
                value={inputValue}
                onChange={e => setInputValue(e.target.value)}
                placeholder={locale === 'fa'
                  ? 'هر آیتم را در یک خط جدید بنویسید...'
                  : 'Write each item on a new line...'}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-y transition-colors"
                rows={5}
                dir={isRTL ? 'rtl' : 'ltr'}
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {locale === 'fa' ? '↵ هر آیتم در یک خط جداگانه' : '↵ One item per line'}
              </p>
            </div>
          ) : (
            <textarea
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              placeholder={locale === 'fa'
                ? 'اطلاعات را اینجا وارد کنید...'
                : 'Enter information here...'}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-y transition-colors"
              rows={currentGap.input_type === 'text' ? 2 : 4}
              dir={isRTL ? 'rtl' : 'ltr'}
            />
          )}
        </div>

        {/* ─── Actions ─── */}
        <div className="p-4 bg-gray-50 dark:bg-gray-800/80 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between gap-3">

          {/* Skip */}
          <div className="flex items-center gap-2">
            {confirmSkip ? (
              <>
                <span className="text-xs text-red-600 dark:text-red-400">
                  {locale === 'fa'
                    ? '⚠️ این مورد بحرانی است. مطمئنید؟'
                    : '⚠️ This is critical. Are you sure?'}
                </span>
                <button
                  onClick={handleSkip}
                  className="px-3 py-1.5 text-xs text-red-600 dark:text-red-400 border border-red-300 dark:border-red-600 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                >
                  {locale === 'fa' ? 'بله، رد کن' : 'Yes, skip'}
                </button>
                <button
                  onClick={() => setConfirmSkip(false)}
                  className="px-3 py-1.5 text-xs text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  {locale === 'fa' ? 'نه' : 'No'}
                </button>
              </>
            ) : (
              <button
                onClick={handleSkip}
                className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                ⏭ {locale === 'fa' ? 'رد کردن' : 'Skip'}
              </button>
            )}
          </div>

          {/* Submit */}
          <button
            onClick={handleResolve}
            disabled={!canSubmit}
            className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 active:bg-blue-800 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-sm"
          >
            {currentGap.input_type === 'confirm'
              ? (locale === 'fa' ? '✓ تأیید و اعمال' : '✓ Confirm & Apply')
              : (locale === 'fa' ? '✓ ذخیره و بعدی' : '✓ Save & Next')}
          </button>
        </div>
      </div>

      {/* ═══ Remaining gaps preview ═══ */}
      {activeGaps.length > 1 && (
        <div className="mt-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">
            {locale === 'fa'
              ? `${activeGaps.length - 1} مورد باقی‌مانده:`
              : `${activeGaps.length - 1} remaining:`}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {activeGaps.slice(1, 6).map(gap => {
              const chipColor: Record<GapSeverity, string> = {
                critical: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
                important: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400',
                recommended: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400',
                optional: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
              };
              return (
                <span
                  key={gap.id}
                  className={`px-2 py-0.5 rounded text-xs ${chipColor[gap.severity]}`}
                >
                  {locale === 'fa' ? gap.title_fa || gap.title_en : gap.title_en}
                </span>
              );
            })}
            {activeGaps.length > 6 && (
              <span className="px-2 py-0.5 rounded text-xs bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
                +{activeGaps.length - 6}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
