// ═══════════════════════════════════════════════════════════════
// [F038] src/components/layout/Sidebar.tsx
// Sidebar Component
// ═══════════════════════════════════════════════════════════════

"use client";

import { usePathname } from '@/i18n/navigation';
import { Link } from '@/i18n/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    LayoutDashboard,
    FileText,
    PlusCircle,
    FolderOpen,
    MessageSquare,
    Settings,
    Languages,
} from 'lucide-react';
import { useTranslations } from 'next-intl';

export function Sidebar({ className }: { className?: string }) {
    const pathname = usePathname();
    const t = useTranslations('nav');

    const links = [
        {
            title: t('dashboard'),
            href: '/dashboard',
            icon: LayoutDashboard,
        },
        {
            title: t('cv_manager'),
            href: '/cv-manager',
            icon: FileText,
        },
        {
            title: t('new_application'),
            href: '/new-application',
            icon: PlusCircle,
        },
        {
            title: t('applications'),
            href: '/applications',
            icon: FolderOpen,
        },
        {
            title: t('prompts'),
            href: '/prompts',
            icon: MessageSquare,
        },
        {
            title: t('settings'),
            href: '/settings',
            icon: Settings,
        },
    ];

    return (
        <aside className={cn("hidden border-r bg-muted/40 lg:block lg:w-60 lg:flex-col", className)}>
            <div className="flex flex-col gap-2 p-2">
                <ScrollArea className="h-full">
                    <nav className="grid gap-1 px-2 group-[[data-collapsed=true]]:justify-center group-[[data-collapsed=true]]:px-2">
                        {links.map((link, index) => {
                            const isActive = pathname === link.href || pathname?.startsWith(link.href + '/');
                            return (
                                <Button
                                    key={index}
                                    asChild
                                    variant={isActive ? 'secondary' : 'ghost'}
                                    className={cn(
                                        'justify-start gap-2',
                                        isActive && 'bg-secondary'
                                    )}
                                >
                                    <Link href={link.href}>
                                        <link.icon className="h-4 w-4" />
                                        <span>{link.title}</span>
                                    </Link>
                                </Button>
                            );
                        })}
                    </nav>
                </ScrollArea>
            </div>
        </aside>
    );
}
