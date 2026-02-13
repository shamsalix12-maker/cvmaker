// ============================================
// src/components/cv/ClassificationReview.tsx
// Review AI Classifications Before Proceeding
// ============================================

'use client';

import { ClassificationItem } from '@/lib/types/cv-domain.types';

interface ClassificationReviewProps {
  classifications: ClassificationItem[];
  locale: 'en' | 'fa';
  onConfirm: (index: number) => void;
  onReject: (index: number) => void;
  onConfirmAll: () => void;
  onContinue: () => void;
}

export function ClassificationReview({
  classifications,
  locale,
  onConfirm,
  onReject,
  onConfirmAll,
  onContinue,
}: ClassificationReviewProps) {
  const isRTL = locale === 'fa';

  const pendingClassifications = classifications.filter(c => !c.is_confirmed && !c.is_rejected);
  const confirmedCount = classifications.filter(c => c.is_confirmed).length;
  const rejectedCount = classifications.filter(c => c.is_rejected).length;

  if (classifications.length === 0) {
    return (
      <div className={`text-center py-12 ${isRTL ? 'rtl' : 'ltr'}`}>
        <span className="text-5xl block">✓</span>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mt-4">
          {locale === 'fa' ? 'بدون طبقه‌بندی جدید' : 'No New Classifications'}
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mt-2 max-w-md mx-auto">
          {locale === 'fa'
            ? 'AI تمام داده‌ها را در قالب‌های استاندارد شناسایی کرد.'
            : 'AI identified all data in standard formats.'}
        </p>
        <button
          onClick={onContinue}
          className="mt-6 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          {locale === 'fa' ? 'ادامه →' : 'Continue →'}
        </button>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${isRTL ? 'rtl text-right' : 'ltr text-left'}`}>
      {/* Header */}
      <div className="text-center">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          {locale === 'fa' ? '🔍 تأیید طبقه‌بندی‌های هوشمند' : '🔍 Confirm AI Classifications'}
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 max-w-lg mx-auto">
          {locale === 'fa'
            ? 'AI داده‌هایی را در قالب‌های غیرمعمول شناسایی کرد. لطفاً طبقه‌بندی‌ها را بررسی و تأیید/رد کنید.'
            : 'AI found data in unconventional formats. Please review and confirm/reject each classification.'}
        </p>
      </div>

      {/* Stats */}
      <div className="flex justify-center gap-4">
        <div className="px-4 py-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <span className="text-lg font-bold text-blue-600 dark:text-blue-400">{pendingClassifications.length}</span>
          <span className="text-sm text-gray-600 dark:text-gray-400 ms-2">
            {locale === 'fa' ? 'در انتظار' : 'Pending'}
          </span>
        </div>
        <div className="px-4 py-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
          <span className="text-lg font-bold text-green-600 dark:text-green-400">{confirmedCount}</span>
          <span className="text-sm text-gray-600 dark:text-gray-400 ms-2">
            {locale === 'fa' ? 'تأیید شده' : 'Confirmed'}
          </span>
        </div>
        <div className="px-4 py-2 bg-red-50 dark:bg-red-900/20 rounded-lg">
          <span className="text-lg font-bold text-red-600 dark:text-red-400">{rejectedCount}</span>
          <span className="text-sm text-gray-600 dark:text-gray-400 ms-2">
            {locale === 'fa' ? 'رد شده' : 'Rejected'}
          </span>
        </div>
      </div>

      {/* Classification Cards */}
      <div className="space-y-4 max-w-3xl mx-auto">
        {classifications.map((item, idx) => (
          <ClassificationCard
            key={idx}
            classification={item}
            index={idx}
            locale={locale}
            onConfirm={() => onConfirm(idx)}
            onReject={() => onReject(idx)}
          />
        ))}
      </div>

      {/* Actions */}
      <div className="flex justify-center gap-4 pt-4">
        {pendingClassifications.length > 0 && (
          <button
            onClick={onConfirmAll}
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
          >
            ✓ {locale === 'fa' ? 'تأیید همه' : 'Confirm All'}
          </button>
        )}
        <button
          onClick={onContinue}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          {locale === 'fa' ? 'ادامه →' : 'Continue →'}
        </button>
      </div>
    </div>
  );
}

// ─── Sub-components ───

function ClassificationCard({
  classification,
  locale,
  onConfirm,
  onReject,
}: {
  classification: ClassificationItem;
  index: number;
  locale: 'en' | 'fa';
  onConfirm: () => void;
  onReject: () => void;
}) {
  const isRTL = locale === 'fa';

  const confidenceColor = {
    high: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
    medium: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400',
    low: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
  }[classification.confidence];

  const confidenceLabel = {
    high: locale === 'fa' ? 'اطمینان بالا' : 'High Confidence',
    medium: locale === 'fa' ? 'اطمینان متوسط' : 'Medium Confidence',
    low: locale === 'fa' ? 'اطمینان پایین' : 'Low Confidence',
  }[classification.confidence];

  if (classification.is_confirmed) {
    return (
      <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
        <div className="flex items-center gap-2">
          <span className="text-green-500">✓</span>
          <span className="text-sm text-green-700 dark:text-green-400">
            {locale === 'fa' ? 'تأیید شده:' : 'Confirmed:'} {classification.field_path}
          </span>
        </div>
      </div>
    );
  }

  if (classification.is_rejected) {
    return (
      <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
        <div className="flex items-center gap-2">
          <span className="text-red-500">✗</span>
          <span className="text-sm text-red-700 dark:text-red-400">
            {locale === 'fa' ? 'رد شده:' : 'Rejected:'} {classification.field_path}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
      {/* Field Path & Confidence */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-900 dark:text-white">
            {locale === 'fa' ? 'فیلد:' : 'Field:'}
          </span>
          <code className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-sm">
            {classification.field_path}
          </code>
        </div>
        <span className={`px-2 py-0.5 rounded text-xs ${confidenceColor}`}>
          {confidenceLabel}
        </span>
      </div>

      {/* Original Text */}
      <div className="mb-3">
        <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
          {locale === 'fa' ? 'متن اصلی شناسایی شده:' : 'Original text found:'}
        </div>
        <div className="p-3 bg-gray-50 dark:bg-gray-900/50 rounded border border-gray-200 dark:border-gray-600 text-sm">
          &ldquo;{classification.original_text}&rdquo;
        </div>
      </div>

      {/* Extracted Value */}
      <div className="mb-4">
        <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
          {locale === 'fa' ? 'مقدار استخراج شده:' : 'Extracted value:'}
        </div>
        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-800 text-sm">
          {classification.extracted_value}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={onConfirm}
          className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
        >
          ✓ {locale === 'fa' ? 'تأیید طبقه‌بندی' : 'Confirm Classification'}
        </button>
        <button
          onClick={onReject}
          className="px-4 py-2 text-red-600 dark:text-red-400 border border-red-300 dark:border-red-600 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-sm"
        >
          ✗ {locale === 'fa' ? 'رد' : 'Reject'}
        </button>
      </div>
    </div>
  );
}
