'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { haptic } from '@/lib/telegram';
import { money, timeLeftText } from '@/lib/format';
import type { WorkerClientRow, WorkerDashboard } from '@/lib/types';
import {
  Avatar,
  Button,
  Card,
  Dot,
  EmptyState,
  Icon,
  IconButton,
  LoadingScreen,
  LogoMark,
  Progress,
  Sheet,
  cx,
} from '@/components/ui';
import { AnimatedItem, AnimatedList, motion, softSpring, spring } from '@/components/ui/motion';
import { FindProduction } from '@/components/onboarding/find-production';
import { AssignmentDetail } from './assignment-detail';
import { IncomingInvites } from './incoming-invites';

/** Ishchi bosh sahifasi (TZ 6.1). */
export function WorkerHome() {
  const [findOpen, setFindOpen] = useState(false);
  const [openAssignment, setOpenAssignment] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['worker-dashboard'],
    queryFn: () => api.get<WorkerDashboard>('/me/dashboard'),
  });

  if (isLoading || !data) return <LoadingScreen />;

  const hasAnyClient = data.groups.some((g) => g.clients.length > 0);

  return (
    <div className="space-y-6 px-4 pb-6 pt-3">
      {/* ── Salomlashuv ──────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={softSpring}
        className="flex items-center gap-3"
      >
        <LogoMark size={34} />
        <div className="min-w-0 flex-1">
          <div className="eyebrow">{data.user.roleLabel}</div>
          <h1 className="truncate text-[24px] font-extrabold leading-tight tracking-[-0.035em]">
            Salom, {data.user.name.split(' ')[0]}
          </h1>
        </div>
      </motion.div>

      {/* ── Pul jamlanmasi ───────────────────────────────────── */}
      {hasAnyClient && (
        <motion.div
          initial={{ opacity: 0, y: 12, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={softSpring}
        >
          <Card tone="ember" className="!p-5">
            <LogoMark
              size={160}
              rounded={false}
              className="pointer-events-none absolute -right-9 -top-5 text-white/[0.07]"
            />
            <div className="relative">
              <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-white/70">
                To&apos;lanmagan
              </div>
              <div className="nums mt-1.5 text-[38px] font-extrabold leading-none text-white">
                {money(data.totals.debt)}
              </div>

              <div className="mt-5 grid grid-cols-2 gap-2">
                <div className="rounded-2xl bg-white/12 px-3 py-2.5 backdrop-blur-sm">
                  <div className="text-[10.5px] font-bold uppercase tracking-[0.1em] text-white/65">
                    Ishlangan
                  </div>
                  <div className="nums mt-0.5 text-[15px] font-extrabold text-white">
                    {money(data.totals.owedAmount)}
                  </div>
                </div>
                <div className="rounded-2xl bg-black/20 px-3 py-2.5 backdrop-blur-sm">
                  <div className="text-[10.5px] font-bold uppercase tracking-[0.1em] text-white/65">
                    Olingan
                  </div>
                  <div className="nums mt-0.5 text-[15px] font-extrabold text-white">
                    {money(data.totals.paidAmount)}
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>
      )}

      {/* Menejerdan kelgan takliflar */}
      <IncomingInvites />

      {/* Kutilayotgan arizalar */}
      {data.pendingRequests.length > 0 && (
        <Card className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-warn/12 text-warn">
            {Icon.clock({ size: 17 })}
          </div>
          <div className="min-w-0">
            <div className="text-[14px] font-bold">Arizalar javob kutmoqda</div>
            <div className="mt-0.5 space-y-0.5 text-[12.5px] text-muted">
              {data.pendingRequests.map((r) => (
                <div key={r.id} className="truncate">
                  {r.productionName} (@{r.productionUsername})
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      {data.groups.length === 0 ? (
        <EmptyState
          icon="film"
          title="Siz hali agentlikka a'zo emassiz"
          description="Agentlik nomi bo'yicha qidiring yoki menejerdan taklif kuting."
          action={
            <Button size="lg" icon="search" onClick={() => setFindOpen(true)}>
              Agentlik topish
            </Button>
          }
        />
      ) : (
        data.groups.map((g) => (
          <section key={g.production.id} className="space-y-2.5">
            {/* Bitta prodakshn bo'lsa sarlavha ko'rsatilmaydi (TZ 6.1) */}
            {!data.singleProduction && (
              <div className="flex items-center gap-2 px-1">
                <Avatar name={g.production.name} photoUrl={g.production.photoUrl} size={24} />
                <h2 className="eyebrow !text-muted">{g.production.name}</h2>
              </div>
            )}

            {g.clients.length === 0 ? (
              <Card tone="flat">
                <div className="py-1 text-center text-[13.5px] text-faint">
                  Bu prodakshnda sizga hali klient biriktirilmagan
                </div>
              </Card>
            ) : (
              <AnimatedList className="space-y-2.5">
                {g.clients.map((c) => (
                  <AnimatedItem key={c.assignmentId} className="mb-2.5">
                    <ClientCard client={c} onInfo={() => setOpenAssignment(c.assignmentId)} />
                  </AnimatedItem>
                ))}
              </AnimatedList>
            )}
          </section>
        ))
      )}

      {data.groups.length > 0 && (
        <Button variant="secondary" size="lg" icon="search" onClick={() => setFindOpen(true)}>
          Boshqa agentlik topish
        </Button>
      )}

      <Sheet open={findOpen} onClose={() => setFindOpen(false)} title="Agentlik topish">
        <FindProduction onDone={() => setFindOpen(false)} />
      </Sheet>

      <AssignmentDetail assignmentId={openAssignment} onClose={() => setOpenAssignment(null)} />
    </div>
  );
}

/**
 * Ishchining bitta klienti.
 * Kartaning yuragi — "+1 bajarildi": u eng katta, eng oson tegiladigan
 * element, chunki ishchi kuniga eng ko'p shuni bosadi.
 */
function ClientCard({ client: c, onInfo }: { client: WorkerClientRow; onInfo: () => void }) {
  const qc = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  const complete = useMutation({
    mutationFn: () => api.post(`/assignments/${c.assignmentId}/complete`),
    onSuccess: () => {
      haptic('success');
      setError(null);
      void qc.invalidateQueries({ queryKey: ['worker-dashboard'] });
    },
    onError: (err) => {
      haptic('error');
      setError((err as Error).message);
    },
  });

  const overdue = c.deadlineStatus === 'overdue';
  const today = c.deadlineStatus === 'today';

  return (
    <Card className={cx('overflow-hidden !p-0', overdue && 'border-danger/30')}>
      <div
        className={cx(
          'absolute inset-y-0 left-0 w-[3px]',
          c.isFinished ? 'bg-ok' : overdue ? 'bg-danger' : today ? 'bg-warn' : 'bg-line-strong',
        )}
      />

      <div className="p-4 pl-[18px]">
        <div className="flex items-start gap-2.5">
          <div className="min-w-0 flex-1">
            <div className="truncate text-[18px] font-extrabold tracking-[-0.03em]">
              {c.clientName}
            </div>

            {/* Qolgan vaqt — ishchi uchun eng muhim signal */}
            <div className="mt-1 flex items-center gap-1.5">
              {(overdue || today) && !c.isFinished && <Dot tone={overdue ? 'danger' : 'warn'} />}
              <span
                className={cx(
                  'text-[14px] font-bold',
                  c.isFinished
                    ? 'text-ok'
                    : overdue
                      ? 'text-danger'
                      : today
                        ? 'text-warn'
                        : 'text-muted',
                )}
              >
                {c.isFinished ? 'Yakunlandi' : timeLeftText(c.deadlineDate)}
              </span>
            </div>
          </div>

          <IconButton icon="info" size={32} label="Batafsil" onClick={onInfo} />
        </div>

        {/* Progress */}
        <div className="mt-3.5">
          <div className="mb-1.5 flex items-baseline justify-between">
            <span className="eyebrow">Bajarilgan</span>
            <span className="nums text-[13px] font-bold">
              {c.completedUnits}
              <span className="text-faint">/{c.totalUnits}</span>
            </span>
          </div>
          <Progress percent={c.progressPercent} />
        </div>

        {/* Pul — uch ustunli mikro-jadval */}
        <div className="mt-3.5 grid grid-cols-3 gap-2 rounded-2xl bg-sunk px-3 py-2.5">
          <MoneyCell label="Ishlangan" value={money(c.owedAmount)} />
          <MoneyCell label="To'landi" value={money(c.paidAmount)} tone="ok" />
          <MoneyCell label="Qoldi" value={money(c.debt)} tone={c.debt > 0 ? 'warn' : 'muted'} />
        </div>

        {error && <div className="mt-2.5 text-[12.5px] font-medium text-danger">{error}</div>}

        {/* Asosiy amal */}
        <motion.button
          whileTap={c.isFinished ? undefined : { scale: 0.97 }}
          transition={spring}
          disabled={c.isFinished || complete.isPending}
          onClick={() => complete.mutate()}
          className={cx(
            'mt-3.5 flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-[15.5px] font-extrabold tracking-[-0.01em] transition-opacity',
            c.isFinished
              ? 'bg-ok/12 text-ok'
              : 'ember text-white shadow-glow disabled:opacity-50',
          )}
        >
          {complete.isPending ? (
            <motion.span
              className="block h-[1.1em] w-[1.1em] rounded-full border-2 border-current border-t-transparent"
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 0.7, ease: 'linear' }}
            />
          ) : c.isFinished ? (
            <>
              {Icon.check({ size: 18 })} Hammasi bajarildi
            </>
          ) : (
            <>
              {Icon.plus({ size: 18, strokeWidth: 2.5 })} 1 ta bajarildi
            </>
          )}
        </motion.button>
      </div>
    </Card>
  );
}

function MoneyCell({
  label,
  value,
  tone = 'muted',
}: {
  label: string;
  value: string;
  tone?: 'muted' | 'ok' | 'warn';
}) {
  const tones = { muted: 'text-ink', ok: 'text-ok', warn: 'text-warn' } as const;
  return (
    <div className="min-w-0">
      <div className="truncate text-[10px] font-bold uppercase tracking-[0.07em] text-faint">
        {label}
      </div>
      <div className={cx('nums truncate text-[13.5px] font-extrabold', tones[tone])}>{value}</div>
    </div>
  );
}
