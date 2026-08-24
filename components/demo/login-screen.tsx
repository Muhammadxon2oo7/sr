'use client';

import { useState } from 'react';
import { DEMO_ACCOUNTS } from '@/lib/mock/data';
import { haptic } from '@/lib/telegram';
import { Button, ErrorBanner, Field, Icon, Input, LogoMark } from '@/components/ui';
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
      setError('Login yoki parol noto\'g\'ri.');
      return;
    }
    haptic('success');
    onLogin(acc.userId);
  }

  return (
    <div className="relative mx-auto flex min-h-dvh max-w-lg flex-col justify-center px-5 py-10">
      {/* Ekran ortidagi cho'g' shu'lasi — logoning atmosferasi */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[45vh] opacity-70"
        style={{
          background:
            'radial-gradient(70% 55% at 50% 0%, color-mix(in srgb, var(--c-brand) 26%, transparent), transparent 70%)',
        }}
      />

      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={softSpring}>
        {/* ── Brend ────────────────────────────────────────── */}
        <div className="mb-9 flex flex-col items-center text-center">
          <motion.div
            initial={{ scale: 0.6, rotate: -10, opacity: 0 }}
            animate={{ scale: 1, rotate: 0, opacity: 1 }}
            transition={{ ...spring, delay: 0.05 }}
          >
            <LogoMark size={76} glow />
          </motion.div>
          <h1 className="mt-5 text-[30px] font-extrabold leading-none tracking-[-0.04em]">
            Prodakshn
          </h1>
          <p className="mt-2.5 max-w-[260px] text-[14.5px] leading-relaxed text-muted">
            Klientlar, jamoa va pul oqimi — bitta joyda
          </p>
        </div>

        {/* ── Forma ────────────────────────────────────────── */}
        <div className="hairline space-y-3 rounded-[26px] bg-surface p-4 shadow-card">
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

        {/* ── Demo akkauntlar — bosilsa avtomatik kiradi ───── */}
        <div className="mt-7">
          <div className="mb-2.5 flex items-center gap-3">
            <span className="h-px flex-1 bg-line" />
            <span className="eyebrow">Demo akkauntlar · parol 1234</span>
            <span className="h-px flex-1 bg-line" />
          </div>

          <div className="space-y-2">
            {DEMO_ACCOUNTS.map((a, i) => (
              <motion.button
                key={a.login}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...spring, delay: 0.08 + 0.05 * i }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  setLogin(a.login);
                  setPassword(a.password);
                  submit(a.login, a.password);
                }}
                className="hairline flex w-full items-center gap-3 rounded-2xl bg-surface px-4 py-3 text-left active:bg-sunk"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand/12 text-brand">
                  {Icon.user({ size: 17 })}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[15px] font-bold tracking-[-0.02em]">{a.title}</div>
                  <div className="truncate text-[12px] text-muted">{a.subtitle}</div>
                </div>
                <span className="shrink-0 rounded-lg bg-sunk px-2 py-1 font-mono text-[11.5px] text-faint">
                  {a.login}
                </span>
              </motion.button>
            ))}
          </div>
        </div>

        <p className="mt-7 text-center text-[11px] leading-relaxed text-faint">
          Demo versiya — barcha ma&apos;lumot faqat shu brauzerda saqlanadi.
          <br />
          Server yo&apos;q, hech narsa hech qayerga yuborilmaydi.
        </p>
      </motion.div>
    </div>
  );
}
