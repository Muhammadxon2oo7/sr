'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { confirmDialog, haptic } from '@/lib/telegram';
import { deadlineText, formatFullDate, money, toDateInput } from '@/lib/format';
import type { AssignmentDto, ClientDto, DeadlineType } from '@/lib/types';
import {
  Avatar,
  Button,
  Card,
  ErrorBanner,
  Field,
  Input,
  Progress,
  Row,
  Sheet,
  Skeleton,
  cx,
} from '@/components/ui';
import { IconClock, IconPlus } from '@/components/ui/icons';
import { AddWorkerSheet } from './add-worker-sheet';

/** Klient kartasi (TZ 5.4.2). */
export function ClientSheet({
  clientId,
  productionId,
  onClose,
}: {
  clientId: string | null;
  productionId: string;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const [payoutFor, setPayoutFor] = useState<AssignmentDto | null>(null);
  const [incomeOpen, setIncomeOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deadlineFor, setDeadlineFor] = useState<AssignmentDto | null>(null);
  const [addWorkerOpen, setAddWorkerOpen] = useState(false);

  const { data: client, isLoading } = useQuery({
    queryKey: ['client', clientId],
    queryFn: () => api.get<ClientDto>(`/clients/${clientId}`),
    enabled: Boolean(clientId),
  });

  function invalidate() {
    void qc.invalidateQueries({ queryKey: ['client', clientId] });
    void qc.invalidateQueries({ queryKey: ['clients', productionId] });
    void qc.invalidateQueries({ queryKey: ['dashboard', productionId] });
    void qc.invalidateQueries({ queryKey: ['team', productionId] });
    void qc.invalidateQueries({ queryKey: ['finance', productionId] });
  }

  /** Ishchini shu klientdan olib tashlash (qolganlari ro'yxat bilan yuboriladi) */
  const removeWorker = useMutation({
    mutationFn: (assignmentId: string) =>
      api.patch(`/clients/${clientId}`, {
        assignments: client!.assignments
          .filter((x) => x.id !== assignmentId)
          .map((x) => ({
            userId: x.worker.id,
            unitLabel: x.unitLabel,
            totalUnits: x.totalUnits,
            unitPrice: x.unitPrice,
            deadlineType: x.deadlineType,
            deadlineDate: x.deadlineDate ?? undefined,
            intervalDays: x.intervalDays ?? undefined,
            startDate: x.startDate ?? undefined,
          })),
      }),
    onSuccess: () => {
      haptic('success');
      setError(null);
      invalidate();
    },
    onError: (err) => {
      haptic('error');
      setError((err as Error).message);
    },
  });

  const toggleArchive = useMutation({
    mutationFn: (archived: boolean) => api.patch(`/clients/${clientId}`, { archived }),
    onSuccess: () => {
      haptic('success');
      invalidate();
    },
    onError: (err) => setError((err as Error).message),
  });

  const remove = useMutation({
    mutationFn: () => api.del(`/clients/${clientId}`),
    onSuccess: () => {
      haptic('success');
      invalidate();
      onClose();
    },
    onError: (err) => setError((err as Error).message),
  });

  return (
    <>
      <Sheet open={Boolean(clientId)} onClose={onClose} title={client?.name ?? 'Klient'}>
        {isLoading || !client ? (
          <div className="space-y-3">
            <Skeleton className="h-24" />
            <Skeleton className="h-32" />
          </div>
        ) : (
          <div className="space-y-4">
            {error && <ErrorBanner message={error} />}

            {/* Umumiy holat */}
            <Card>
              <Row
                left={<span className="text-[14px] text-fg-muted">Kelishilgan summa</span>}
                right={<span className="text-[17px] font-bold">{money(client.totalAmount)}</span>}
              />
              <Row
                className="mt-2"
                left={<span className="text-[14px] text-fg-muted">Klientdan tushdi</span>}
                right={<span className="font-semibold text-ok">{money(client.receivedAmount)}</span>}
              />
              <Row
                className="mt-1"
                left={<span className="text-[14px] text-fg-muted">Qolgan (klientdan)</span>}
                right={<span className="font-semibold">{money(client.remainingFromClient)}</span>}
              />
              <Button className="mt-3 w-full" variant="secondary" onClick={() => setIncomeOpen(true)}>
                Klientdan to&apos;lov qayd etish
              </Button>
            </Card>

            {/* Ishchilar */}
            <div className="space-y-2">
              <div className="px-1 text-[13px] font-semibold uppercase tracking-wide text-fg-muted">
                Ishchilar
              </div>
              {client.assignments.map((a) => (
                <Card key={a.id} className="space-y-3">
                  <Row
                    left={
                      <div className="flex items-center gap-2.5">
                        <Avatar name={a.worker.name} photoUrl={a.worker.photoUrl} size={36} />
                        <div className="min-w-0">
                          <div className="truncate text-[15px] font-semibold">{a.worker.name}</div>
                          <div className="truncate text-[12px] text-fg-muted">{a.worker.roleName}</div>
                        </div>
                      </div>
                    }
                    right={
                      <div className="text-[12px] tabular-nums text-fg-muted">
                        {a.completedUnits}/{a.totalUnits} {a.unitLabel}
                      </div>
                    }
                  />

                  <Progress percent={a.progressPercent} />

                  <div className="grid grid-cols-4 gap-1.5 text-center">
                    <MiniStat label={`1 ${a.unitLabel}`} value={money(a.unitPrice)} />
                    <MiniStat label="Ishlab topdi" value={money(a.owedAmount)} />
                    <MiniStat label="To'landi" value={money(a.paidAmount)} tone="ok" />
                    <MiniStat
                      label="Berish kerak"
                      value={money(a.debt)}
                      tone={a.debt > 0 ? 'danger' : 'default'}
                    />
                  </div>

                  <button
                    onClick={() => setDeadlineFor(a)}
                    className={cx(
                      'w-full rounded-xl bg-muted px-3 py-2 text-left text-[13px] active:opacity-70',
                      a.deadlineStatus === 'overdue' && 'text-danger',
                      a.deadlineStatus === 'today' && 'text-warn',
                    )}
                  >
                    <IconClock size={13} className="mr-1 inline-block align-[-2px]" />
                    {a.deadlineType === 'RECURRING'
                      ? `Har ${a.intervalDays} kunda — keyingisi: ${deadlineText(a.deadlineDate, a.deadlineStatus, a.daysLeft)}`
                      : deadlineText(a.deadlineDate, a.deadlineStatus, a.daysLeft)}
                    <span className="float-right text-fg">o&apos;zgartirish</span>
                  </button>

                  <Button
                    variant="secondary"
                    className="w-full"
                    disabled={a.debt <= 0}
                    onClick={() => setPayoutFor(a)}
                  >
                    To&apos;lov qayd etish
                  </Button>

                  <button
                    className="w-full text-[12px] text-danger active:opacity-60"
                    onClick={async () => {
                      const warn =
                        a.paidAmount > 0
                          ? `${a.worker.name} olib tashlansa, unga qayd etilgan ${money(a.paidAmount)} to'lov ham o'chadi. Davom etilsinmi?`
                          : `${a.worker.name} shu klientdan olib tashlansinmi?`;
                      if (!(await confirmDialog(warn))) return;
                      removeWorker.mutate(a.id);
                    }}
                  >
                    Ishchini olib tashlash
                  </button>
                </Card>
              ))}

              <Button
                variant="outline"
                className="w-full"
                icon={<IconPlus size={16} />}
                onClick={() => setAddWorkerOpen(true)}
              >
                Ishchi biriktirish
              </Button>
            </div>

            {/* Jamlanma */}
            <Card>
              <Row
                left={<span className="text-[14px] text-fg-muted">Jamoaga berish kerak</span>}
                right={<span className="font-semibold">{money(client.owedToTeam)}</span>}
              />
              <Row
                className="mt-1"
                left={<span className="text-[14px] text-fg-muted">Jamoaga to&apos;langan</span>}
                right={<span className="font-semibold">{money(client.paidToTeam)}</span>}
              />
              <Row
                className="mt-1"
                left={<span className="text-[14px] text-fg-muted">Foyda</span>}
                right={
                  <span className={cx('font-bold', client.margin >= 0 ? 'text-ok' : 'text-danger')}>
                    {money(client.margin)}
                  </span>
                }
              />
            </Card>

            {/* To'lovlar tarixi */}
            {client.incomePayments.length > 0 && (
              <div className="space-y-2">
                <div className="px-1 text-[13px] font-semibold uppercase tracking-wide text-fg-muted">
                  Klientdan tushumlar
                </div>
                {client.incomePayments.map((p) => (
                  <Card key={p.id}>
                    <Row
                      left={
                        <div>
                          <div className="text-[15px] font-semibold">{money(p.amount)}</div>
                          <div className="text-[12px] text-fg-muted">
                            {formatFullDate(p.paidAt)}
                            {p.note ? ` · ${p.note}` : ''}
                          </div>
                        </div>
                      }
                      right={
                        <button
                          className="text-[13px] text-danger active:opacity-60"
                          onClick={async () => {
                            if (!(await confirmDialog('To\'lov yozuvi o\'chirilsinmi?'))) return;
                            await api.del(`/payments/${p.id}`);
                            invalidate();
                          }}
                        >
                          O&apos;chirish
                        </button>
                      }
                    />
                  </Card>
                ))}
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <Button variant="secondary" className="flex-1" onClick={() => setEditOpen(true)}>
                Tahrirlash
              </Button>
              <Button
                variant="secondary"
                className="flex-1"
                loading={toggleArchive.isPending}
                onClick={() => toggleArchive.mutate(!client.archived)}
              >
                {client.archived ? 'Arxivdan chiqarish' : 'Arxivlash'}
              </Button>
              <Button
                variant="danger"
                className="flex-1"
                onClick={async () => {
                  if (!(await confirmDialog(`"${client.name}" o'chirilsinmi? Barcha ma'lumotlar yo'qoladi.`)))
                    return;
                  remove.mutate();
                }}
              >
                O&apos;chirish
              </Button>
            </div>
          </div>
        )}
      </Sheet>

      <PayoutSheet
        assignment={payoutFor}
        onClose={() => setPayoutFor(null)}
        onDone={() => {
          setPayoutFor(null);
          invalidate();
        }}
      />

      <IncomeSheet
        clientId={clientId}
        remaining={client?.remainingFromClient ?? 0}
        open={incomeOpen}
        onClose={() => setIncomeOpen(false)}
        onDone={() => {
          setIncomeOpen(false);
          invalidate();
        }}
      />

      <DeadlineSheet
        assignment={deadlineFor}
        onClose={() => setDeadlineFor(null)}
        onDone={() => {
          setDeadlineFor(null);
          invalidate();
        }}
      />

      {client && (
        <AddWorkerSheet
          client={client}
          productionId={productionId}
          open={addWorkerOpen}
          onClose={() => setAddWorkerOpen(false)}
        />
      )}

      {client && (
        <EditClientSheet
          client={client}
          open={editOpen}
          onClose={() => setEditOpen(false)}
          onDone={() => {
            setEditOpen(false);
            invalidate();
          }}
        />
      )}
    </>
  );
}

function MiniStat({
  label,
  value,
  tone = 'default',
}: {
  label: string;
  value: string;
  tone?: 'default' | 'ok' | 'danger';
}) {
  return (
    <div className="rounded-xl bg-muted px-2 py-2">
      <div className="text-[11px] text-fg-muted">{label}</div>
      <div
        className={cx(
          'text-[14px] font-bold tabular-nums',
          tone === 'ok' && 'text-ok',
          tone === 'danger' && 'text-danger',
        )}
      >
        {value}
      </div>
    </div>
  );
}

// ── To'lov qayd etish (ishchiga) ──────────────────────────────

function PayoutSheet({
  assignment,
  onClose,
  onDone,
}: {
  assignment: AssignmentDto | null;
  onClose: () => void;
  onDone: () => void;
}) {
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);

  const save = useMutation({
    mutationFn: () =>
      api.post(`/assignments/${assignment!.id}/payouts`, {
        amount: Number(amount),
        note: note.trim() || undefined,
      }),
    onSuccess: () => {
      haptic('success');
      setAmount('');
      setNote('');
      setError(null);
      onDone();
    },
    onError: (err) => {
      haptic('error');
      setError((err as Error).message);
    },
  });

  return (
    <Sheet open={Boolean(assignment)} onClose={onClose} title="To'lovni qayd etish">
      {assignment && (
        <div className="space-y-4">
          <Card>
            <Row
              left={<span className="text-[14px] text-fg-muted">{assignment.worker.name}</span>}
              right={<span className="font-semibold text-danger">Qarz: {money(assignment.debt)}</span>}
            />
          </Card>

          <Field label="Summa ($)">
            <Input
              type="number"
              inputMode="decimal"
              min={0}
              max={assignment.debt}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
              autoFocus
            />
          </Field>

          <Field label="Izoh (ixtiyoriy)">
            <Input value={note} onChange={(e) => setNote(e.target.value)} maxLength={200} />
          </Field>

          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setAmount(String(assignment.debt))}>
              To&apos;liq qarz
            </Button>
          </div>

          {error && <ErrorBanner message={error} />}

          <Button
            size="lg"
            loading={save.isPending}
            disabled={!amount || Number(amount) <= 0}
            onClick={() => save.mutate()}
          >
            Saqlash
          </Button>
        </div>
      )}
    </Sheet>
  );
}

// ── Klientdan tushum ──────────────────────────────────────────

function IncomeSheet({
  clientId,
  remaining,
  open,
  onClose,
  onDone,
}: {
  clientId: string | null;
  remaining: number;
  open: boolean;
  onClose: () => void;
  onDone: () => void;
}) {
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);

  const save = useMutation({
    mutationFn: () =>
      api.post(`/clients/${clientId}/payments`, {
        amount: Number(amount),
        note: note.trim() || undefined,
      }),
    onSuccess: () => {
      haptic('success');
      setAmount('');
      setNote('');
      setError(null);
      onDone();
    },
    onError: (err) => {
      haptic('error');
      setError((err as Error).message);
    },
  });

  return (
    <Sheet open={open} onClose={onClose} title="Klientdan tushgan pul">
      <div className="space-y-4">
        <Field label="Summa ($)" hint={`Kelishuv bo'yicha qolgan: ${money(remaining)}`}>
          <Input
            type="number"
            inputMode="decimal"
            min={0}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0"
            autoFocus
          />
        </Field>
        <Field label="Izoh (ixtiyoriy)">
          <Input value={note} onChange={(e) => setNote(e.target.value)} maxLength={200} />
        </Field>

        {error && <ErrorBanner message={error} />}

        <Button
          size="lg"
          loading={save.isPending}
          disabled={!amount || Number(amount) <= 0}
          onClick={() => save.mutate()}
        >
          Saqlash
        </Button>
      </div>
    </Sheet>
  );
}

