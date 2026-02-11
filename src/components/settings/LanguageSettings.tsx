// ============================================
// [F167] src/components/settings/LanguageSettings.tsx
// ============================================

'use client';

import { useTranslations, useLocale } from 'next-intl';
import { useRouter, usePathname } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Globe, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export function LanguageSettings() {
    const t = useTranslations('settings');
    const locale = useLocale();
    const router = useRouter();
    const pathname = usePathname();

    const handleLanguageChange = (newLocale: string) => {
        if (newLocale === locale) return;

        // Redirect to the same path but with a different locale
        const newPath = pathname.replace(`/${locale}`, `/${newLocale}`);
        router.push(newPath || `/${newLocale}`);
    };

    const languages = [
        { code: 'en', label: 'English', native: 'English' },
        { code: 'fa', label: 'Persian', native: 'فارسی' }
    ];

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Globe className="h-5 w-5" />
                    {t('language_settings_title')}
                </CardTitle>
                <CardDescription>{t('language_settings_description')}</CardDescription>
            </CardHeader>
            <CardContent>
                <RadioGroup
                    value={locale}
                    onValueChange={handleLanguageChange}
                    className="grid gap-4 sm:grid-cols-2"
                >
                    {languages.map((lang) => (
                        <div key={lang.code}>
                            <RadioGroupItem
                                value={lang.code}
                                id={`lang-${lang.code}`}
                                className="peer sr-only"
                            />
                            <Label
                                htmlFor={`lang-${lang.code}`}
                                className={cn(
                                    "flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer transition-all",
                                    locale === lang.code && "border-primary bg-accent/50"
                                )}
                            >
                                <div className="flex items-center justify-between w-full mb-2">
                                    <span className="font-semibold">{lang.native}</span>
                                    {locale === lang.code && <Check className="h-4 w-4 text-primary" />}
                                </div>
                                <span className="text-sm text-muted-foreground w-full">
                                    {lang.label}
                                </span>
                            </Label>
                        </div>
                    ))}
                </RadioGroup>
            </CardContent>
        </Card>
    );
}
