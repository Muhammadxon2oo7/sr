'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { haptic } from '@/lib/telegram';
import type { MeResponse, Role } from '@/lib/types';
import { Button, ErrorBanner, Field, Icon, Input, LogoMark, cx, type IconName } from '@/components/ui';
import {
  AnimatePresence,
  AnimatedItem,
  AnimatedList,
  motion,
  softSpring,
  spring,
} from '@/components/ui/motion';

type RoleOptionDef = { value: Role; label: string; hint: string; icon: IconName };

const MANAGER: RoleOptionDef = {
  value: 'MANAGER',
  label: 'Prodakshn-menejer',
  hint: 'Klientlar, jamoa va pulni boshqaraman',
  icon: 'clients',
};

const WORKERS: RoleOptionDef[] = [
  { value: 'VIDEOGRAPHER', label: 'Videograf', hint: 'Suratga olaman', icon: 'film' },
  { value: 'EDITOR', label: 'Montajyor', hint: 'Video montaj qilaman', icon: 'edit' },
  { value: 'DESIGNER', label: 'Dizayner', hint: 'Dizayn va grafika', icon: 'spark' },
  { value: 'OTHER', label: 'Boshqa', hint: "O'z kasbimni yozaman", icon: 'plus' },
];

/**
 * Rol faqat bir marta tanlanadi va keyin o'zgartirilmaydi (TZ 2-bo'lim).
 */
export function RoleSelect() {
  const { setMe, me } = useAuth();
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
    <div className="mx-auto min-h-dvh max-w-lg px-4 pb-32 pt-8">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={softSpring}
      >
        <LogoMark size={44} glow />
        <h1 className="display mt-5 text-[26px] font-bold leading-tight">Kim sifatida ishlaysiz?</h1>
        <p className="mt-2 text-[14.5px] leading-relaxed text-muted">
          Rol bir marta tanlanadi va keyinchalik o&apos;zgartirilmaydi.
        </p>
      </motion.div>

      <AnimatePresence>
        {invite && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={spring}
            className="mt-5 flex items-start gap-2.5 rounded-2xl bg-brand/10 px-4 py-3 text-[13.5px] leading-relaxed"
          >
            <span className="mt-0.5 shrink-0 text-brand">{Icon.send({ size: 16 })}</span>
            <span>
              Sizni <b>{invite.name}</b> (@{invite.username}) prodakshni taklif qilgan. Rolni
              tanlaganingizdan so&apos;ng avtomatik qo&apos;shilasiz.
            </span>
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
          <div className="eyebrow px-1 pb-2 pt-4">Ishchi rollari</div>
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

      <AnimatePresence>
        {error && (
          <div className="mt-4">
            <ErrorBanner message={error} />
          </div>
        )}
      </AnimatePresence>

      <div className="fixed inset-x-0 bottom-0 glass border-t border-line p-4 pb-[calc(env(safe-area-inset-bottom)+16px)]">
        <div className="mx-auto max-w-lg">
          <Button size="lg" onClick={submit} disabled={!picked} loading={saving}>
            Davom etish
          </Button>
        </div>
      </div>
    </div>
  );
}

/** Bitta rol varianti — tanlanganda ember chegara va belgi yonadi. */
function RoleOption({
  label,
  hint,
  icon,
  selected,
  onSelect,
}: {
  label: string;
  hint: string;
  icon: IconName;
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
        'relative flex w-full items-center gap-3 overflow-hidden rounded-[18px] border bg-surface px-3.5 py-3 text-left transition-colors',
        selected ? 'border-brand shadow-glow' : 'border-line shadow-card',
      )}
    >
      {selected && <span className="ember absolute inset-y-0 left-0 w-1" />}

      <span
        className={cx(
          'flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] transition-colors',
          selected ? 'ember text-white' : 'bg-sunk text-muted',
        )}
      >
        {Icon[icon]({ size: 19 })}
      </span>

      <div className="min-w-0 flex-1">
        <div className="text-[15.5px] font-bold tracking-[-0.02em]">{label}</div>
        <div className="text-[12.5px] text-muted">{hint}</div>
      </div>

      <div
        className={cx(
          'flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors',
          selected ? 'border-brand bg-brand text-white' : 'border-line-strong',
        )}
      >
        <AnimatePresence>
          {selected && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              transition={spring}
            >
              {Icon.check({ size: 12, strokeWidth: 3 })}
            </motion.span>
          )}
        </AnimatePresence>
      </div>
    </motion.button>
  );
}