// ── Dedlaynni o'zgartirish ────────────────────────────────────

function DeadlineSheet({
  assignment,
  onClose,
  onDone,
}: {
  assignment: AssignmentDto | null;
  onClose: () => void;
  onDone: () => void;
}) {
  const [type, setType] = useState<DeadlineType>('ONE_TIME');
  const [date, setDate] = useState('');
  const [interval, setInterval] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [initialized, setInitialized] = useState<string | null>(null);

  if (assignment && initialized !== assignment.id) {
    setInitialized(assignment.id);
    setType(assignment.deadlineType);
    setDate(toDateInput(assignment.deadlineDate));
    setInterval(assignment.intervalDays ? String(assignment.intervalDays) : '');
  }

  const save = useMutation({
    mutationFn: () =>
      api.patch(`/assignments/${assignment!.id}`, {
        deadlineType: type,
        deadlineDate:
          type === 'ONE_TIME' && date ? new Date(`${date}T12:00:00`).toISOString() : undefined,
        intervalDays: type === 'RECURRING' ? Number(interval) : undefined,
      }),
    onSuccess: () => {
      haptic('success');
      setError(null);
      onDone();
    },
    onError: (err) => {
      haptic('error');
      setError((err as Error).message);
    },
  });

  return (
    <Sheet open={Boolean(assignment)} onClose={onClose} title="Dedlayn">
      <div className="space-y-4">
        <div className="flex gap-2">
          {(['ONE_TIME', 'RECURRING'] as DeadlineType[]).map((t) => (
            <button
              key={t}
              onClick={() => setType(t)}
              className={cx(
                'flex-1 rounded-xl border-2 px-3 py-2.5 text-[14px] font-medium',
                type === t ? 'border-fg text-fg' : 'border-border text-fg-muted',
              )}
            >
              {t === 'ONE_TIME' ? 'Keyingi ish' : 'Har N kunda'}
            </button>
          ))}
        </div>

        {type === 'ONE_TIME' ? (
          <Field label="Sana">
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </Field>
        ) : (
          <Field label="Interval (kun)" hint="Keyingi dedlayn har safar avtomatik hisoblanadi.">
            <Input
              type="number"
              inputMode="numeric"
              min={1}
              max={365}
              value={interval}
              onChange={(e) => setInterval(e.target.value)}
            />
          </Field>
        )}

        {error && <ErrorBanner message={error} />}

        <Button
          size="lg"
          loading={save.isPending}
          disabled={type === 'ONE_TIME' ? !date : !interval}
          onClick={() => save.mutate()}
        >
          Saqlash
        </Button>
      </div>
    </Sheet>
  );
}

