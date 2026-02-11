// ═══════════════════════════════════════════════════════════════
// [F094] src/components/layout/MobileMenu.tsx
// Mobile Navigation Menu
// ═══════════════════════════════════════════════════════════════

"use client";

import { useState } from 'react';
import { usePathname } from '@/i18n/navigation';
import { Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import {
    Menu,
    LayoutDashboard,
    FileText,
    PlusCircle,
    FolderOpen,
    MessageSquare,
    Settings,
} from 'lucide-react';
import { cn } from '@/lib/utils';


export function MobileMenu() {
    const [open, setOpen] = useState(false);
    const pathname = usePathname();
    const t = useTranslations('nav');

    const links = [
        { title: t('dashboard'), href: '/dashboard', icon: LayoutDashboard },
        { title: t('cv_manager'), href: '/cv-manager', icon: FileText },
        { title: t('new_application'), href: '/new-application', icon: PlusCircle },
        { title: t('applications'), href: '/applications', icon: FolderOpen },
        { title: t('prompts'), href: '/prompts', icon: MessageSquare },
        { title: t('settings'), href: '/settings', icon: Settings },
    ];

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden">
                    <Menu className="h-6 w-6" />
                    <span className="sr-only">Toggle menu</span>
                </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[300px] sm:w-[400px]">
                <nav className="grid gap-2 text-lg font-medium">
                    <Link
                        href="/"
                        className="flex items-center gap-2 text-lg font-semibold"
                        onClick={() => setOpen(false)}
                    >
                        <span className="sr-only">CV Tailor</span>
                    </Link>
                    {links.map((link, index) => {
                        const isActive = pathname === link.href || pathname?.startsWith(link.href + '/');
                        return (
                            <Link
                                key={index}
                                href={link.href}
                                onClick={() => setOpen(false)}
                                className={cn(
                                    'mx-[-0.65rem] flex items-center gap-4 rounded-xl px-3 py-2 text-muted-foreground hover:text-foreground',
                                    isActive && 'bg-muted text-foreground'
                                )}
                            >
                                <link.icon className="h-5 w-5" />
                                {link.title}
                            </Link>
                        );
                    })}
                </nav>
            </SheetContent>
        </Sheet>
    );
}
