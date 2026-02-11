import { AuthGuard } from '@/components/auth/AuthGuard';
import { MainLayout } from '@/components/layout/MainLayout';
import { ApplicationService } from '@/lib/applications';
import { DashboardView } from '@/components/dashboard/DashboardView';

export default async function DashboardPage() {
    const listRes = await ApplicationService.listApplications();
    const cv = await ApplicationService.getLatestCV();

    // Handle potential errors by defaulting to empty
    const applications = (listRes.success && listRes.data) ? listRes.data : [];

    return (
        <AuthGuard>
            <MainLayout>
                <DashboardView cv={cv} applications={applications} />
            </MainLayout>
        </AuthGuard>
    );
}
