// ═══════════════════════════════════════════════════════════════
// [F091] src/components/auth/DevLoginForm.tsx
// Development Login Form
// ═══════════════════════════════════════════════════════════════

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useTranslations } from 'next-intl';

export function DevLoginForm() {
    const [email, setEmail] = useState('');
    const [name, setName] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const t = useTranslations('auth');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        await login(email, name);
        setLoading(false);
    };

    return (
        <Card className="w-full max-w-sm mx-auto shadow-lg">
            <CardHeader>
                <CardTitle>{t('dev_login_title')}</CardTitle>
                <CardDescription>{t('dev_login_subtitle')}</CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit}>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="email">{t('email_label')}</Label>
                        <Input
                            id="email"
                            type="email"
                            placeholder={t('email_placeholder')}
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="name">{t('name_label')}</Label>
                        <Input
                            id="name"
                            type="text"
                            placeholder={t('name_placeholder')}
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                        />
                    </div>
                </CardContent>
                <CardFooter>
                    <Button type="submit" className="w-full" disabled={loading}>
                        {loading ? t('logging_in') : t('login_button')}
                    </Button>
                </CardFooter>
            </form>
        </Card>
    );
}
