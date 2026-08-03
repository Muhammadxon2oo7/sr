'use client';

import { useState } from 'react';
import { DEMO_ACCOUNTS } from '@/lib/mock/data';
import { haptic } from '@/lib/telegram';
import { Button, ErrorBanner, Field, Input } from '@/components/ui';
import { Logo } from '@/components/ui/logo';
import { IconChevronRight } from '@/components/ui/icons';
import { AnimatePresence, motion, softSpring, spring } from '@/components/ui/motion';

/**
 * Demo rejim kirish ekrani.
 * Backend yo'q — login/parol statik, sessiya localStorage'da saqlanadi.
 */
export function LoginScreen({ onLogin }: { onLogin: (userId: string) => void }) {
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  function submit(l = login, p = password) {
    const acc = DEMO_ACCOUNTS.find(
      (a) => a.login.toLowerCase() === l.trim().toLowerCase() && a.password === p.trim(),
    );
    if (!acc) {
      haptic('error');
      setError("Login yoki parol noto'g'ri.");
      return;
    }
    haptic('success');
    onLogin(acc.userId);
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-lg flex-col justify-center px-5 py-12">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={softSpring}>
        {/* Logo */}
        <div className="mb-9 flex flex-col items-center text-center">
          <motion.div
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={spring}
            className="text-fg"
          >
            <Logo size={56} />
          </motion.div>
          <h1 className="mt-4 text-[24px] font-semibold tracking-tight">Prodakshn</h1>
          <p className="mt-1 text-[13px] text-fg-muted">
            Klientlar, jamoa va pul oqimi — bitta joyda
          </p>
        </div>

        <div className="space-y-3.5">
          <Field label="Login">
            <Input
              value={login}
              onChange={(e) => setLogin(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && submit()}
              placeholder="menejer"
              autoCapitalize="none"
              autoComplete="username"
            />
          </Field>

          <Field label="Parol">
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && submit()}
              placeholder="••••"
              autoComplete="current-password"
            />
          </Field>

          <AnimatePresence>{error && <ErrorBanner message={error} />}</AnimatePresence>

          <Button size="lg" onClick={() => submit()} disabled={!login || !password}>
            Kirish
          </Button>
        </div>

        {/* Demo akkauntlar — bosilsa avtomatik kiradi */}
        <div className="mt-9">
          <div className="mb-2.5 px-0.5 text-[12px] font-medium text-fg-muted">
            Demo akkauntlar · parol 1234
          </div>
          <div className="overflow-hidden rounded-[12px] border border-border">
            {DEMO_ACCOUNTS.map((a, i) => (
              <motion.button
                key={a.login}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.04 * i }}
                whileTap={{ backgroundColor: 'rgba(127,127,127,0.08)' }}
                onClick={() => {
                  setLogin(a.login);
                  setPassword(a.password);
                  submit(a.login, a.password);
                }}
                className="flex w-full items-center gap-3 border-b border-border bg-surface px-4 py-3 text-left last:border-b-0"
              >
                <div className="min-w-0 flex-1">
                  <div className="text-[14px] font-medium">{a.title}</div>
                  <div className="truncate text-[12px] text-fg-muted">{a.subtitle}</div>
                </div>
                <span className="shrink-0 font-mono text-[12px] text-fg-subtle">{a.login}</span>
                <IconChevronRight size={16} className="shrink-0 text-fg-subtle" />
              </motion.button>
            ))}
          </div>
        </div>

        <p className="mt-7 text-center text-[11px] leading-relaxed text-fg-subtle">
          Demo versiya — ma&apos;lumot faqat shu brauzerda saqlanadi.
          <br />
          Server yo&apos;q, hech narsa hech qayerga yuborilmaydi.
        </p>
      </motion.div>
    </div>
  );
}