// ── Klientni tahrirlash ───────────────────────────────────────

function EditClientSheet({
  client,
  open,
  onClose,
  onDone,
}: {
  client: ClientDto;
  open: boolean;
  onClose: () => void;
  onDone: () => void;
}) {
  const [name, setName] = useState(client.name);
  const [total, setTotal] = useState(String(client.totalAmount));
  const [error, setError] = useState<string | null>(null);

  const save = useMutation({
    mutationFn: () =>
      api.patch(`/clients/${client.id}`, { name: name.trim(), totalAmount: Number(total) }),
    onSuccess: () => {
      haptic('success');
      onDone();
    },
    onError: (err) => setError((err as Error).message),
  });

  return (
    <Sheet open={open} onClose={onClose} title="Klientni tahrirlash">
      <div className="space-y-4">
        <Field label="Nomi">
          <Input value={name} onChange={(e) => setName(e.target.value)} maxLength={80} />
        </Field>
        <Field label="Umumiy summa ($)">
          <Input
            type="number"
            inputMode="decimal"
            min={0}
            value={total}
            onChange={(e) => setTotal(e.target.value)}
          />
        </Field>
        {error && <ErrorBanner message={error} />}
        <Button size="lg" loading={save.isPending} onClick={() => save.mutate()}>
          Saqlash
        </Button>
      </div>
    </Sheet>
  );
}
