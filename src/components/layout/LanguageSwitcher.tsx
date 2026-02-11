// ═══════════════════════════════════════════════════════════════
// [F040] src/components/layout/LanguageSwitcher.tsx
// Language Switcher Component
// ═══════════════════════════════════════════════════════════════

"use client";

import { useLocale, useTranslations } from "next-intl";
import { useRouter, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Globe } from "lucide-react";

export function LanguageSwitcher() {
    const locale = useLocale();
    const router = useRouter();
    const pathname = usePathname();
    const t = useTranslations('common');

    const switchLocale = (newLocale: string) => {
        // Construct the new path by replacing the current locale segment
        // This is a simplified approach assuming the URL structure is always /[locale]/...
        const segments = pathname.split('/');
        segments[1] = newLocale;
        const newPath = segments.join('/');
        router.replace(newPath);
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" aria-label={t('language')}>
                    <Globe className="h-[1.2rem] w-[1.2rem]" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => switchLocale('en')}>
                    English
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => switchLocale('fa')}>
                    فارسی
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
