// ═══════════════════════════════════════════════════════════════
// [F039] src/components/layout/Footer.tsx
// Footer Component
// ═══════════════════════════════════════════════════════════════

import { useTranslations } from 'next-intl';

export function Footer() {
    const t = useTranslations('common');

    return (
        <footer className="border-t bg-muted/40 p-4 text-center text-sm text-muted-foreground">
            <div className="container flex items-center justify-between gap-4 md:h-16 md:flex-row">
                <p className="text-balance text-center text-sm leading-loose text-muted-foreground md:text-left">
                    &copy; {new Date().getFullYear()} {t('app_name')}. All rights reserved.
                </p>
            </div>
        </footer>
    );
}
