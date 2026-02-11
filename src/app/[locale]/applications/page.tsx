import { Suspense } from 'react';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { MainLayout } from '@/components/layout/MainLayout';
import { ApplicationService } from '@/lib/applications';
import { ApplicationList } from '@/components/application/ApplicationList';
import { Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';

export const dynamic = 'force-dynamic';

export default async function ApplicationsPage() {
    const res = await ApplicationService.listApplications();
    const applications = (res.success && res.data) ? res.data : [];

    return (
        <AuthGuard>
            <MainLayout>
                <div className="space-y-6">
                    <div className="space-y-1">
                        <h2 className="text-3xl font-bold tracking-tight">My Applications</h2>
                        <p className="text-muted-foreground">Manage and track your job applications.</p>
                    </div>

                    <Suspense fallback={
                        <div className="flex justify-center p-12">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    }>
                        <ApplicationList applications={applications} />
                    </Suspense>
                </div>
            </MainLayout>
        </AuthGuard>
    );
}
