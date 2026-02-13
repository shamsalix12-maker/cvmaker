// ============================================
// src/components/cv/DomainSelector.tsx
// Career Domain Selection Component
// ============================================

'use client';

import { useState, useMemo } from 'react';
import { CVDomainId, CVDomain } from '@/lib/types/cv-domain.types';
import { CV_DOMAINS, getDomainGroups } from '@/lib/cv/cv-domains';

// ─── Props ───

interface DomainSelectorProps {
  /** حوزه‌های انتخاب‌شده فعلی */
  selectedDomains: CVDomainId[];
  /** تغییر حوزه‌ها */
  onDomainsChange: (domains: CVDomainId[]) => void;
  /** زبان رابط */
  locale: 'en' | 'fa';
  /** حداکثر تعداد انتخاب */
  maxSelections?: number;
  /** غیرفعال کردن کامپوننت */
  disabled?: boolean;
}

// ─── Component ───

export function DomainSelector({
  selectedDomains,
  onDomainsChange,
  locale,
  maxSelections = 5,
  disabled = false,
}: DomainSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const isRTL = locale === 'fa';

  // گروه‌بندی حوزه‌ها
  const groups = useMemo(() => getDomainGroups(), []);

  // فیلتر بر اساس جستجو
  const filteredGroups = useMemo(() => {
    if (!searchQuery.trim()) return groups;

    const q = searchQuery.toLowerCase();
    return groups
      .map(group => ({
        ...group,
        domains: group.domains.filter(d =>
          d.label_en.toLowerCase().includes(q) ||
          d.label_fa.includes(searchQuery) ||
          d.description_en.toLowerCase().includes(q) ||
          d.description_fa.includes(searchQuery) ||
          d.detection_keywords.some(k => k.toLowerCase().includes(q))
        ),
      }))
      .filter(g => g.domains.length > 0);
  }, [groups, searchQuery]);

  // تعویض انتخاب حوزه
  const toggleDomain = (domainId: CVDomainId) => {
    if (disabled) return;

    if (selectedDomains.includes(domainId)) {
      onDomainsChange(selectedDomains.filter(d => d !== domainId));
    } else if (selectedDomains.length < maxSelections) {
      onDomainsChange([...selectedDomains, domainId]);
    }
  };

  const isSelected = (domainId: CVDomainId) => selectedDomains.includes(domainId);
  const isAtLimit = selectedDomains.length >= maxSelections;

  return (
    <div className={`space-y-6 ${isRTL ? 'rtl text-right' : 'ltr text-left'}`}>

      {/* ─── Header ─── */}
      <div className="space-y-2">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          {locale === 'fa'
            ? '🎯 حوزه‌(های) شغلی خود را انتخاب کنید'
            : '🎯 Select Your Career Domain(s)'}
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {locale === 'fa'
            ? `حوزه‌هایی که می‌خواهید رزومه‌تان برای آنها بررسی شود را انتخاب کنید (حداکثر ${maxSelections} حوزه). رزومه جامع شما می‌تواند شامل اطلاعات چند حوزه باشد.`
            : `Select the career domains your CV should be analyzed for (max ${maxSelections}). Your comprehensive CV can cover multiple domains.`}
        </p>

        {/* Tip */}
        <div className="flex items-start gap-2 text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
          <span className="flex-shrink-0 mt-0.5">💡</span>
          <span>
            {locale === 'fa'
              ? 'اگر برای چند حوزه مختلف فعالیت دارید، همه آنها را انتخاب کنید. نواقص هر حوزه جداگانه بررسی می‌شود و رزومه جامع شما تمام حوزه‌ها را پوشش خواهد داد.'
              : 'If you work across multiple domains, select all of them. Gaps will be analyzed per domain, and your comprehensive CV will cover all selected areas.'}
          </span>
        </div>
      </div>

      {/* ─── Search ─── */}
      <div className="relative">
        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder={locale === 'fa' ? '🔍 جستجوی حوزه شغلی...' : '🔍 Search domains...'}
          className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
          dir={isRTL ? 'rtl' : 'ltr'}
          disabled={disabled}
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            style={{ [isRTL ? 'left' : 'right']: '12px' }}
          >
            ✕
          </button>
        )}
      </div>

      {/* ─── Selected chips ─── */}
      {selectedDomains.length > 0 && (
        <div className="flex flex-wrap gap-2 items-center">
          {selectedDomains.map(domainId => {
            const domain = CV_DOMAINS[domainId];
            if (!domain) return null;
            return (
              <button
                key={domainId}
                onClick={() => toggleDomain(domainId)}
                disabled={disabled}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-full text-sm hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors disabled:opacity-50"
              >
                <span>{domain.icon}</span>
                <span>{locale === 'fa' ? domain.label_fa : domain.label_en}</span>
                <span className="text-blue-500 hover:text-blue-700 ms-0.5">✕</span>
              </button>
            );
          })}

          <span className="text-xs text-gray-500 dark:text-gray-400">
            {selectedDomains.length}/{maxSelections}
          </span>
        </div>
      )}

      {/* ─── Domain groups ─── */}
      <div className="space-y-5">
        {filteredGroups.map(group => (
          <div key={group.group_en}>
            {/* Group header */}
            <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
              {locale === 'fa' ? group.group_fa : group.group_en}
            </h3>

            {/* Domain cards grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {group.domains.map(domain => (
                <DomainCard
                  key={domain.id}
                  domain={domain}
                  locale={locale}
                  isSelected={isSelected(domain.id)}
                  isDisabled={disabled || (!isSelected(domain.id) && isAtLimit)}
                  onToggle={() => toggleDomain(domain.id)}
                />
              ))}
            </div>
          </div>
        ))}

        {/* No results */}
        {filteredGroups.length === 0 && (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <span className="text-3xl block mb-2">🔍</span>
            <p className="text-sm">
              {locale === 'fa'
                ? `نتیجه‌ای برای "${searchQuery}" یافت نشد`
                : `No results for "${searchQuery}"`}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Sub-component: Domain Card ───

function DomainCard({
  domain,
  locale,
  isSelected,
  isDisabled,
  onToggle,
}: {
  domain: CVDomain;
  locale: 'en' | 'fa';
  isSelected: boolean;
  isDisabled: boolean;
  onToggle: () => void;
}) {
  const isRTL = locale === 'fa';

  return (
    <button
      onClick={onToggle}
      disabled={isDisabled}
      className={`
        flex items-start gap-3 p-3 rounded-lg border-2 transition-all w-full
        ${isRTL ? 'text-right' : 'text-left'}
        ${isSelected
          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-sm'
          : isDisabled
            ? 'border-gray-200 dark:border-gray-700 opacity-50 cursor-not-allowed bg-gray-50 dark:bg-gray-800/50'
            : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer'
        }
      `}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* Icon */}
      <span className="text-2xl flex-shrink-0 mt-0.5">{domain.icon}</span>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <div className="font-medium text-sm text-gray-900 dark:text-white leading-tight">
          {locale === 'fa' ? domain.label_fa : domain.label_en}
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2 leading-relaxed">
          {locale === 'fa' ? domain.description_fa : domain.description_en}
        </div>
        {/* Section count badge */}
        {domain.specific_sections.length > 0 && (
          <div className="mt-1">
            <span className="inline-flex items-center text-[10px] px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 rounded">
              {locale === 'fa'
                ? `${domain.specific_sections.length} بخش اختصاصی`
                : `${domain.specific_sections.length} specific sections`}
            </span>
          </div>
        )}
      </div>

      {/* Checkmark */}
      {isSelected && (
        <span className="text-blue-500 flex-shrink-0 mt-1">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
        </span>
      )}
    </button>
  );
}
