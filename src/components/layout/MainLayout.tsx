// ═══════════════════════════════════════════════════════════════
// [F093] src/components/layout/MainLayout.tsx
// Main Application Layout
// ═══════════════════════════════════════════════════════════════

import { ReactNode } from 'react';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { Footer } from './Footer';

export function MainLayout({ children }: { children: ReactNode }) {
    return (
        <div className="flex h-screen w-full flex-col">
            <Header />
            <div className="flex flex-1 overflow-hidden">
                <Sidebar className="hidden w-64 border-r bg-muted/40 md:block" />
                <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
                    {children}
                </main>
            </div>
            <Footer />
        </div>
    );
}
