'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { money, timeLeftText, toDateInput } from '@/lib/format';
import type { DashboardResponse, DeadlineRow } from '@/lib/types';
import {
  Avatar,
  Badge,
  Button,
  Card,
  Dot,
  ErrorBanner,
  Icon,
  Input,
  LoadingScreen,
  LogoMark,
  Section,
  Sheet,
  Stat,
  cx,
} from '@/components/ui';
import { AnimatedItem, AnimatedList, motion, softSpring } from '@/components/ui/motion';

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

  const urgent = deadlines.filter((d) => d.deadlineStatus === 'overdue').length;

  return (
    <div className="space-y-6 px-4 pb-6 pt-3">
      {/* Sarlavha — brend belgisi har ochilganda ko'rinadi */}
      <motion.div
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={softSpring}
        className="flex items-center gap-2.5"
      >
        <LogoMark size={32} />
        <div className="min-w-0 flex-1">
          <div className="eyebrow">Prodakshn</div>
          <div className="truncate text-[17px] font-bold tracking-[-0.02em]">Boshqaruv paneli</div>
        </div>
        {urgent > 0 && (
          <Badge tone="danger" icon="warning">
            {urgent} kechikkan
          </Badge>
        )}
      </motion.div>

      {/* ── Kalit blok: umumiy foyda ─────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 14, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={softSpring}
      >
        <Card tone="ember" className="!p-5">
          {/* Logo suv belgisi — kartaning o'ng qirrasidan chiqib turadi */}
          <LogoMark
            size={168}
            rounded={false}
            className="pointer-events-none absolute -right-10 -top-6 text-white/[0.07]"
          />

          <div className="relative">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-white/70">
                Umumiy foyda
              </span>
              <Badge tone="onEmber" icon="trend">
                {marginPercent}%
              </Badge>
            </div>

            <div
              className={cx(
                'nums mt-2 text-[40px] font-extrabold leading-none',
                stats.profit >= 0 ? 'text-white' : 'text-white/70',
              )}
            >
              {money(stats.profit)}
            </div>

            {/* Foyda qanday hosil bo'lgani — bir qarashda */}
            <div className="mt-5 grid grid-cols-2 gap-2">
              <div className="rounded-2xl bg-white/12 px-3 py-2.5 backdrop-blur-sm">
                <div className="text-[10.5px] font-bold uppercase tracking-[0.1em] text-white/65">
                  Kirim
                </div>
                <div className="nums mt-0.5 text-[15px] font-extrabold text-white">
                  {money(stats.receivedFromClients)}
                </div>
              </div>
              <div className="rounded-2xl bg-black/20 px-3 py-2.5 backdrop-blur-sm">
                <div className="text-[10.5px] font-bold uppercase tracking-[0.1em] text-white/65">
                  Jamoaga
                </div>
                <div className="nums mt-0.5 text-[15px] font-extrabold text-white">
                  {money(stats.owedToTeam)}
                </div>
              </div>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* ── Hajm ko'rsatkichlari ─────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3">
        <Stat icon="clients" label="Klientlar" value={stats.activeClients} />
        <Stat icon="team" label="Jamoa a'zolari" value={stats.teamMembers} />
      </div>

      {/* ── Dedlaynlar ───────────────────────────────────────── */}
      <Section
        title="Yaqinlashayotgan dedlaynlar"
        action={
          deadlines.length > 0 && (
            <span className="nums text-[12px] font-bold text-faint">{deadlines.length}</span>
          )
        }
      >
        {deadlines.length === 0 ? (
          <Card className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-ok/12 text-ok">
              {Icon.check({ size: 19 })}
            </div>
            <div className="text-[14px] text-muted">
              Hammasi joyida — faol dedlaynlar yo&apos;q
            </div>
          </Card>
        ) : (
          <AnimatedList className="space-y-2.5">
            {deadlines.map((d) => (
              <AnimatedItem key={d.assignmentId} className="mb-2.5">
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

  const overdue = row.deadlineStatus === 'overdue';
  const today = row.deadlineStatus === 'today';

  return (
    <Card className={cx('overflow-hidden !p-0', overdue && 'border-danger/30')}>
      {/* Chap qirradagi holat chizig'i — ro'yxatni skanerlashni tezlashtiradi */}
      <div
        className={cx(
          'absolute inset-y-0 left-0 w-[3px]',
          overdue ? 'bg-danger' : today ? 'bg-warn' : 'bg-line-strong',
        )}
      />

      <div className="p-4 pl-[18px]">
        <div className="flex items-center gap-3">
          <Avatar name={row.workerName} size={44} ring={overdue} />

          <div className="min-w-0 flex-1">
            <div className="truncate text-[16px] font-bold tracking-[-0.02em]">
              {row.workerName}
            </div>
            <div className="truncate text-[13px] text-muted">{row.clientName}</div>
          </div>

          <div className="flex shrink-0 items-center gap-1.5">
            {(overdue || today) && <Dot tone={overdue ? 'danger' : 'warn'} />}
            <span
              className={cx(
                'text-[13px] font-bold',
                overdue ? 'text-danger' : today ? 'text-warn' : 'text-muted',
              )}
            >
              {timeLeftText(row.deadlineDate)}
            </span>
          </div>
        </div>

        <div className="mt-3.5 flex gap-2">
          <Button variant="secondary" size="sm" icon="calendar" onClick={onExtend}>
            Cho&apos;zish
          </Button>
          <Button
            variant={remind.isSuccess ? 'success' : 'secondary'}
            size="sm"
            icon={remind.isSuccess ? 'check' : 'send'}
            loading={remind.isPending}
            disabled={remind.isSuccess}
            onClick={() => remind.mutate()}
          >
            {remind.isSuccess ? 'Yuborildi' : 'Eslatish'}
          </Button>
        </div>
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
        {row && (
          <Card tone="flat" className="flex items-center gap-3">
            <Avatar name={row.workerName} size={38} />
            <div className="min-w-0">
              <div className="truncate text-[14px] font-bold">{row.workerName}</div>
              <div className="truncate text-[12px] text-muted">{row.clientName}</div>
            </div>
          </Card>
        )}

        <div>
          <div className="eyebrow mb-2 px-1">Tez tanlash</div>
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
