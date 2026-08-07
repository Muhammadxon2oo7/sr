'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { confirmDialog, haptic } from '@/lib/telegram';
import { deadlineText, formatFullDate, money, toDateInput } from '@/lib/format';
import type { AssignmentDto, ClientDto, DeadlineType } from '@/lib/types';
import {
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
import { AnimatePresence } from '@/components/ui/motion';

/**
 * Jamoa sahifasidagi "more" oynasi (buyurtmachi talabi):
 * klient nomi, keyingi dedlayn, bajarilgan/kerak, har bir ish narxi (tahrirlanadi),
 * klientdan olingan pul va shu ishchiga hozir berish kerak bo'lgan summa.
 */
export function AssignmentMoreSheet({
  assignmentId,
  productionId,
  onClose,
}: {
  assignmentId: string | null;
  productionId: string;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const [editingPrice, setEditingPrice] = useState(false);
  const [price, setPrice] = useState('');
  const [editingUnits, setEditingUnits] = useState(false);
  const [units, setUnits] = useState('');
  const [payAmount, setPayAmount] = useState('');
  const [editingDeadline, setEditingDeadline] = useState(false);
  const [dlType, setDlType] = useState<DeadlineType>('ONE_TIME');
  const [dlDate, setDlDate] = useState('');
  const [dlInterval, setDlInterval] = useState('');
  const [dlStart, setDlStart] = useState('');
  const [loadedFor, setLoadedFor] = useState<string | null>(null);

  // Assignment klient kartasi ichida keladi — shuni topib olamiz
  const { data: assignment, isLoading } = useQuery({
    queryKey: ['assignment-more', assignmentId],
    enabled: Boolean(assignmentId),
    queryFn: async () => {
      const clients = await api.get<ClientDto[]>(`/productions/${productionId}/clients`);
      for (const c of clients) {
        const a = c.assignments.find((x) => x.id === assignmentId);
        if (a) return { assignment: a, client: c };
      }
      return null;
    },
  });

  const a: AssignmentDto | undefined = assignment?.assignment;
  const client = assignment?.client;

  if (a && loadedFor !== a.id) {
    setLoadedFor(a.id);
    setPrice(String(a.unitPrice));
    setUnits(String(a.totalUnits));
    setEditingUnits(false);
    setDlType(a.deadlineType);
    setDlDate(toDateInput(a.deadlineDate));
    setDlInterval(a.intervalDays ? String(a.intervalDays) : '');
    setDlStart(toDateInput(a.startDate ?? a.deadlineDate));
    setEditingPrice(false);
    setEditingDeadline(false);
    setPayAmount('');
  }

  function invalidate() {
    void qc.invalidateQueries({ queryKey: ['assignment-more', assignmentId] });
    void qc.invalidateQueries({ queryKey: ['team', productionId] });
    void qc.invalidateQueries({ queryKey: ['clients', productionId] });
    void qc.invalidateQueries({ queryKey: ['dashboard', productionId] });
  }

  const savePrice = useMutation({
    mutationFn: () => api.patch(`/assignments/${a!.id}`, { unitPrice: Number(price) }),
    onSuccess: () => {
      haptic('success');
      setEditingPrice(false);
      setError(null);
      invalidate();
    },
    onError: (err) => setError((err as Error).message),
  });

  const saveDeadline = useMutation({
    mutationFn: () =>
      api.patch(`/assignments/${a!.id}`, {
        deadlineType: dlType,
        deadlineDate:
          dlType === 'ONE_TIME' && dlDate ? new Date(`${dlDate}T12:00:00`).toISOString() : undefined,
        intervalDays: dlType === 'RECURRING' ? Number(dlInterval) : undefined,
        startDate:
          dlType === 'RECURRING' && dlStart
            ? new Date(`${dlStart}T12:00:00`).toISOString()
            : undefined,
      }),
    onSuccess: () => {
      haptic('success');
      setEditingDeadline(false);
      setError(null);
      invalidate();
    },
    onError: (err) => setError((err as Error).message),
  });

  const pay = useMutation({
    mutationFn: () => api.post(`/assignments/${a!.id}/payouts`, { amount: Number(payAmount) }),
    onSuccess: () => {
      haptic('success');
      setPayAmount('');
      setError(null);
      invalidate();
    },
    onError: (err) => {
      haptic('error');
      setError((err as Error).message);
    },
  });

  const saveUnits = useMutation({
    mutationFn: () => api.patch(`/assignments/${a!.id}`, { totalUnits: Number(units) }),
    onSuccess: () => {
      haptic('success');
      setEditingUnits(false);
      setError(null);
      invalidate();
    },
    onError: (err) => setError((err as Error).message),
  });

  /** Xato bosilgan "bajarildi"ni qaytarish */
  const undo = useMutation({
    mutationFn: () => api.post(`/assignments/${a!.id}/undo`),
    onSuccess: () => {
      haptic('warning');
      setError(null);
      invalidate();
    },
    onError: (err) => {
      haptic('error');
      setError((err as Error).message);
    },
  });

  const deletePayout = useMutation({
    mutationFn: (paymentId: string) => api.del(`/payments/${paymentId}`),
    onSuccess: () => {
      haptic('success');
      setError(null);
      invalidate();
    },
    onError: (err) => setError((err as Error).message),
  });

  const complete = useMutation({
    mutationFn: () => api.post(`/assignments/${a!.id}/complete`),
    onSuccess: () => {
      haptic('success');
      setError(null);
      invalidate();
    },
    onError: (err) => setError((err as Error).message),
  });

  return (
    <Sheet open={Boolean(assignmentId)} onClose={onClose} title={a?.clientName ?? 'Klient'}>
      {isLoading || !a || !client ? (
        <div className="space-y-3">
          <Skeleton className="h-24" />
          <Skeleton className="h-32" />
        </div>
      ) : (
        <div className="space-y-4">
          <AnimatePresence>{error && <ErrorBanner message={error} />}</AnimatePresence>

          {/* Klient + ishchi */}
          <Card>
            <div className="text-[20px] font-bold">{a.clientName}</div>
            <div className="text-[13px] text-tg-hint">{a.worker.name} · {a.worker.roleName}</div>
          </Card>

          {/* Keyingi dedlayn */}
          <Card>
            <Row
              left={
                <span className="text-[13px] font-semibold uppercase tracking-wide text-tg-hint">
                  Keyingi {a.unitLabel} dedlayni
                </span>
              }
              right={
                <button
                  className="text-[13px] text-tg-link active:opacity-60"
                  onClick={() => setEditingDeadline((v) => !v)}
                >
                  {editingDeadline ? 'Bekor' : 'edit'}
                </button>
              }
            />
            <div
              className={cx(
                'mt-1 text-[17px] font-semibold',
                a.deadlineStatus === 'overdue'
                  ? 'text-danger'
                  : a.deadlineStatus === 'today'
                    ? 'text-warn'
                    : '',
              )}
            >
              {deadlineText(a.deadlineDate, a.deadlineStatus, a.daysLeft)}
            </div>
            {a.deadlineType === 'RECURRING' && (
              <div className="text-[12px] text-tg-hint">
                Har {a.intervalDays} kunda · boshlanishi {formatFullDate(a.startDate)}
              </div>
            )}

            <AnimatePresence>
              {editingDeadline && (
                <div className="mt-3 space-y-3 border-t border-tg-separator pt-3">
                  <div className="flex gap-2">
                    {(['ONE_TIME', 'RECURRING'] as DeadlineType[]).map((t) => (
                      <button
                        key={t}
                        onClick={() => setDlType(t)}
                        className={cx(
                          'flex-1 rounded-xl border-2 px-3 py-2 text-[13px] font-medium',
                          dlType === t
                            ? 'border-tg-button text-tg-button'
                            : 'border-tg-separator text-tg-hint',
                        )}
                      >
                        {t === 'ONE_TIME' ? 'Keyingi dedlayn' : 'Har N kuni'}
                      </button>
                    ))}
                  </div>

                  {dlType === 'ONE_TIME' ? (
                    <Field label="Sana">
                      <Input type="date" value={dlDate} onChange={(e) => setDlDate(e.target.value)} />
                    </Field>
                  ) : (
                    <>
                      <Field label="Har necha kunda">
                        <Input
                          type="number"
                          min={1}
                          max={365}
                          value={dlInterval}
                          onChange={(e) => setDlInterval(e.target.value)}
                        />
                      </Field>
                      <Field label="Birinchi dedlayn sanasi">
                        <Input
                          type="date"
                          value={dlStart}
                          onChange={(e) => setDlStart(e.target.value)}
                        />
                      </Field>
                    </>
                  )}

                  <Button
                    className="w-full"
                    loading={saveDeadline.isPending}
                    onClick={() => saveDeadline.mutate()}
                  >
                    Saqlash
                  </Button>
                </div>
              )}
            </AnimatePresence>
          </Card>

          {/* Bajarilgan / kerak */}
          <Card>
            <Row
              left={<span className="text-[14px] text-tg-hint">Bajarildi</span>}
              right={
                <div className="flex items-center gap-2">
                  <span className="text-[17px] font-bold tabular-nums">
                    {a.completedUnits} / {a.totalUnits} {a.unitLabel}
                  </span>
                  <button
                    className="text-[13px] text-tg-link active:opacity-60"
                    onClick={() => setEditingUnits((v) => !v)}
                  >
                    {editingUnits ? 'Bekor' : 'edit'}
                  </button>
                </div>
              }
            />
            <div className="mt-2">
              <Progress percent={a.progressPercent} />
            </div>

            {editingUnits && (
              <div className="mt-3 space-y-2 border-t border-tg-separator pt-3">
                <Field label={`Jami necha ${a.unitLabel} kerak`}>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      inputMode="numeric"
                      min={Math.max(1, a.completedUnits)}
                      value={units}
                      onChange={(e) => setUnits(e.target.value)}
                      autoFocus
                    />
                    <Button loading={saveUnits.isPending} onClick={() => saveUnits.mutate()}>
                      Saqlash
                    </Button>
                  </div>
                </Field>
              </div>
            )}

            <div className="mt-3 flex gap-2">
              <Button
                className="flex-1"
                variant="success"
                disabled={a.isFinished || complete.isPending}
                onClick={() => complete.mutate()}
              >
                {a.isFinished ? 'Barchasi bajarilgan ✓' : `✓ Yana bitta ${a.unitLabel}`}
              </Button>
              <Button
                variant="secondary"
                disabled={a.completedUnits === 0 || undo.isPending}
                onClick={async () => {
                  if (!(await confirmDialog('Oxirgi bajarilgan ish qaytarilsinmi?'))) return;
                  undo.mutate();
                }}
              >
                ↩︎ Qaytarish
              </Button>
            </div>
          </Card>

          {/* Har bir ish uchun narx — tahrirlanadi */}
          <Card>
            <Row
              left={
                <span className="text-[14px] text-tg-hint">Har bir {a.unitLabel} uchun</span>
              }
              right={
                <div className="flex items-center gap-2">
                  <span className="text-[17px] font-bold">{money(a.unitPrice)}</span>
                  <button
                    className="text-[13px] text-tg-link active:opacity-60"
                    onClick={() => setEditingPrice((v) => !v)}
                  >
                    {editingPrice ? 'Bekor' : 'edit'}
                  </button>
                </div>
              }
            />
            {editingPrice && (
              <div className="mt-3 flex gap-2 border-t border-tg-separator pt-3">
                <Input
                  type="number"
                  inputMode="decimal"
                  min={0}
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  autoFocus
                />
                <Button loading={savePrice.isPending} onClick={() => savePrice.mutate()}>
                  Saqlash
                </Button>
              </div>
            )}
            <div className="mt-1 text-[12px] text-tg-hint">
              Hammasi bajarilsa: {money(a.plannedAmount)}
            </div>
          </Card>

          {/* Pul */}
          <Card className="space-y-1.5">
            <Row
              left={<span className="text-[14px] text-tg-hint">Bu klientdan olingan pul</span>}
              right={<span className="font-semibold text-ok">{money(client.receivedAmount)}</span>}
            />
            <Row
              left={<span className="text-[14px] text-tg-hint">Ishlab topgani</span>}
              right={<span className="font-semibold">{money(a.owedAmount)}</span>}
            />
            <Row
              left={<span className="text-[14px] text-tg-hint">To&apos;langan</span>}
              right={<span className="font-semibold">{money(a.paidAmount)}</span>}
            />
            <Row
              left={<span className="text-[14px] font-medium">Hozir berish kerak</span>}
              right={
                <span className={cx('text-[19px] font-bold', a.debt > 0 ? 'text-danger' : 'text-ok')}>
                  {money(a.debt)}
                </span>
              }
            />

            {a.debt > 0 && (
              <div className="flex gap-2 pt-2">
                <Input
                  type="number"
                  inputMode="decimal"
                  min={0}
                  max={a.debt}
                  placeholder="To'lov summasi"
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                />
                <Button
                  disabled={!payAmount || Number(payAmount) <= 0}
                  loading={pay.isPending}
                  onClick={() => pay.mutate()}
                >
                  To&apos;lash
                </Button>
              </div>
            )}
            {a.debt > 0 && (
              <button
                className="w-full pt-1 text-[13px] text-tg-link active:opacity-60"
                onClick={() => setPayAmount(String(a.debt))}
              >
                To&apos;liq summani kiritish ({money(a.debt)})
              </button>
            )}
          </Card>

          {a.payouts.length > 0 && (
            <Card className="space-y-2">
              <div className="text-[13px] font-semibold uppercase tracking-wide text-tg-hint">
                To&apos;lovlar tarixi
              </div>
              {a.payouts.map((p) => (
                <Row
                  key={p.id}
                  left={
                    <div>
                      <div className="text-[14px] font-medium">{money(p.amount)}</div>
                      <div className="text-[12px] text-tg-hint">{formatFullDate(p.paidAt)}</div>
                    </div>
                  }
                  right={
                    <button
                      className="text-[13px] text-danger active:opacity-60"
                      onClick={async () => {
                        if (!(await confirmDialog(`${money(p.amount)} to'lov yozuvi o'chirilsinmi?`)))
                          return;
                        deletePayout.mutate(p.id);
                      }}
                    >
                      O&apos;chirish
                    </button>
                  }
                />
              ))}
            </Card>
          )}
        </div>
      )}
    </Sheet>
  );
}
