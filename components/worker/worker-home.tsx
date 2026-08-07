'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { deadlineText, money } from '@/lib/format';
import type { WorkerDashboard } from '@/lib/types';
import {
  Avatar,
  Button,
  Card,
  EmptyState,
  LoadingScreen,
  Progress,
  Row,
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
                <Card onClick={() => setOpenAssignment(c.assignmentId)}>
                  <Row
                    left={
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          {c.deadlineStatus === 'overdue' && <span>⚠️</span>}
                          {c.deadlineStatus === 'today' && <span>🔔</span>}
                          <span className="truncate text-[17px] font-semibold">{c.clientName}</span>
                        </div>
                        <div className="text-[13px] text-tg-hint">
                          {c.totalUnits} {c.unitLabel}dan {c.completedUnits}tasi bitdi
                        </div>
                      </div>
                    }
                    right={
                      <div>
                        <div className={cx('text-[16px] font-bold', c.debt > 0 ? 'text-warn' : 'text-ok')}>
                          {money(c.debt)}
                        </div>
                        <div className="text-[11px] text-tg-hint">to&apos;lanmagan</div>
                      </div>
                    }
                  />

                  <div className="mt-2.5">
                    <Progress percent={c.progressPercent} />
                  </div>

                  <div className="mt-2 flex items-center justify-between text-[12px]">
                    <span
                      className={cx(
                        c.deadlineStatus === 'overdue'
                          ? 'text-danger'
                          : c.deadlineStatus === 'today'
                            ? 'text-warn'
                            : 'text-tg-hint',
                      )}
                    >
                      ⏰ {deadlineText(c.deadlineDate, c.deadlineStatus, c.daysLeft)}
                    </span>
                    <span className="text-tg-hint">
                      ishlandi {money(c.owedAmount)} · to&apos;landi {money(c.paidAmount)}
                    </span>
                  </div>
                </Card>
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
