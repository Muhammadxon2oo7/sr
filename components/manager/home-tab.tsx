'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { money, timeLeftText, toDateInput } from '@/lib/format';
import type { DashboardResponse, DeadlineRow } from '@/lib/types';
import {
  Avatar,
  Button,
  Card,
  ErrorBanner,
  Input,
  LoadingScreen,
  Section,
  Sheet,
  cx,
} from '@/components/ui';
import { AnimatedItem, AnimatedList } from '@/components/ui/motion';

export function HomeTab({ productionId }: { productionId: string }) {
  const [extending, setExtending] = useState<DeadlineRow | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['dashboard', productionId],
    queryFn: () => api.get<DashboardResponse>(`/productions/${productionId}/dashboard`),
  });

  if (isLoading || !data) return <LoadingScreen />;

  const { stats, deadlines } = data;
  const marginPercent =
    stats.receivedFromClients > 0
      ? Math.round((stats.profit / stats.receivedFromClients) * 100)
      : 0;

  return (
    <div className="space-y-5 px-4 pb-6 pt-4">
      {/* Umumiy foyda */}
      <Card>
        <div className="text-[13px] text-tg-hint">Umumiy foyda</div>
        <div className="mt-1.5 flex items-center gap-2.5">
          <span
            className={cx(
              'text-[34px] font-bold leading-none tabular-nums',
              stats.profit >= 0 ? 'text-tg-text' : 'text-danger',
            )}
          >
            {money(stats.profit)}
          </span>
          <span className="rounded-lg bg-tg-secondary px-2 py-1 text-[13px] font-medium text-tg-hint">
            {marginPercent}%
          </span>
        </div>
        <div className="mt-2 text-[13px] text-tg-hint">
          {money(stats.receivedFromClients)} − {money(stats.owedToTeam)}
        </div>
      </Card>

      {/* Klientlar va jamoa */}
      <div className="grid grid-cols-2 gap-3">
        <Card>
          <div className="text-[13px] text-tg-hint">Jami klientlar</div>
          <div className="mt-1.5 text-[28px] font-bold leading-none tabular-nums">
            {stats.activeClients}
          </div>
        </Card>
        <Card>
          <div className="text-[13px] text-tg-hint">Jamoa</div>
          <div className="mt-1.5 text-[28px] font-bold leading-none tabular-nums">
            {stats.teamMembers}
          </div>
        </Card>
      </div>

      {/* Yaqinlashayotgan dedlaynlar */}
      <Section title="Yaqinlashayotgan dedlaynlar">
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
                <DeadlineCard
                  row={d}
                  productionId={productionId}
                  onExtend={() => setExtending(d)}
                />
              </AnimatedItem>
            ))}
          </AnimatedList>
        )}
      </Section>

      <ExtendSheet
        row={extending}
        productionId={productionId}
        onClose={() => setExtending(null)}
      />
    </div>
  );
}

function DeadlineCard({
  row,
  productionId,
  onExtend,
}: {
  row: DeadlineRow;
  productionId: string;
  onExtend: () => void;
}) {
  const qc = useQueryClient();

  const remind = useMutation({
    mutationFn: () => api.post(`/assignments/${row.assignmentId}/remind`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['dashboard', productionId] }),
  });

  return (
    <Card>
      <div className="flex items-center gap-3">
        <Avatar name={row.workerName} size={44} />
        <div className="min-w-0 flex-1">
          <div className="truncate text-[17px] font-semibold">{row.workerName}</div>
          <div className="truncate text-[14px] text-tg-hint">{row.clientName}</div>
        </div>
        <div
          className={cx(
            'shrink-0 text-[13px] font-medium',
            row.deadlineStatus === 'overdue'
              ? 'text-danger'
              : row.deadlineStatus === 'today'
                ? 'text-warn'
                : 'text-tg-hint',
          )}
        >
          {timeLeftText(row.deadlineDate)}
        </div>
      </div>

      <div className="mt-3 flex gap-2">
        <Button variant="secondary" size="sm" onClick={onExtend}>
          Cho&apos;zish
        </Button>
        <Button
          variant="secondary"
          size="sm"
          loading={remind.isPending}
          disabled={remind.isSuccess}
          onClick={() => remind.mutate()}
        >
          {remind.isSuccess ? 'Yuborildi' : 'Eslatish'}
        </Button>
      </div>
    </Card>
  );
}

/** Dedlaynni yangi sanaga surish. */
function ExtendSheet({
  row,
  productionId,
  onClose,
}: {
  row: DeadlineRow | null;
  productionId: string;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const [date, setDate] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Sheet ochilganda joriy dedlayn sanasi bilan to'ldiriladi
  const [lastId, setLastId] = useState<string | null>(null);
  if (row && row.assignmentId !== lastId) {
    setLastId(row.assignmentId);
    setDate(toDateInput(row.deadlineDate));
    setError(null);
  }

  const save = useMutation({
    mutationFn: (iso: string) =>
      api.patch(`/assignments/${row!.assignmentId}`, {
        deadlineDate: iso,
        startDate: iso,
      }),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['dashboard', productionId] });
      onClose();
    },
    onError: (err: Error) => setError(err.message),
  });

  function shift(days: number) {
    const base = row?.deadlineDate ? new Date(row.deadlineDate) : new Date();
    const from = base.getTime() < Date.now() ? new Date() : base;
    from.setDate(from.getDate() + days);
    setDate(toDateInput(from.toISOString()));
  }

  return (
    <Sheet open={!!row} onClose={onClose} title="Dedlaynni cho'zish">
      <div className="space-y-4">
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={() => shift(1)}>
            +1 kun
          </Button>
          <Button variant="secondary" size="sm" onClick={() => shift(3)}>
            +3 kun
          </Button>
          <Button variant="secondary" size="sm" onClick={() => shift(7)}>
            +1 hafta
          </Button>
        </div>

        <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />

        {error && <ErrorBanner message={error} />}

        <Button
          size="lg"
          loading={save.isPending}
          disabled={!date}
          onClick={() => {
            setError(null);
            save.mutate(new Date(`${date}T12:00:00`).toISOString());
          }}
        >
          Saqlash
        </Button>
      </div>
    </Sheet>
  );
}
