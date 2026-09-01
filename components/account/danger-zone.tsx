'use client';

import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { haptic } from '@/lib/telegram';
import type { AccountDeletionPreview, ProductionDeletionPreview } from '@/lib/types';
import {
  Button,
  Card,
  ErrorBanner,
  Field,
  Icon,
  Input,
  Section,
  Sheet,
  cx,
} from '@/components/ui';
import { AnimatePresence } from '@/components/ui/motion';
import { RoleChangeSheet } from './role-change-sheet';

/**
 * Profilning "xavfli zona" bloki: rolni o'zgartirish, prodakshnni
 * o'chirish, hisobni o'chirish.
 *
 * Uchala amal ham ortga qaytmaydi yoki boshqalarga ta'sir qiladi,
 * shuning uchun har biri oldindan nima bo'lishini aniq aytadi.
 */
export function DangerZone({ productionId }: { productionId?: string }) {
  const { me } = useAuth();
  const [roleOpen, setRoleOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [productionOpen, setProductionOpen] = useState(false);

  if (!me) return null;
  const { roleChange } = me;

  return (
    <Section title="Hisob">
      <Card tone="flat" className="space-y-3">
        {/* ── Rol ────────────────────────────────────────────── */}
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand/12 text-brand">
            {Icon.spark({ size: 17 })}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[14px] font-bold">Rol: {me.user.roleLabel}</div>
            {roleChange.canChange ? (
              <p className="mt-0.5 text-[12px] text-muted">
                Hozir o&apos;zgartirsa bo&apos;ladi — jamoaga qo&apos;shilganingizdan
                keyin qulflanadi.
              </p>
            ) : (
              <p className="mt-0.5 text-[12px] leading-relaxed text-muted">{roleChange.reason}</p>
            )}
          </div>
        </div>

        {roleChange.canChange && (
          <Button variant="secondary" size="sm" icon="edit" onClick={() => setRoleOpen(true)}>
            Rolni o&apos;zgartirish
          </Button>
        )}

        <div className="h-px bg-line" />

        {/* ── O'chirish ──────────────────────────────────────── */}
        <div className="flex flex-wrap gap-2">
          {productionId && (
            <Button
              variant="danger"
              size="sm"
              icon="warning"
              onClick={() => setProductionOpen(true)}
            >
              Prodakshnni o&apos;chirish
            </Button>
          )}
          <Button variant="danger" size="sm" icon="logout" onClick={() => setAccountOpen(true)}>
            Hisobni o&apos;chirish
          </Button>
        </div>
      </Card>

      <RoleChangeSheet open={roleOpen} onClose={() => setRoleOpen(false)} />
      <AccountDeleteSheet open={accountOpen} onClose={() => setAccountOpen(false)} />
      {productionId && (
        <ProductionDeleteSheet
          productionId={productionId}
          open={productionOpen}
          onClose={() => setProductionOpen(false)}
        />
      )}
    </Section>
  );
}

// ── Hisobni o'chirish ────────────────────────────────────────

function AccountDeleteSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [error, setError] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);

  const preview = useQuery({
    queryKey: ['account-deletion-preview'],
    queryFn: () => api.get<AccountDeletionPreview>('/me/deletion-preview'),
    enabled: open,
  });

  const remove = useMutation({
    mutationFn: () => api.del('/me'),
    onSuccess: () => {
      haptic('success');
      // Sessiya endi yaroqsiz — ilovani qayta yuklaymiz
      window.location.reload();
    },
    onError: (err) => {
      haptic('error');
      setError((err as Error).message);
    },
  });

  const p = preview.data;

  return (
    <Sheet open={open} onClose={onClose} title="Hisobni o'chirish">
      <div className="space-y-4">
        {p && !p.canDelete ? (
          <ErrorBanner message={p.reason} />
        ) : (
          <>
            <Card tone="flat" className="space-y-2.5">
              <Line icon="check" tone="ok">
                Bajargan ishlaringiz va to&apos;lovlar tarixi menejerda{' '}
                <b>saqlanib qoladi</b>
                {p && p.keptAssignments > 0 ? ` (${p.keptAssignments} ta yozuv)` : ''}.
              </Line>
              <Line icon="team" tone="warn">
                {p && p.leavingTeams > 0
                  ? `${p.leavingTeams} ta jamoadan chiqasiz.`
                  : 'Jamoalardan chiqasiz.'}{' '}
                Sizga yangi ish biriktirib bo&apos;lmaydi.
              </Line>
              {p && p.unpaidAssignments > 0 && (
                <Line icon="wallet" tone="danger">
                  Sizda <b>{p.unpaidAssignments} ta to&apos;lanmagan ish</b> bor. Hisobni
                  o&apos;chirsangiz ham menejer qarzni ko&apos;radi, lekin siz bu yerdan
                  kuzata olmaysiz.
                </Line>
              )}
              <Line icon="user" tone="muted">
                Qaytib kelsangiz — yangi, toza hisob ochiladi.
              </Line>
            </Card>

            <label className="flex cursor-pointer items-start gap-2.5 px-1">
              <input
                type="checkbox"
                checked={confirmed}
                onChange={(e) => setConfirmed(e.target.checked)}
                className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--c-danger)]"
              />
              <span className="text-[13px] leading-relaxed text-muted">
                Tushundim, hisobimni o&apos;chirmoqchiman
              </span>
            </label>

            <AnimatePresence>{error && <ErrorBanner message={error} />}</AnimatePresence>

            <Button
              size="lg"
              variant="danger"
              icon="warning"
              disabled={!confirmed}
              loading={remove.isPending}
              onClick={() => {
                setError(null);
                remove.mutate();
              }}
            >
              Hisobni o&apos;chirish
            </Button>
          </>
        )}
      </div>
    </Sheet>
  );
}

