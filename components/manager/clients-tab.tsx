'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { money } from '@/lib/format';
import type { ClientDto, TeamOption } from '@/lib/types';
import {
  Button,
  Card,
  Chip,
  EmptyState,
  Icon,
  IconButton,
  LoadingScreen,
  PageHeader,
  Progress,
  Ring,
} from '@/components/ui';
import { AnimatedItem, AnimatedList } from '@/components/ui/motion';
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

  const totalAmount = data?.reduce((sum, c) => sum + c.totalAmount, 0) ?? 0;

  return (
    <div className="space-y-4 px-4 pb-6 pt-3">
      <PageHeader
        title="Klientlar"
        subtitle={data?.length ? `${data.length} ta loyiha · ${money(totalAmount)}` : undefined}
        right={
          <IconButton icon="plus" tone="brand" label="Yangi klient" onClick={() => setWizardOpen(true)} />
        }
      />

      {/* Ishchi bo'yicha filtr — gorizontal sirg'aluvchi lenta */}
      {(team.data?.length ?? 0) > 0 && (
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 pt-1">
          <Chip active={workerId === null} onClick={() => setWorkerId(null)} layoutId="client-filter">
            Hammasi
          </Chip>
          {team.data?.map((w) => (
            <Chip
              key={w.userId}
              active={workerId === w.userId}
              onClick={() => setWorkerId(w.userId)}
              layoutId="client-filter"
            >
              {w.name}
            </Chip>
          ))}
        </div>
      )}

      {isLoading ? (
        <LoadingScreen />
      ) : !data || data.length === 0 ? (
        <EmptyState
          icon="clients"
          title={workerId ? 'Bu ishchida klient yo\'q' : 'Hali klient yo\'q'}
          description={
            workerId
              ? 'Boshqa ishchini tanlang yoki filtrni tozalang.'
              : 'Birinchi klientni qo\'shing va jamoangizga biriktiring.'
          }
          action={
            !workerId && (
              <Button size="lg" icon="plus" onClick={() => setWizardOpen(true)}>
                Yangi klient
              </Button>
            )
          }
        />
      ) : (
        <AnimatedList key={workerId ?? 'all'} className="space-y-2.5">
          {data.map((c) => (
            <AnimatedItem key={c.id} className="mb-2.5">
              <Card onClick={() => setOpenClientId(c.id)}>
                <div className="flex items-start gap-3.5">
                  <Ring percent={c.progressPercent} size={48}>
                    {c.progressPercent >= 100 ? Icon.check({ size: 16 }) : `${Math.round(c.progressPercent)}%`}
                  </Ring>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="truncate text-[17px] font-bold tracking-[-0.02em]">
                        {c.name}
                      </span>
                      <span className="nums shrink-0 text-[16px] font-extrabold">
                        {money(c.totalAmount)}
                      </span>
                    </div>

                    <div className="mt-1 flex items-center justify-between gap-2 text-[12.5px] text-muted">
                      <span className="truncate">
                        {c.assignments.map((a) => a.worker.name).join(', ') ||
                          'Ishchi biriktirilmagan'}
                      </span>
                      <span className="nums shrink-0 font-semibold">
                        {c.completedUnits}/{c.totalUnits}
                      </span>
                    </div>

                    <div className="mt-2.5">
                      <Progress percent={c.progressPercent} height={5} />
                    </div>
                  </div>
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
