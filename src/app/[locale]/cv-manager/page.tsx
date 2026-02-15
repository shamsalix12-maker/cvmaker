'use client';

import { useParams } from 'next/navigation';
import { CVCompletionFlow } from '@/components/cv/CVCompletionFlow';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { MainLayout } from '@/components/layout/MainLayout';
import { toast } from 'sonner';
import { ComprehensiveCV } from '@/lib/types';
import { useCV } from '@/hooks/useCV';
import { CVManagerVersion } from '@/lib/cv/managers/manager-factory';

export default function CVManagerPage() {
  const params = useParams();
  const locale = params.locale as 'en' | 'fa';
  const { cv, refineCV, deleteCV } = useCV();

  const handleComplete = async (cv: Partial<ComprehensiveCV>) => {
    try {
      const response = await fetch('/api/cv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cv),
      });

      const result = await response.json();

      if (result.success) {
        toast.success(
          locale === 'fa' ? 'رزومه ذخیره شد!' : 'CV Saved!',
          { description: locale === 'fa' ? 'رزومه جامع شما با موفقیت ذخیره شد.' : 'Your comprehensive CV has been saved successfully.' }
        );
      } else {
        throw new Error(result.error || 'Failed to save');
      }
    } catch (err: unknown) {
      toast.error(
        locale === 'fa' ? 'خطا در ذخیره' : 'Save Error',
        { description: err instanceof Error ? err.message : 'Unknown error' }
      );
    }
  };

  const aiProvider = 'google';
  const aiModel = 'gemini-2.0-flash';

  return (
    <AuthGuard>
      <MainLayout>
        <CVCompletionFlow
          locale={locale}
          aiProvider={aiProvider}
          aiModel={aiModel}
          initialManagerVersion={CVManagerVersion.V2}
          refineCV={refineCV}
          onComplete={handleComplete}
          onDeleteCV={deleteCV}
          existingCV={cv || undefined}
        />
      </MainLayout>
    </AuthGuard>
  );
}
