'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { JobApplication, ApplicationStatus } from '@/lib/types';
import { formatDistanceToNow } from 'date-fns';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    MoreHorizontal,
    FileText,
    Briefcase,
    Calendar,
    ChevronRight,
    Eye
} from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface ApplicationListProps {
    applications: JobApplication[];
}

export function ApplicationList({ applications }: ApplicationListProps) {
    const t = useTranslations('applications');
    const ct = useTranslations('common');

    const getStatusBadge = (status: ApplicationStatus) => {
        const styles = {
            input: 'bg-muted text-muted-foreground',
            processing: 'bg-yellow-500/15 text-yellow-600 border-yellow-200',
            clarification: 'bg-orange-500/15 text-orange-600 border-orange-200',
            draft_ready: 'bg-blue-500/15 text-blue-600 border-blue-200',
            editing: 'bg-purple-500/15 text-purple-600 border-purple-200',
            finalized: 'bg-green-500/15 text-green-600 border-green-200',
        };

        const labelKey = `status_${status}`;

        return (
            <Badge variant="outline" className={`capitalize ${styles[status] || styles.input}`}>
                {status.replace('_', ' ')}
            </Badge>
        );
    };

    if (applications.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed rounded-xl bg-muted/5 text-center">
                <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mb-4">
                    <FileText className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{t('no_applications')}</h3>
                <p className="text-muted-foreground mb-6 max-w-sm">
                    {t('create_first')}
                </p>
                <Link href="/new-application">
                    <Button>{t('create_first')}</Button>
                </Link>
            </div>
        );
    }

    return (
        <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
            <Table>
                <TableHeader>
                    <TableRow className="bg-muted/5 hover:bg-muted/5">
                        <TableHead className="w-[300px]">{t('job_title')}</TableHead>
                        <TableHead>{t('company')}</TableHead>
                        <TableHead>{t('date')}</TableHead>
                        <TableHead>{t('status')}</TableHead>
                        <TableHead className="text-right">{t('actions')}</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {applications.map((app) => (
                        <TableRow key={app.id} className="group hover:bg-muted/5">
                            <TableCell className="font-medium">
                                <Link
                                    href={`/applications/${app.id}`}
                                    className="flex items-center gap-3 hover:text-primary transition-colors"
                                >
                                    <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                                        <FileText className="h-4 w-4" />
                                    </div>
                                    <span className="font-bold">{app.job_title}</span>
                                </Link>
                            </TableCell>
                            <TableCell>
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <Briefcase className="h-4 w-4 opacity-50" />
                                    {app.company_name}
                                </div>
                            </TableCell>
                            <TableCell>
                                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                                    <Calendar className="h-4 w-4 opacity-50" />
                                    {formatDistanceToNow(new Date(app.created_at), { addSuffix: true })}
                                </div>
                            </TableCell>
                            <TableCell>
                                {getStatusBadge(app.status)}
                            </TableCell>
                            <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                    <Link href={`/applications/${app.id}`}>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-primary/10 hover:text-primary">
                                            <Eye className="h-4 w-4" />
                                        </Button>
                                    </Link>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                                <MoreHorizontal className="h-4 w-4" />
                                                <span className="sr-only">Open menu</span>
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuLabel>{ct('actions')}</DropdownMenuLabel>
                                            <DropdownMenuItem asChild>
                                                <Link href={`/applications/${app.id}`}>
                                                    <Eye className="mr-2 h-4 w-4" /> {ct('view')}
                                                </Link>
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem className="text-destructive focus:text-destructive">
                                                {ct('delete')}
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}
