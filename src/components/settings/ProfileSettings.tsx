// ============================================
// [F166] src/components/settings/ProfileSettings.tsx
// ============================================

'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { User, Loader2, Save } from 'lucide-react';
import { toast } from 'sonner';
import { createBrowserSupabaseClient } from '@/lib/supabase/client';

export function ProfileSettings() {
    const t = useTranslations('settings');
    const { user } = useAuth();

    const [name, setName] = useState(user?.name || '');
    const [saving, setSaving] = useState(false);
    const supabase = createBrowserSupabaseClient();

    const handleSave = async () => {
        setSaving(true);
        try {
            const { error } = await supabase.auth.updateUser({
                data: { full_name: name, name: name }
            });

            if (error) throw error;

            toast.success(t('profile_updated'));
            // Note: AuthContext should pick up the change via onAuthStateChange, but it might not fire for metadata updates immediately?
            // Usually it does if the session is refreshed.
        } catch (err: any) {
            toast.error(err.message);
        } finally {
            setSaving(false);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    {t('profile_settings_title')}
                </CardTitle>
                <CardDescription>{t('profile_settings_description')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid gap-2">
                    <Label htmlFor="email">{t('email')}</Label>
                    <Input
                        id="email"
                        value={user?.email || ''}
                        disabled
                        className="bg-muted"
                    />
                    <p className="text-xs text-muted-foreground">{t('email_hint')}</p>
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="name">{t('name')}</Label>
                    <Input
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder={t('name_placeholder')}
                    />
                </div>

                <Button onClick={handleSave} disabled={saving}>
                    {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                    {t('save_changes')}
                </Button>
            </CardContent>
        </Card>
    );
}
