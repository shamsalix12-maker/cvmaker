// ============================================
// src/components/cv/ImprovementReview.tsx
// Review AI Improvements and Translations
// ============================================

'use client';

import { useState } from 'react';
import { SuggestedImprovement, TranslationApplied } from '@/lib/types/cv-domain.types';

interface ImprovementReviewProps {
  improvements: SuggestedImprovement[];
  translations: TranslationApplied[];
  locale: 'en' | 'fa';
  cvLanguage: string;
  onApproveImprovement: (index: number) => void;
  onRejectImprovement: (index: number) => void;
  onEditImprovement: (index: number, newText: string) => void;
  onApproveTranslation: (index: number) => void;
  onRejectTranslation: (index: number) => void;
  onApplyAll: () => void;
  onSkip: () => void;
}

export function ImprovementReview({
  improvements,
  translations,
  locale,
  cvLanguage,
  onApproveImprovement,
  onRejectImprovement,
  onEditImprovement,
  onApproveTranslation,
  onRejectTranslation,
  onApplyAll,
  onSkip,
}: ImprovementReviewProps) {
  const isRTL = locale === 'fa';

  const pendingImprovements = improvements.filter(imp => !imp.is_approved && !imp.is_rejected);
  const pendingTranslations = translations.filter(t => !t.is_approved && !t.is_rejected);
  const totalPending = pendingImprovements.length + pendingTranslations.length;

  if (totalPending === 0) {
    return (
      <div className={`text-center py-12 ${isRTL ? 'rtl' : 'ltr'}`}>
        <span className="text-5xl block">✓</span>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mt-4">
          {locale === 'fa' ? 'بدون تغییرات پیشنهادی' : 'No Suggested Changes'}
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mt-2 max-w-md mx-auto">
          {locale === 'fa'
            ? 'AI هیچ بهبود یا ترجمه‌ای پیشنهاد نداد.'
            : 'AI did not suggest any improvements or translations.'}
        </p>
        <button
          onClick={onSkip}
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
          {locale === 'fa' ? '📝 بازبینی تغییرات پیشنهادی' : '📝 Review Suggested Changes'}
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 max-w-lg mx-auto">
          {locale === 'fa'
            ? 'AI پیشنهادهایی برای بهبود یا ترجمه دارد. هر مورد را بررسی و تأیید/رد کنید.'
            : 'AI has suggestions for improvements or translations. Review and approve/reject each one.'}
        </p>
      </div>

      {/* Stats */}
      <div className="flex justify-center gap-4">
        {improvements.length > 0 && (
          <div className="px-4 py-2 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
            <span className="text-lg font-bold text-yellow-600 dark:text-yellow-400">{pendingImprovements.length}</span>
            <span className="text-sm text-gray-600 dark:text-gray-400 ms-2">
              {locale === 'fa' ? 'بهبود پیشنهادی' : 'Improvements'}
            </span>
          </div>
        )}
        {translations.length > 0 && (
          <div className="px-4 py-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <span className="text-lg font-bold text-blue-600 dark:text-blue-400">{pendingTranslations.length}</span>
            <span className="text-sm text-gray-600 dark:text-gray-400 ms-2">
              {locale === 'fa' ? 'ترجمه' : 'Translations'}
            </span>
          </div>
        )}
      </div>

      {/* Translations Section */}
      {translations.length > 0 && (
        <div className="space-y-4 max-w-3xl mx-auto">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white flex items-center gap-2">
            🌐 {locale === 'fa' ? 'ترجمه‌ها' : 'Translations'}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {locale === 'fa'
              ? `ورودی‌های شما به زبان ${cvLanguage === 'fa' ? 'فارسی' : 'English'} ترجمه شدند`
              : `Your inputs were translated to ${cvLanguage}`}
          </p>
          {translations.map((t, idx) => (
            <TranslationCard
              key={t.id}
              translation={t}
              index={idx}
              locale={locale}
              onApprove={() => onApproveTranslation(idx)}
              onReject={() => onRejectTranslation(idx)}
            />
          ))}
        </div>
      )}

      {/* Improvements Section */}
      {improvements.length > 0 && (
        <div className="space-y-4 max-w-3xl mx-auto">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white flex items-center gap-2">
            💡 {locale === 'fa' ? 'پیشنهادهای بهبود' : 'Improvement Suggestions'}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {locale === 'fa'
              ? 'این پیشنهادات اختیاری هستند. می‌توانید هر کدام را تأیید، رد یا ویرایش کنید.'
              : 'These suggestions are optional. You can approve, reject, or edit each one.'}
          </p>
          {improvements.map((imp, idx) => (
            <ImprovementCard
              key={imp.id}
              improvement={imp}
              index={idx}
              locale={locale}
              onApprove={() => onApproveImprovement(idx)}
              onReject={() => onRejectImprovement(idx)}
              onEdit={(newText) => onEditImprovement(idx, newText)}
            />
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-center gap-4 pt-4">
        <button
          onClick={onApplyAll}
          className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
        >
          ✓ {locale === 'fa' ? 'اعمال موارد تأیید شده' : 'Apply Approved Changes'}
        </button>
        <button
          onClick={onSkip}
          className="px-6 py-3 text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors font-medium"
        >
          {locale === 'fa' ? 'رد همه و ادامه →' : 'Skip All & Continue →'}
        </button>
      </div>
    </div>
  );
}

// ─── Sub-components ───

function TranslationCard({
  translation,
  locale,
  onApprove,
  onReject,
}: {
  translation: TranslationApplied;
  index: number;
  locale: 'en' | 'fa';
  onApprove: () => void;
  onReject: () => void;
}) {
  const isRTL = locale === 'fa';

  if (translation.is_approved) {
    return (
      <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
        <div className="flex items-center gap-2">
          <span className="text-green-500">✓</span>
          <span className="text-sm text-green-700 dark:text-green-400">
            {locale === 'fa' ? 'ترجمه تأیید شد' : 'Translation approved'}
          </span>
        </div>
      </div>
    );
  }

  if (translation.is_rejected) {
    return (
      <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
        <div className="flex items-center gap-2">
          <span className="text-red-500">✗</span>
          <span className="text-sm text-red-700 dark:text-red-400">
            {locale === 'fa' ? 'از متن اصلی استفاده شد' : 'Using original text'}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
      <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">{translation.field_path}</div>
      
      <div className="mb-3">
        <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
          {locale === 'fa' ? 'ورودی اصلی شما:' : 'Your original input:'}
        </div>
        <div className="p-3 bg-white dark:bg-gray-800 rounded text-sm italic">
          &ldquo;{translation.original_input}&rdquo;
        </div>
      </div>

      <div className="mb-4">
        <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
          {locale === 'fa' ? `ترجمه به ${translation.target_language === 'fa' ? 'فارسی' : 'English'}:` : `Translated to ${translation.target_language}:`}
        </div>
        <div className="p-3 bg-white dark:bg-gray-800 rounded text-sm border-2 border-blue-200 dark:border-blue-700">
          &ldquo;{translation.translated_text}&rdquo;
        </div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={onApprove}
          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
        >
          ✓ {locale === 'fa' ? 'تأیید ترجمه' : 'Approve Translation'}
        </button>
        <button
          onClick={onReject}
          className="px-4 py-2 text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-sm"
        >
          {locale === 'fa' ? 'استفاده از اصلی' : 'Use Original'}
        </button>
      </div>
    </div>
  );
}

function ImprovementCard({
  improvement,
  index,
  locale,
  onApprove,
  onReject,
  onEdit,
}: {
  improvement: SuggestedImprovement;
  index: number;
  locale: 'en' | 'fa';
  onApprove: () => void;
  onReject: () => void;
  onEdit: (newText: string) => void;
}) {
  const isRTL = locale === 'fa';
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(improvement.suggested_text);

  if (improvement.is_approved) {
    return (
      <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
        <div className="flex items-center gap-2">
          <span className="text-green-500">✓</span>
          <span className="text-sm text-green-700 dark:text-green-400">
            {locale === 'fa' ? 'بهبود تأیید شد:' : 'Improvement approved:'} {improvement.field_path}
          </span>
        </div>
      </div>
    );
  }

  if (improvement.is_rejected) {
    return (
      <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
        <div className="flex items-center gap-2">
          <span className="text-red-500">✗</span>
          <span className="text-sm text-red-700 dark:text-red-400">
            {locale === 'fa' ? 'رد شد:' : 'Rejected:'} {improvement.field_path}
          </span>
        </div>
      </div>
    );
  }

  const handleSaveEdit = () => {
    onEdit(editText);
    setIsEditing(false);
  };

  return (
    <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
      <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">{improvement.field_path}</div>
      
      {/* Current Text */}
      <div className="mb-3">
        <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
          {locale === 'fa' ? 'متن فعلی:' : 'Current text:'}
        </div>
        <div className="p-3 bg-white dark:bg-gray-800 rounded text-sm">
          {improvement.current_text || <span className="text-gray-400 italic">(خالی)</span>}
        </div>
      </div>

      {/* Suggested Text */}
      <div className="mb-3">
        <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
          {locale === 'fa' ? 'پیشنهاد بهبود:' : 'Suggested improvement:'}
        </div>
        {isEditing ? (
          <textarea
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            className="w-full p-3 bg-white dark:bg-gray-800 rounded border-2 border-yellow-400 text-sm resize-y"
            rows={4}
            dir={isRTL ? 'rtl' : 'ltr'}
          />
        ) : (
          <div className="p-3 bg-green-50 dark:bg-green-900/30 rounded text-sm border-2 border-green-200 dark:border-green-700">
            {improvement.suggested_text}
          </div>
        )}
      </div>

      {/* Reason */}
      <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-800/50 rounded text-xs text-gray-600 dark:text-gray-400">
        💡 {locale === 'fa' ? improvement.reason_fa || improvement.reason_en : improvement.reason_en}
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        {isEditing ? (
          <>
            <button
              onClick={handleSaveEdit}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
            >
              ✓ {locale === 'fa' ? 'ذخیره' : 'Save'}
            </button>
            <button
              onClick={() => { setEditText(improvement.suggested_text); setIsEditing(false); }}
              className="px-4 py-2 text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-sm"
            >
              {locale === 'fa' ? 'لغو' : 'Cancel'}
            </button>
          </>
        ) : (
          <>
            <button
              onClick={onApprove}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
            >
              ✓ {locale === 'fa' ? 'تأیید' : 'Approve'}
            </button>
            <button
              onClick={onReject}
              className="px-4 py-2 text-red-600 dark:text-red-400 border border-red-300 dark:border-red-600 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-sm"
            >
              ✗ {locale === 'fa' ? 'رد' : 'Reject'}
            </button>
            <button
              onClick={() => setIsEditing(true)}
              className="px-4 py-2 text-blue-600 dark:text-blue-400 border border-blue-300 dark:border-blue-600 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors text-sm"
            >
              ✎ {locale === 'fa' ? 'ویرایش' : 'Edit'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
