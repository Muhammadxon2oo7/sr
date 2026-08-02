'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { haptic } from '@/lib/telegram';
import type { MeResponse, Role } from '@/lib/types';
import { Button, ErrorBanner, Field, Input, cx } from '@/components/ui';
import {
  AnimatePresence,
  AnimatedItem,
  AnimatedList,
  motion,
  softSpring,
  spring,
} from '@/components/ui/motion';

const MANAGER = { value: 'MANAGER' as Role, label: '🎬 Prodakshn-menejer', hint: 'Klientlar, jamoa va pulni boshqaraman' };

const WORKERS: { value: Role; label: string; hint: string }[] = [
  { value: 'VIDEOGRAPHER', label: '🎥 Videograf', hint: 'Suratga olaman' },
  { value: 'EDITOR', label: '✂️ Montajyor', hint: 'Video montaj qilaman' },
  { value: 'DESIGNER', label: '🎨 Dizayner', hint: 'Dizayn va grafika' },
  { value: 'OTHER', label: '➕ Boshqa', hint: 'O\'z kasbimni yozaman' },
];

/**
 * Rol faqat bir marta tanlanadi va keyin o'zgartirilmaydi (TZ 2-bo'lim).
 */
export function RoleSelect() {
  const { setMe, me, demo, logout } = useAuth();
  const [picked, setPicked] = useState<Role | null>(null);
  const [customName, setCustomName] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const invite = me?.pendingInvite;

  async function submit() {
    if (!picked) return;
    if (picked === 'OTHER' && !customName.trim()) {
      setError('Rol nomini kiriting.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const updated = await api.post<MeResponse>('/me/role', {
        role: picked,
        customRoleName: picked === 'OTHER' ? customName.trim() : undefined,
      });
      haptic('success');
      setMe(updated);
    } catch (err) {
      haptic('error');
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto min-h-dvh max-w-lg px-4 pb-28 pt-8">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={softSpring}>
        <h1 className="text-[26px] font-bold leading-tight">Kim sifatida ishlaysiz?</h1>
        <p className="mt-2 text-[15px] text-tg-hint">
          Rol bir marta tanlanadi va keyinchalik o&apos;zgartirilmaydi.
        </p>
      </motion.div>

      <AnimatePresence>
        {invite && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={spring}
            className="mt-4 rounded-2xl bg-tg-button/10 px-4 py-3 text-[14px]"
          >
            📨 Sizni <b>{invite.name}</b> (@{invite.username}) prodakshni taklif qilgan. Rolni
            tanlaganingizdan so&apos;ng avtomatik qo&apos;shilasiz.
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatedList className="mt-6 space-y-2">
        <AnimatedItem className="mb-2">
          <RoleOption
            {...MANAGER}
            selected={picked === MANAGER.value}
            onSelect={() => setPicked(MANAGER.value)}
          />
        </AnimatedItem>

        <AnimatedItem>
          <div className="px-1 pb-2 pt-4 text-[13px] font-semibold uppercase tracking-wide text-tg-hint">
            Ishchi rollari
          </div>
        </AnimatedItem>

        {WORKERS.map((r) => (
          <AnimatedItem key={r.value} className="mb-2">
            <RoleOption
              {...r}
              selected={picked === r.value}
              onSelect={() => setPicked(r.value)}
            />
          </AnimatedItem>
        ))}
      </AnimatedList>

      <AnimatePresence>
        {picked === 'OTHER' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={spring}
            className="overflow-hidden"
          >
            <div className="pt-4">
              <Field label="Rolingiz nomi" hint="Masalan: prodyuser, SMM, operator">
                <Input
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder="Kasbingizni yozing"
                  maxLength={40}
                  autoFocus
                />
              </Field>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>{error && <div className="mt-4"><ErrorBanner message={error} /></div>}</AnimatePresence>

      {demo && (
        <button
          onClick={logout}
          className="mt-6 w-full text-center text-[13px] text-tg-hint active:opacity-60"
        >
          Boshqa akkaunt bilan kirish
        </button>
      )}

      <div className="fixed inset-x-0 bottom-0 border-t border-tg-separator bg-tg-bg/90 p-4 pb-[calc(env(safe-area-inset-bottom)+16px)] backdrop-blur-xl">
        <div className="mx-auto max-w-lg">
          <Button size="lg" onClick={submit} disabled={!picked} loading={saving}>
            Davom etish
          </Button>
        </div>
      </div>
    </div>
  );
}

function RoleOption({
  label,
  hint,
  selected,
  onSelect,
}: {
  label: string;
  hint: string;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <motion.button
      onClick={() => {
        haptic('light');
        onSelect();
      }}
      whileTap={{ scale: 0.98 }}
      transition={spring}
      className={cx(
        'flex w-full items-center gap-3 rounded-2xl border-2 bg-tg-section px-4 py-3.5 text-left transition-colors',
        selected ? 'border-tg-button' : 'border-transparent',
      )}
    >
      <div className="min-w-0 flex-1">
        <div className="text-[16px] font-semibold">{label}</div>
        <div className="text-[13px] text-tg-hint">{hint}</div>
      </div>
      <div
        className={cx(
          'flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors',
          selected ? 'border-tg-button bg-tg-button' : 'border-tg-separator',
        )}
      >
        <AnimatePresence>
          {selected && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              transition={spring}
              className="text-[11px] font-bold text-tg-button-text"
            >
              ✓
            </motion.span>
          )}
        </AnimatePresence>
      </div>
    </motion.button>
  );
}
