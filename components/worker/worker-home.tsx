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
  EmptyState,
  LoadingScreen,
  Progress,
  Sheet,
  Stat,
  cx,
} from '@/components/ui';
import { AnimatedItem, AnimatedList } from '@/components/ui/motion';
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
    <div className="space-y-5 px-4 pb-6 pt-4">
      <div>
        <h1 className="text-[24px] font-bold">Salom, {data.user.name.split(' ')[0]}</h1>
        <p className="text-[14px] text-tg-hint">{data.user.roleLabel}</p>
      </div>

      {/* Pul jamlanmasi */}
      {hasAnyClient && (
        <div className="grid grid-cols-3 gap-2">
          <Stat label="Ishlangan pul" value={data.totals.owedAmount} format={money} />
          <Stat label="To'langan" value={data.totals.paidAmount} format={money} tone="ok" />
          <Stat
            label="To'lanmagan"
            value={data.totals.debt}
            format={money}
            tone={data.totals.debt > 0 ? 'warn' : 'default'}
          />
        </div>
      )}

      {/* Menejerdan kelgan takliflar */}
      <IncomingInvites />

      {/* Kutilayotgan arizalar */}
      {data.pendingRequests.length > 0 && (
        <Card>
          <div className="text-[14px] font-semibold">⏳ Arizalar javob kutmoqda</div>
          <div className="mt-1 space-y-0.5 text-[13px] text-tg-hint">
            {data.pendingRequests.map((r) => (
              <div key={r.id}>
                {r.productionName} (@{r.productionUsername})
              </div>
            ))}
          </div>
        </Card>
      )}

      {data.groups.length === 0 ? (
        <EmptyState
          icon="🏢"
          title="Siz hali agentlikka a'zo emassiz"
          description="Agentlik nomi bo'yicha qidiring yoki menejerdan taklif kuting."
          action={
            <Button size="lg" onClick={() => setFindOpen(true)}>
              Agentlik topish
            </Button>
          }
        />
      ) : (
        data.groups.map((g) => (
          <section key={g.production.id} className="space-y-2">
            {/* Bitta prodakshn bo'lsa sarlavha ko'rsatilmaydi (TZ 6.1) */}
            {!data.singleProduction && (
              <div className="flex items-center gap-2 px-1">
                <Avatar name={g.production.name} photoUrl={g.production.photoUrl} size={26} />
                <h2 className="text-[15px] font-bold">{g.production.name}</h2>
              </div>
            )}

            {g.clients.length === 0 ? (
              <Card>
                <div className="py-2 text-center text-[14px] text-tg-hint">
                  Bu prodakshnda sizga hali klient biriktirilmagan
                </div>
              </Card>
            ) : (
              <AnimatedList className="space-y-2">
              {g.clients.map((c) => (
                <AnimatedItem key={c.assignmentId} className="mb-2">
                  <ClientCard client={c} onInfo={() => setOpenAssignment(c.assignmentId)} />
                </AnimatedItem>
              ))}
              </AnimatedList>
            )}
          </section>
        ))
      )}

      {data.groups.length > 0 && (
        <Button variant="secondary" size="lg" onClick={() => setFindOpen(true)}>
          Boshqa agentlik topish
        </Button>
      )}

      <Sheet open={findOpen} onClose={() => setFindOpen(false)} title="Agentlik topish">
        <FindProduction onDone={() => setFindOpen(false)} />
      </Sheet>

      <AssignmentDetail
        assignmentId={openAssignment}
        onClose={() => setOpenAssignment(null)}
      />
    </div>
  );
}

/** Ishchining bitta klienti: progress, qolgan vaqt, pul va "+1 bajarildi". */
function ClientCard({
  client: c,
  onInfo,
}: {
  client: WorkerClientRow;
  onInfo: () => void;
}) {
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

  return (
    <Card>
      <div className="flex items-center gap-2">
        <button
          type="button"
          aria-label="Batafsil"
          onClick={onInfo}
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-tg-hint text-[13px] font-semibold text-tg-hint active:opacity-60"
        >
          i
        </button>
        <span className="truncate text-[19px] font-semibold">{c.clientName}</span>
      </div>

      <div className="mt-2 text-right text-[14px] font-medium tabular-nums text-tg-hint">
        {c.completedUnits}/{c.totalUnits}
      </div>
      <div className="mt-1">
        <Progress percent={c.progressPercent} />
      </div>

      <div
        className={cx(
          'mt-3 text-[28px] font-bold',
          c.deadlineStatus === 'overdue'
            ? 'text-danger'
            : c.deadlineStatus === 'today'
              ? 'text-warn'
              : '',
        )}
      >
        {timeLeftText(c.deadlineDate)}
      </div>

      <div className="mt-2 text-[13px] text-tg-hint">
        ishladin {money(c.owedAmount)} · to&apos;landi {money(c.paidAmount)} · to&apos;lanmadi{' '}
        {money(c.debt)}
      </div>

      {error && <div className="mt-2 text-[13px] text-danger">{error}</div>}

      <Button
        className="mt-3 w-full"
        variant="secondary"
        disabled={c.isFinished}
        loading={complete.isPending}
        onClick={() => complete.mutate()}
      >
        {c.isFinished ? 'Hammasi bajarildi ✓' : '+1 bajarildi'}
      </Button>
    </Card>
  );
}
