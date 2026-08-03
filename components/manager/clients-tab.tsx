'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { deadlineText, money } from '@/lib/format';
import type { ClientDto, TeamOption } from '@/lib/types';
import {
  Button,
  Card,
  EmptyState,
  LoadingScreen,
  Progress,
  Row,
  cx,
} from '@/components/ui';
import { AnimatedItem, AnimatedList, motion, spring } from '@/components/ui/motion';
import { IconAlert, IconClients, IconClock, IconPlus } from '@/components/ui/icons';
import { ClientWizard } from './client-wizard';
import { ClientSheet } from './client-sheet';

/** Klientlar tab'i — tekis ro'yxat + ishchi bo'yicha filtr (TZ 5.4). */
export function ClientsTab({ productionId }: { productionId: string }) {
  const [workerId, setWorkerId] = useState<string | null>(null);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [openClientId, setOpenClientId] = useState<string | null>(null);

  const team = useQuery({
    queryKey: ['team-options', productionId],
    queryFn: () => api.get<TeamOption[]>(`/productions/${productionId}/team/options`),
  });

  const { data, isLoading } = useQuery({
    queryKey: ['clients', productionId, workerId],
    queryFn: () =>
      api.get<ClientDto[]>(
        `/productions/${productionId}/clients${workerId ? `?workerId=${workerId}` : ''}`,
      ),
  });

  return (
    <div className="space-y-4 px-4 pb-6 pt-4">
      <h1 className="text-[24px] font-bold">Klientlar</h1>

      {/* Ishchi bo'yicha filtr */}
      {(team.data?.length ?? 0) > 0 && (
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
          <FilterChip active={workerId === null} onClick={() => setWorkerId(null)}>
            Hammasi
          </FilterChip>
          {team.data?.map((w) => (
            <FilterChip
              key={w.userId}
              active={workerId === w.userId}
              onClick={() => setWorkerId(w.userId)}
            >
              {w.name}
            </FilterChip>
          ))}
        </div>
      )}

      {/* Filtrdan keyin — yangi klient qo'shish */}
      <Button size="lg" icon={<IconPlus size={17} />} onClick={() => setWizardOpen(true)}>
        Yangi klient
      </Button>

      {isLoading ? (
        <LoadingScreen />
      ) : !data || data.length === 0 ? (
        <EmptyState
          icon={<IconClients size={22} />}
          title={workerId ? 'Bu ishchida klient yo\'q' : 'Hali klient yo\'q'}
          description={
            workerId ? undefined : 'Birinchi klientni qo\'shing va jamoangizga biriktiring.'
          }
          action={
            !workerId && (
              <Button size="lg" icon={<IconPlus size={17} />} onClick={() => setWizardOpen(true)}>
                Yangi klient
              </Button>
            )
          }
        />
      ) : (
        <AnimatedList key={workerId ?? 'all'} className="space-y-2">
          {data.map((c) => (
            <AnimatedItem key={c.id} className="mb-2">
            <Card onClick={() => setOpenClientId(c.id)}>
              <Row
                left={
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      {c.deadlineStatus === 'overdue' && (
                        <IconAlert size={15} className="shrink-0 text-danger" />
                      )}
                      <span className="truncate text-[17px] font-semibold">{c.name}</span>
                      {c.archived && (
                        <span className="rounded bg-muted px-1.5 text-[11px] text-fg-muted">
                          arxiv
                        </span>
                      )}
                    </div>
                    <div className="truncate text-[13px] text-fg-muted">
                      {c.assignments.map((a) => a.worker.name).join(', ') || 'Ishchi biriktirilmagan'}
                    </div>
                  </div>
                }
                right={
                  <div>
                    <div
                      className={cx('text-[17px] font-bold', c.margin >= 0 ? 'text-ok' : 'text-danger')}
                    >
                      {money(c.margin)}
                    </div>
                    <div className="text-[11px] text-fg-muted">foyda</div>
                  </div>
                }
              />

              <div className="mt-2.5 flex items-center gap-2">
                <Progress percent={c.progressPercent} />
                <span className="shrink-0 text-[12px] tabular-nums text-fg-muted">
                  {c.completedUnits}/{c.totalUnits}
                </span>
              </div>

              {/* olingan pul − berish kerak = foyda */}
              <div className="mt-2 flex items-center justify-between text-[12px]">
                <span className="text-fg-muted">
                  Olingan <b className="text-ok">{money(c.receivedAmount)}</b>
                </span>
                <span className="text-fg-muted">
                  Berish kerak <b className="text-fg">{money(c.owedToTeam)}</b>
                </span>
              </div>

              {c.nextDeadline && (
                <div
                  className={cx(
                    'mt-2 flex items-center gap-1.5 text-[12px]',
                    c.deadlineStatus === 'overdue'
                      ? 'text-danger'
                      : c.deadlineStatus === 'today'
                        ? 'text-warn'
                        : 'text-fg-muted',
                  )}
                >
                  <IconClock size={13} />
                  {deadlineText(c.nextDeadline, c.deadlineStatus)}
                </div>
              )}
            </Card>
            </AnimatedItem>
          ))}
        </AnimatedList>
      )}

      <ClientWizard
        productionId={productionId}
        open={wizardOpen}
        onClose={() => setWizardOpen(false)}
      />
      <ClientSheet
        clientId={openClientId}
        productionId={productionId}
        onClose={() => setOpenClientId(null)}
      />
    </div>
  );
}

function FilterChip({
  children,
  active,
  onClick,
}: {
  children: React.ReactNode;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <motion.button
      onClick={onClick}
      whileTap={{ scale: 0.94 }}
      transition={spring}
      className={cx(
        'relative shrink-0 rounded-full px-3.5 py-1.5 text-[13px] font-medium transition-colors',
        active ? 'text-primary-fg' : 'bg-surface text-fg-muted',
      )}
    >
      {/* Faol filtr foni bir chipdan ikkinchisiga sirg'aladi */}
      {active && (
        <motion.span
          layoutId="filter-chip"
          transition={spring}
          className="absolute inset-0 -z-10 rounded-full bg-primary"
        />
      )}
      {children}
    </motion.button>
  );
}
