import { useState } from 'react';
import { useAuth } from '@/lib/auth/AuthContext';
import { Button, Input, Field, Card } from '@/shared/components/ui';

export function LoginPage() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const trimmed = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setError('Enter a valid email address');
      return;
    }
    if (!password) {
      setError('Enter your password');
      return;
    }

    setSubmitting(true);
    const { error: err } = await signIn(trimmed, password);
    setSubmitting(false);

    if (err) {
      setError(err);
    }
    // on success, AuthContext's user state flips and App.tsx routes away
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-app p-6">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center gap-4 mb-10">
          <div className="w-11 h-11 rounded-full border-2 border-gold flex items-center justify-center">
            <div className="w-3 h-3 rounded-full bg-gold" />
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold tracking-[0.06em] m-0">
              ICARO PROJECTS
            </p>
            <p className="text-[11px] text-text-muted mt-1 m-0">
              Construction management platform
            </p>
          </div>
        </div>

        <Card padding="lg" className="border-t-2 border-t-gold/30">
          <form onSubmit={onSubmit} className="space-y-5">
            <div>
              <p className="text-lg font-semibold m-0">Sign in</p>
              <p className="text-[13px] text-text-secondary mt-1.5 m-0 leading-relaxed">
                Enter your email and password to continue.
              </p>
            </div>

            <Field label="Work email" error={error ?? undefined}>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@icaroprojects.com"
                autoComplete="email"
                autoFocus
              />
            </Field>

            <Field label="Password">
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
              />
            </Field>

            <Button
              type="submit"
              variant="primary"
              disabled={submitting}
              className="w-full justify-center"
            >
              {submitting ? 'Signing in…' : 'Sign in'}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
