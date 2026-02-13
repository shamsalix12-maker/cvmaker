'use client';

import { useParams, useRouter } from 'next/navigation';
import { CVCompletionFlow } from '@/components/cv/CVCompletionFlow';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { MainLayout } from '@/components/layout/MainLayout';
import { toast } from 'sonner';
import { ComprehensiveCV } from '@/lib/types';

export default function CVFlowPage() {
  const params = useParams();
  const router = useRouter();
  const locale = params.locale as 'en' | 'fa';

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
        router.push(`/${locale}/cv-manager`);
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
  const aiModel = 'gemini-2.5-flash';

  return (
    <AuthGuard>
      <MainLayout>
        <CVCompletionFlow
          locale={locale}
          aiProvider={aiProvider}
          aiModel={aiModel}
          onComplete={handleComplete}
        />
      </MainLayout>
    </AuthGuard>
  );
}
