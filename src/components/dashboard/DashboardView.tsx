'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { JobApplication, ComprehensiveCV } from '@/lib/types';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
    CardFooter
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Plus,
    FileText,
    Briefcase,
    CheckCircle2,
    Clock,
    ChevronRight,
    ArrowUpRight,
    FileEdit,
    AlertCircle
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface DashboardViewProps {
    cv: ComprehensiveCV | null;
    applications: JobApplication[];
}

export function DashboardView({ cv, applications }: DashboardViewProps) {
    const t = useTranslations('dashboard');
    const ct = useTranslations('common');
    const router = useRouter();

    const stats = {
        total: applications.length,
        completed: applications.filter(a => a.status === 'finalized').length,
        drafts: applications.filter(a => a.status !== 'finalized').length
    };

    const recentApplications = [...applications]
        .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
        .slice(0, 4);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'finalized':
                return 'bg-green-500/10 text-green-500 hover:bg-green-500/20';
            case 'draft_ready':
                return 'bg-blue-500/10 text-blue-500 hover:bg-blue-500/20';
            case 'editing':
                return 'bg-violet-500/10 text-violet-500 hover:bg-violet-500/20';
            case 'processing':
                return 'bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20';
            default:
                return 'bg-muted text-muted-foreground';
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header / Welcome Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                    <h2 className="text-3xl font-black tracking-tighter">{t('title')}</h2>
                    <p className="text-muted-foreground">{t('welcome_message')}</p>
                </div>
                <Button
                    size="lg"
                    className="rounded-full shadow-lg hover:shadow-primary/25 font-bold gap-2"
                    onClick={() => router.push('/new-application')}
                >
                    <Plus className="h-5 w-5" />
                    {t('create_first_application')}
                </Button>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* CV Status Card */}
                <Card className="border-l-4 border-l-primary shadow-sm hover:shadow-md transition-all">
                    <CardHeader className="pb-2">
                        <CardDescription className="uppercase text-[10px] font-bold tracking-wider">{t('cv_status')}</CardDescription>
                        <CardTitle className="text-xl flex items-center gap-2">
                            {cv ? (
                                <>
                                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                                    {t('cv_complete')}
                                </>
                            ) : (
                                <>
                                    <AlertCircle className="h-5 w-5 text-amber-500" />
                                    {t('cv_missing')}
                                </>
                            )}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                            {cv ? t('cv_complete_desc', { default: 'Your profile is up to date and ready for tailoring.' }) :
                                t('cv_missing_desc', { default: 'Upload or create your CV to start generating applications.' })}
                        </p>
                    </CardContent>
                    <CardFooter>
                        <Link href="/cv-manager" className="text-sm font-bold text-primary flex items-center hover:underline">
                            {cv ? 'Update CV' : 'Upload CV'} <ChevronRight className="h-4 w-4" />
                        </Link>
                    </CardFooter>
                </Card>

                {/* Total Stats */}
                <Card className="shadow-sm hover:shadow-md transition-all">
                    <CardHeader className="pb-2">
                        <CardDescription className="uppercase text-[10px] font-bold tracking-wider">{t('total_applications')}</CardDescription>
                        <CardTitle className="text-4xl font-black">{stats.total}</CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm text-muted-foreground">
                        Applications created so far
                    </CardContent>
                </Card>

                {/* Drafts */}
                <Card className="shadow-sm hover:shadow-md transition-all">
                    <CardHeader className="pb-2">
                        <CardDescription className="uppercase text-[10px] font-bold tracking-wider">{t('draft_applications')}</CardDescription>
                        <CardTitle className="text-4xl font-black text-amber-500">{stats.drafts}</CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm text-muted-foreground">
                        In progress or pending review
                    </CardContent>
                </Card>

                {/* Completed */}
                <Card className="shadow-sm hover:shadow-md transition-all">
                    <CardHeader className="pb-2">
                        <CardDescription className="uppercase text-[10px] font-bold tracking-wider">{t('completed_applications')}</CardDescription>
                        <CardTitle className="text-4xl font-black text-green-500">{stats.completed}</CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm text-muted-foreground">
                        Ready for submission
                    </CardContent>
                </Card>
            </div>

            {/* Recent Applications List */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold flex items-center gap-2">
                        <Clock className="h-5 w-5 text-muted-foreground" />
                        {t('recent_applications')}
                    </h3>
                    {applications.length > 0 && (
                        <Link href="/applications" className="text-sm font-medium text-primary hover:underline flex items-center">
                            {t('view_all_applications')} <ArrowUpRight className="h-4 w-4 ml-1" />
                        </Link>
                    )}
                </div>

                {recentApplications.length === 0 ? (
                    <Card className="border-dashed py-12 flex flex-col items-center justify-center text-center bg-muted/20">
                        <div className="h-16 w-16 bg-muted/50 rounded-full flex items-center justify-center mb-4">
                            <FileEdit className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <h4 className="text-lg font-semibold mb-2">{t('no_applications_yet')}</h4>
                        <p className="text-muted-foreground max-w-sm mb-6">
                            Start your job hunt by creating a tailored application for your dream job.
                        </p>
                        <Button onClick={() => router.push('/new-application')}>
                            {t('create_first_application')}
                        </Button>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {recentApplications.map((app) => (
                            <Link key={app.id} href={app.status === 'input' ? `/new-application?id=${app.id}` : `/applications/${app.id}`}>
                                <Card className="h-full hover:border-primary/50 hover:shadow-lg transition-all group cursor-pointer bg-card/50 backdrop-blur-sm">
                                    <CardHeader className="pb-3">
                                        <div className="flex justify-between items-start gap-2">
                                            <Badge variant="outline" className={`font-bold border-0 ${getStatusColor(app.status)}`}>
                                                {app.status.replace('_', ' ')}
                                            </Badge>
                                            <span className="text-[10px] text-muted-foreground font-medium">
                                                {formatDistanceToNow(new Date(app.updated_at), { addSuffix: true })}
                                            </span>
                                        </div>
                                        <CardTitle className="line-clamp-1 text-base group-hover:text-primary transition-colors">
                                            {app.job_title}
                                        </CardTitle>
                                        <CardDescription className="flex items-center gap-1 font-medium">
                                            <Briefcase className="h-3 w-3" />
                                            {app.company_name}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-xs text-muted-foreground line-clamp-2">
                                            {app.job_description || "No description provided"}
                                        </p>
                                    </CardContent>
                                    <CardFooter className="pt-0 pb-4 text-xs text-muted-foreground justify-between">
                                        <div className="flex items-center gap-2">
                                            <FileText className="h-3 w-3" />
                                            {app.output_language === 'fa' ? 'Persian' : 'English'}
                                        </div>
                                        <ChevronRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity -translate-x-2 group-hover:translate-x-0" />
                                    </CardFooter>
                                </Card>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
