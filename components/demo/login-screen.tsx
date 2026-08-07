'use client';

import { useState } from 'react';
import { DEMO_ACCOUNTS } from '@/lib/mock/data';
import { haptic } from '@/lib/telegram';
import { Button, ErrorBanner, Field, Input, cx } from '@/components/ui';
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
    <div className="mx-auto flex min-h-dvh max-w-lg flex-col justify-center px-5 py-10">
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={softSpring}
      >
        <div className="mb-8 text-center">
          <motion.div
            className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-3xl bg-tg-button text-[32px]"
            initial={{ scale: 0.6, rotate: -8 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={spring}
          >
            🎬
          </motion.div>
          <h1 className="text-[26px] font-bold leading-tight">Prodakshn</h1>
          <p className="mt-1 text-[14px] text-tg-hint">
            Klientlar, jamoa va pul oqimi — bitta joyda
          </p>
        </div>

        <div className="space-y-3">
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
        <div className="mt-8">
          <div className="mb-2 text-center text-[12px] font-medium uppercase tracking-wide text-tg-hint">
            Demo akkauntlar (parol: 1234)
          </div>
          <div className="space-y-2">
            {DEMO_ACCOUNTS.map((a, i) => (
              <motion.button
                key={a.login}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...spring, delay: 0.05 * i }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  setLogin(a.login);
                  setPassword(a.password);
                  submit(a.login, a.password);
                }}
                className={cx(
                  'flex w-full items-center justify-between rounded-2xl bg-tg-section px-4 py-3 text-left',
                )}
              >
                <div className="min-w-0">
                  <div className="text-[15px] font-semibold">{a.title}</div>
                  <div className="truncate text-[12px] text-tg-hint">{a.subtitle}</div>
                </div>
                <span className="shrink-0 rounded-lg bg-tg-secondary px-2 py-1 font-mono text-[12px] text-tg-hint">
                  {a.login}
                </span>
              </motion.button>
            ))}
          </div>
        </div>

        <p className="mt-6 text-center text-[11px] leading-relaxed text-tg-hint">
          Demo versiya — barcha ma&apos;lumot faqat shu brauzerda saqlanadi.
          <br />
          Server yo&apos;q, hech narsa hech qayerga yuborilmaydi.
        </p>
      </motion.div>
    </div>
  );
}