// ── Prodakshnni o'chirish ────────────────────────────────────

function ProductionDeleteSheet({
  productionId,
  open,
  onClose,
}: {
  productionId: string;
  open: boolean;
  onClose: () => void;
}) {
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);

  const preview = useQuery({
    queryKey: ['production-deletion-preview', productionId],
    queryFn: () => api.get<ProductionDeletionPreview>(`/productions/${productionId}/deletion-preview`),
    enabled: open,
  });

  const remove = useMutation({
    mutationFn: () => api.del(`/productions/${productionId}`, { confirmName: name.trim() }),
    onSuccess: () => {
      haptic('success');
      window.location.reload();
    },
    onError: (err) => {
      haptic('error');
      setError((err as Error).message);
    },
  });

  const p = preview.data;
  const matches = p ? name.trim() === p.name : false;

  return (
    <Sheet open={open} onClose={onClose} title="Prodakshnni o'chirish">
      <div className="space-y-4">
        <Card tone="flat" className="space-y-2.5">
          <Line icon="warning" tone="danger">
            Bu amal <b>qaytarilmaydi</b>. Quyidagilar butunlay o&apos;chadi:
          </Line>
          {p && (
            <div className="grid grid-cols-2 gap-2 pt-1">
              <Stat label="Jamoa a'zolari" value={p.members} />
              <Stat label="Klientlar" value={p.clients} />
              <Stat label="Ish yozuvlari" value={p.assignments} />
              <Stat label="To'lovlar" value={p.payments} />
            </div>
          )}
          <Line icon="team" tone="warn">
            Jamoa tarqaydi — barcha a&apos;zolarga xabar boradi.
          </Line>
        </Card>

        <Field
          label="Tasdiqlash"
          hint={p ? `Tasdiqlash uchun "${p.name}" deb yozing` : undefined}
        >
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={p?.name ?? ''}
            autoCapitalize="none"
          />
        </Field>

        <AnimatePresence>{error && <ErrorBanner message={error} />}</AnimatePresence>

        <Button
          size="lg"
          variant="danger"
          icon="warning"
          disabled={!matches}
          loading={remove.isPending}
          onClick={() => {
            setError(null);
            remove.mutate();
          }}
        >
          Butunlay o&apos;chirish
        </Button>
      </div>
    </Sheet>
  );
}

// ── Yordamchi ────────────────────────────────────────────────

function Line({
  icon,
  tone,
  children,
}: {
  icon: 'check' | 'team' | 'wallet' | 'user' | 'warning';
  tone: 'ok' | 'warn' | 'danger' | 'muted';
  children: React.ReactNode;
}) {
  const tones = {
    ok: 'text-ok',
    warn: 'text-warn',
    danger: 'text-danger',
    muted: 'text-faint',
  } as const;

  return (
    <div className="flex items-start gap-2.5">
      <span className={cx('mt-0.5 shrink-0', tones[tone])}>{Icon[icon]({ size: 15 })}</span>
      <span className="text-[13px] leading-relaxed text-muted">{children}</span>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-[14px] bg-surface px-3 py-2">
      <div className="text-[10.5px] font-bold uppercase tracking-[0.07em] text-faint">{label}</div>
      <div className="nums mt-0.5 text-[17px] font-extrabold text-danger">{value}</div>
    </div>
  );
}
