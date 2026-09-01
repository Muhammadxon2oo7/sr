'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { haptic } from '@/lib/telegram';
import type { MeResponse, Role } from '@/lib/types';
import { Button, ErrorBanner, Field, Icon, Input, Sheet, cx, type IconName } from '@/components/ui';
import { AnimatePresence, motion, spring } from '@/components/ui/motion';

type Option = { value: Role; label: string; hint: string; icon: IconName };

const MANAGER: Option = {
  value: 'MANAGER',
  label: 'Prodakshn-menejer',
  hint: 'Klientlar, jamoa va pulni boshqaraman',
  icon: 'clients',
};

const WORKERS: Option[] = [
  { value: 'VIDEOGRAPHER', label: 'Videograf', hint: 'Suratga olaman', icon: 'film' },
  { value: 'EDITOR', label: 'Montajyor', hint: 'Video montaj qilaman', icon: 'edit' },
  { value: 'DESIGNER', label: 'Dizayner', hint: 'Dizayn va grafika', icon: 'spark' },
  { value: 'OTHER', label: 'Boshqa', hint: "O'z kasbimni yozaman", icon: 'plus' },
];

/**
 * Rolni almashtirish.
 *
 * Server qat'iy shart qo'yadi: jamoada bo'lmaslik va ish tarixi
 * bo'lmasligi kerak. Shu sabab tugma faqat `roleChange.canChange`
 * bo'lganda ko'rsatiladi, aks holda sabab yoziladi.
 */
export function RoleChangeSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { me, setMe } = useAuth();
  const current = me?.user.role ?? null;

  const [picked, setPicked] = useState<Role | null>(current);
  const [customName, setCustomName] = useState(me?.user.customRoleName ?? '');
  const [error, setError] = useState<string | null>(null);

  const save = useMutation({
    mutationFn: () =>
      api.patch<MeResponse>('/me/role', {
        role: picked,
        customRoleName: picked === 'OTHER' ? customName.trim() : undefined,
      }),
    onSuccess: (data) => {
      haptic('success');
      setMe(data);
      onClose();
    },
    onError: (err) => {
      haptic('error');
      setError((err as Error).message);
    },
  });

  const unchanged = picked === current && !(picked === 'OTHER' && customName.trim() !== (me?.user.customRoleName ?? ''));

  return (
    <Sheet open={open} onClose={onClose} title="Rolni o'zgartirish">
      <div className="space-y-3">
        <p className="px-1 text-[13px] leading-relaxed text-muted">
          Rolni faqat hozir — jamoaga qo&apos;shilmagan va ish biriktirilmagan
          paytda o&apos;zgartirish mumkin.
        </p>

        <div className="space-y-2">
          <RoleRow
            {...MANAGER}
            selected={picked === MANAGER.value}
            onSelect={() => setPicked(MANAGER.value)}
          />
          <div className="eyebrow px-1 pb-1 pt-3">Ishchi rollari</div>
          {WORKERS.map((r) => (
            <RoleRow
              key={r.value}
              {...r}
              selected={picked === r.value}
              onSelect={() => setPicked(r.value)}
            />
          ))}
        </div>

        <AnimatePresence>
          {picked === 'OTHER' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={spring}
              className="overflow-hidden"
            >
              <div className="pt-2">
                <Field label="Rolingiz nomi" hint="Masalan: prodyuser, SMM, operator">
                  <Input
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    placeholder="Kasbingizni yozing"
                    maxLength={40}
                  />
                </Field>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>{error && <ErrorBanner message={error} />}</AnimatePresence>

        <Button
          size="lg"
          icon="check"
          loading={save.isPending}
          disabled={!picked || unchanged || (picked === 'OTHER' && !customName.trim())}
          onClick={() => {
            setError(null);
            save.mutate();
          }}
        >
          Saqlash
        </Button>
      </div>
    </Sheet>
  );
}

function RoleRow({
  label,
  hint,
  icon,
  selected,
  onSelect,
}: Option & { selected: boolean; onSelect: () => void }) {
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
        selected ? 'border-brand shadow-glow' : 'border-line',
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
        {selected && Icon.check({ size: 12, strokeWidth: 3 })}
      </div>
    </motion.button>
  );
}
