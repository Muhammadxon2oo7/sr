'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { money } from '@/lib/format';
import type { ClientDto, TeamOption } from '@/lib/types';
import { Button, Card, EmptyState, LoadingScreen, Progress, cx } from '@/components/ui';
import { AnimatedItem, AnimatedList, motion, spring } from '@/components/ui/motion';
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

      <Button size="lg" variant="secondary" onClick={() => setWizardOpen(true)}>
        yangi klient
      </Button>

      {isLoading ? (
        <LoadingScreen />
      ) : !data || data.length === 0 ? (
        <EmptyState
          icon="💼"
          title={workerId ? 'Bu ishchida klient yo\'q' : 'Hali klient yo\'q'}
          description={
            workerId ? undefined : 'Birinchi klientni qo\'shing va jamoangizga biriktiring.'
          }
          action={
            !workerId && (
              <Button size="lg" onClick={() => setWizardOpen(true)}>
                + Yangi klient
              </Button>
            )
          }
        />
      ) : (
        <AnimatedList key={workerId ?? 'all'} className="space-y-2">
          {data.map((c) => (
            <AnimatedItem key={c.id} className="mb-2">
            <Card onClick={() => setOpenClientId(c.id)}>
              <div className="flex items-baseline justify-between gap-3">
                <span className="truncate text-[20px] font-semibold">{c.name}</span>
                <span className="shrink-0 text-[22px] font-bold tabular-nums">
                  {money(c.totalAmount)}
                </span>
              </div>

              <div className="mt-2 text-right text-[14px] font-medium tabular-nums text-tg-hint">
                {c.completedUnits}/{c.totalUnits}
              </div>
              <div className="mt-1">
                <Progress percent={c.progressPercent} />
              </div>

              <div className="mt-3 truncate text-[14px] text-tg-hint">
                {c.assignments.map((a) => a.worker.name).join(', ') || 'Ishchi biriktirilmagan'}
              </div>
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
        active ? 'text-tg-button-text' : 'bg-tg-section text-tg-hint',
      )}
    >
      {/* Faol filtr foni bir chipdan ikkinchisiga sirg'aladi */}
      {active && (
        <motion.span
          layoutId="filter-chip"
          transition={spring}
          className="absolute inset-0 -z-10 rounded-full bg-tg-button"
        />
      )}
      {children}
    </motion.button>
  );
}
