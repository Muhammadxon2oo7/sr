'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { deadlineText, money } from '@/lib/format';
import type { DashboardResponse } from '@/lib/types';
import {
  Avatar,
  Button,
  Card,
  EmptyState,
  LoadingScreen,
  Progress,
  Row,
  Section,
  Stat,
  cx,
} from '@/components/ui';
import { AnimatedItem, AnimatedList } from '@/components/ui/motion';
import { RequestsList } from './requests-list';
import { InviteSheet } from './invite-sheet';
import { ClientWizard } from './client-wizard';
import { ClientSheet } from './client-sheet';

export function HomeTab({
  productionId,
  onOpenClients,
}: {
  productionId: string;
  onOpenClients: () => void;
}) {
  const [inviteOpen, setInviteOpen] = useState(false);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [openClientId, setOpenClientId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['dashboard', productionId],
    queryFn: () => api.get<DashboardResponse>(`/productions/${productionId}/dashboard`),
  });

  if (isLoading || !data) return <LoadingScreen />;

  const { production, stats, deadlines, pendingRequests } = data;

  return (
    <div className="space-y-5 px-4 pb-6 pt-4">
      {/* Prodakshn kartochkasi */}
      <Card>
        <Row
          left={
            <div className="flex items-center gap-3">
              <Avatar name={production.name} photoUrl={production.photoUrl} size={52} />
              <div className="min-w-0">
                <div className="truncate text-[19px] font-bold">{production.name}</div>
                <div className="truncate text-[14px] text-tg-hint">@{production.username}</div>
              </div>
            </div>
          }
          right={
            <Button size="sm" variant="secondary" onClick={() => setInviteOpen(true)}>
              Taklif
            </Button>
          }
        />
      </Card>

      {/* Umumiy ko'rsatkichlar */}
      <Section title="Umumiy">
        <div className="grid grid-cols-2 gap-2">
          <Stat label="Aktiv klientlar" value={stats.activeClients} />
          <Stat label="Jamoa" value={stats.teamMembers} />
          <Stat label="Pul olingan" value={stats.receivedFromClients} format={money} tone="ok" />
          <Stat
            label="Jamoaga to'langan"
            value={stats.paidToTeam}
            format={money}
            hint={
              stats.teamFullyPaid
                ? '✓ to\'liq to\'langan'
                : `${money(stats.debtToTeam)} to\'lanmagan`
            }
            tone={stats.teamFullyPaid ? 'ok' : 'warn'}
          />
        </div>
        <Card className="mt-2">
          <Row
            left={<span className="text-[14px] text-tg-hint">Foyda</span>}
            right={
              <span
                className={cx(
                  'text-[22px] font-bold',
                  stats.profit >= 0 ? 'text-ok' : 'text-danger',
                )}
              >
                {money(stats.profit)}
              </span>
            }
          />
          <div className="mt-1 text-[12px] text-tg-hint">
            {money(stats.receivedFromClients)} olingan − {money(stats.owedToTeam)} jamoaga berish
            kerak
          </div>
        </Card>
      </Section>

      {/* Arizalar */}
      {pendingRequests.length > 0 && (
        <Section title={`📩 A'zolikka arizalar (${pendingRequests.length})`}>
          <RequestsList requests={pendingRequests} productionId={productionId} />
        </Section>
      )}

      {/* Dedlaynlar — eng muhim blok */}
      <Section title="🔥 Yaqinlashayotgan dedlaynlar">
        {deadlines.length === 0 ? (
          <Card>
            <div className="py-2 text-center text-[14px] text-tg-hint">
              Faol dedlaynlar yo&apos;q
            </div>
          </Card>
        ) : (
          <AnimatedList className="space-y-2">
            {deadlines.map((d) => (
              <AnimatedItem key={d.assignmentId} className="mb-2">
              <Card onClick={() => setOpenClientId(d.clientId)}>
                <Row
                  left={
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        {d.deadlineStatus === 'overdue' && <span>⚠️</span>}
                        {d.deadlineStatus === 'today' && <span>🔔</span>}
                        <span className="truncate text-[15px] font-semibold">
                          {d.workerName}{' '}
                          <span className="font-normal text-tg-hint">({d.workerRole})</span>
                        </span>
                      </div>
                      <div className="truncate text-[14px] text-tg-hint">{d.clientName}</div>
                    </div>
                  }
                  right={
                    <div
                      className={cx(
                        'text-[13px] font-medium',
                        d.deadlineStatus === 'overdue'
                          ? 'text-danger'
                          : d.deadlineStatus === 'today'
                            ? 'text-warn'
                            : 'text-tg-hint',
                      )}
                    >
                      {deadlineText(d.deadlineDate, d.deadlineStatus, d.daysLeft)}
                    </div>
                  }
                />
                <div className="mt-2.5 flex items-center gap-2">
                  <Progress percent={(d.completedUnits / Math.max(1, d.totalUnits)) * 100} />
                  <span className="shrink-0 text-[12px] tabular-nums text-tg-hint">
                    {d.completedUnits}/{d.totalUnits} {d.unitLabel}
                  </span>
                </div>
              </Card>
              </AnimatedItem>
            ))}
          </AnimatedList>
        )}
      </Section>

      {stats.activeClients === 0 && (
        <EmptyState
          icon="💼"
          title="Hali klient yo'q"
          description="Birinchi klientni qo'shing va jamoangizga biriktiring."
        />
      )}

      <Button size="lg" onClick={() => setWizardOpen(true)}>
        + Yangi klient
      </Button>

      <InviteSheet
        productionId={productionId}
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
      />
      <ClientWizard
        productionId={productionId}
        open={wizardOpen}
        onClose={() => setWizardOpen(false)}
        onCreated={onOpenClients}
      />
      <ClientSheet
        clientId={openClientId}
        productionId={productionId}
        onClose={() => setOpenClientId(null)}
      />
    </div>
  );
}
