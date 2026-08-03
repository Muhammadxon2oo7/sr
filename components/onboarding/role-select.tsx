'use client';

import { useState, type ReactNode } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { haptic } from '@/lib/telegram';
import type { MeResponse, Role } from '@/lib/types';
import { Button, ErrorBanner, Field, Input, cx } from '@/components/ui';
import {
  IconCheck,
  IconInbox,
  IconManager,
  IconPalette,
  IconScissors,
  IconSparkle,
  IconVideo,
} from '@/components/ui/icons';
import {
  AnimatePresence,
  AnimatedItem,
  AnimatedList,
  motion,
  softSpring,
  spring,
} from '@/components/ui/motion';

interface RoleOptionDef {
  value: Role;
  label: string;
  hint: string;
  icon: ReactNode;
}

const MANAGER: RoleOptionDef = {
  value: 'MANAGER',
  label: 'Prodakshn-menejer',
  hint: 'Klientlar, jamoa va pulni boshqaraman',
  icon: <IconManager size={20} />,
};

const WORKERS: RoleOptionDef[] = [
  { value: 'VIDEOGRAPHER', label: 'Videograf', hint: 'Suratga olaman', icon: <IconVideo size={20} /> },
  { value: 'EDITOR', label: 'Montajyor', hint: 'Video montaj qilaman', icon: <IconScissors size={20} /> },
  { value: 'DESIGNER', label: 'Dizayner', hint: 'Dizayn va grafika', icon: <IconPalette size={20} /> },
  { value: 'OTHER', label: 'Boshqa', hint: "O'z kasbimni yozaman", icon: <IconSparkle size={20} /> },
];

/** Rol faqat bir marta tanlanadi va keyin o'zgartirilmaydi. */
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
    <div className="mx-auto min-h-dvh max-w-lg px-4 pb-28 pt-10">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={softSpring}
      >
        <h1 className="text-[26px] font-semibold tracking-tight">Kim sifatida ishlaysiz?</h1>
        <p className="mt-1.5 text-[14px] leading-relaxed text-fg-muted">
          Rol bir marta tanlanadi va keyinchalik o&apos;zgartirilmaydi.
        </p>
      </motion.div>

      <AnimatePresence>
        {invite && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={spring}
            className="mt-5 flex gap-3 rounded-[12px] border border-border bg-surface px-4 py-3"
          >
            <IconInbox size={18} className="mt-0.5 shrink-0 text-fg-muted" />
            <p className="text-[13px] leading-relaxed">
              Sizni <b>{invite.name}</b> agentligi taklif qilgan. Rolni tanlaganingizdan
              so&apos;ng avtomatik qo&apos;shilasiz.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatedList className="mt-7 space-y-2">
        <AnimatedItem className="mb-2">
          <RoleOption
            {...MANAGER}
            selected={picked === 'MANAGER'}
            onSelect={() => setPicked('MANAGER')}
          />
        </AnimatedItem>

        <AnimatedItem>
          <div className="px-0.5 pb-2 pt-5 text-[13px] font-medium text-fg-muted">
            Ishchi rollari
          </div>
        </AnimatedItem>

        {WORKERS.map((r) => (
          <AnimatedItem key={r.value} className="mb-2">
            <RoleOption {...r} selected={picked === r.value} onSelect={() => setPicked(r.value)} />
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

      {demo && (
        <button
          onClick={logout}
          className="mt-8 w-full text-center text-[13px] text-fg-muted active:opacity-60"
        >
          Boshqa akkaunt bilan kirish
        </button>
      )}

      <div className="fixed inset-x-0 bottom-0 border-t border-border bg-bg/90 p-4 pb-[calc(env(safe-area-inset-bottom)+16px)] backdrop-blur-xl">
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
  icon,
  selected,
  onSelect,
}: RoleOptionDef & { selected: boolean; onSelect: () => void }) {
  return (
    <motion.button
      onClick={() => {
        haptic('light');
        onSelect();
      }}
      whileTap={{ scale: 0.985 }}
      transition={spring}
      className={cx(
        'flex w-full items-center gap-3.5 rounded-[12px] border bg-surface px-4 py-3.5 text-left transition-colors',
        selected ? 'border-fg' : 'border-border',
      )}
    >
      <span
        className={cx(
          'flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] transition-colors',
          selected ? 'bg-primary text-primary-fg' : 'bg-muted text-fg-muted',
        )}
      >
        {icon}
      </span>

      <span className="min-w-0 flex-1">
        <span className="block text-[15px] font-medium">{label}</span>
        <span className="block text-[13px] text-fg-muted">{hint}</span>
      </span>

      <span
        className={cx(
          'flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors',
          selected ? 'border-primary bg-primary text-primary-fg' : 'border-border-strong',
        )}
      >
        <AnimatePresence>
          {selected && (
            <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
              <IconCheck size={12} strokeWidth={3} />
            </motion.span>
          )}
        </AnimatePresence>
      </span>
    </motion.button>
  );
}
