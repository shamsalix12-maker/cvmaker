// ═══════════════════════════════════════════════════════════════
// [F037] src/components/layout/Header.tsx
// Header Component
// ═══════════════════════════════════════════════════════════════

"use client";

import { useAuth } from '@/context/AuthContext';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LanguageSwitcher } from './LanguageSwitcher';
import { User, LogOut, Settings } from 'lucide-react';
import { MobileMenu } from './MobileMenu';

export function Header() {
    const { user, logout } = useAuth();
    const t = useTranslations();

    return (
        <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-14 items-center gap-4">
                <MobileMenu />

                <Link href="/" className="mr-6 flex items-center space-x-2">
                    <span className="font-bold">{t('common.app_name')}</span>
                </Link>

                <div className="flex flex-1 items-center justify-end space-x-2">
                    <LanguageSwitcher />

                    {user && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                                    <Avatar className="h-8 w-8">
                                        <AvatarImage src={user?.avatar_url || ''} alt={user?.name} />
                                        <AvatarFallback>{user?.name?.charAt(0).toUpperCase()}</AvatarFallback>
                                    </Avatar>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-56" align="end" forceMount>
                                <DropdownMenuLabel className="font-normal">
                                    <div className="flex flex-col space-y-1">
                                        <p className="text-sm font-medium leading-none">{user?.name}</p>
                                        <p className="text-xs leading-none text-muted-foreground">
                                            {user?.email}
                                        </p>
                                    </div>
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem asChild>
                                    <Link href="/settings" className="w-full cursor-pointer flex items-center">
                                        <Settings className="mr-2 h-4 w-4" />
                                        <span>{t('nav.settings')}</span>
                                    </Link>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={logout}>
                                    <LogOut className="mr-2 h-4 w-4" />
                                    <span>{t('auth.logout')}</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}
                </div>
            </div>
        </header>
    );
}
