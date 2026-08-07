'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { haptic } from '@/lib/telegram';
import { formatFullDate, money, timeLeftText, toDateInput } from '@/lib/format';
import type { AssignmentDto, ClientDto, DeadlineType } from '@/lib/types';
import {
  Button,
  Card,
  ErrorBanner,
  Field,
  Input,
  Progress,
  Sheet,
  Skeleton,
  cx,
} from '@/components/ui';
import { AnimatePresence } from '@/components/ui/motion';

/**
 * Jamoa sahifasidagi "more" oynasi: dedlayn, progress, narx va to'lov.
 * Har bir qiymat yonidagi ✏️ tugmasi shu qiymatning tahrir formasini ochadi.
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
  const [editing, setEditing] = useState<'deadline' | 'units' | 'price' | 'pay' | null>(null);
  const [price, setPrice] = useState('');
  const [units, setUnits] = useState('');
  const [payAmount, setPayAmount] = useState('');
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
        if (a) return a;
      }
      return null;
    },
  });

  const a: AssignmentDto | null | undefined = assignment;

  if (a && loadedFor !== a.id) {
    setLoadedFor(a.id);
    setPrice(String(a.unitPrice));
    setUnits(String(a.totalUnits));
    setDlType(a.deadlineType);
    setDlDate(toDateInput(a.deadlineDate));
    setDlInterval(a.intervalDays ? String(a.intervalDays) : '');
    setDlStart(toDateInput(a.startDate ?? a.deadlineDate));
    setPayAmount('');
    setEditing(null);
  }

  function invalidate() {
    void qc.invalidateQueries({ queryKey: ['assignment-more', assignmentId] });
    void qc.invalidateQueries({ queryKey: ['team', productionId] });
    void qc.invalidateQueries({ queryKey: ['clients', productionId] });
    void qc.invalidateQueries({ queryKey: ['dashboard', productionId] });
  }

  function onSaved() {
    haptic('success');
    setEditing(null);
    setError(null);
    invalidate();
  }

  function onFailed(err: unknown) {
    haptic('error');
    setError((err as Error).message);
  }

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
    onSuccess: onSaved,
    onError: onFailed,
  });

  const saveUnits = useMutation({
    mutationFn: () => api.patch(`/assignments/${a!.id}`, { totalUnits: Number(units) }),
    onSuccess: onSaved,
    onError: onFailed,
  });

  const savePrice = useMutation({
    mutationFn: () => api.patch(`/assignments/${a!.id}`, { unitPrice: Number(price) }),
    onSuccess: onSaved,
    onError: onFailed,
  });

  const pay = useMutation({
    mutationFn: () => api.post(`/assignments/${a!.id}/payouts`, { amount: Number(payAmount) }),
    onSuccess: () => {
      setPayAmount('');
      onSaved();
    },
    onError: onFailed,
  });

  function toggle(section: typeof editing) {
    setError(null);
    setEditing((cur) => (cur === section ? null : section));
  }

  return (
    <Sheet open={Boolean(assignmentId)} onClose={onClose} title={a?.clientName ?? 'Klient'}>
      {isLoading || !a ? (
        <div className="space-y-3">
          <Skeleton className="h-24" />
          <Skeleton className="h-32" />
        </div>
      ) : (
        <div className="space-y-5">
          <AnimatePresence>{error && <ErrorBanner message={error} />}</AnimatePresence>

          {/* Dedlayn */}
          <Card>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-[13px] text-tg-hint">dedlayn</div>
                <div
                  className={cx(
                    'mt-0.5 text-[24px] font-bold',
                    a.deadlineStatus === 'overdue'
                      ? 'text-danger'
                      : a.deadlineStatus === 'today'
                        ? 'text-warn'
                        : '',
                  )}
                >
                  {timeLeftText(a.deadlineDate)}
                </div>
                {a.deadlineType === 'RECURRING' && (
                  <div className="mt-0.5 text-[12px] text-tg-hint">
                    Har {a.intervalDays} kunda · {formatFullDate(a.startDate)} dan
                  </div>
                )}
              </div>
              <EditButton onClick={() => toggle('deadline')} />
            </div>

            {editing === 'deadline' && (
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
          </Card>

          {/* Progress */}
          <div>
            <div className="flex items-center justify-end gap-2">
              <span className="text-[20px] font-bold tabular-nums">
                {a.completedUnits}/{a.totalUnits}
              </span>
              <EditButton onClick={() => toggle('units')} />
            </div>
            <div className="mt-2">
              <Progress percent={a.progressPercent} />
            </div>

            {editing === 'units' && (
              <div className="mt-3">
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
          </div>

          {/* Har bir ish narxi */}
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[15px]">
                Xar bir {a.unitLabel} narxi:{' '}
                <span className="font-semibold">{money(a.unitPrice)}</span>
              </span>
              <EditButton onClick={() => toggle('price')} />
            </div>

            {editing === 'price' && (
              <div className="mt-3 flex gap-2">
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
          </div>

          {/* Pul */}
          <div className="grid grid-cols-2 gap-3">
            <Card>
              <div className="text-[13px] text-tg-hint">To&apos;lash kerak</div>
              <div
                className={cx(
                  'mt-1 text-[22px] font-bold',
                  a.debt > 0 ? 'text-danger' : 'text-ok',
                )}
              >
                {money(a.debt)}
              </div>
            </Card>
            <Card>
              <div className="text-[13px] text-tg-hint">To&apos;langan</div>
              <div className="mt-1 text-[22px] font-bold">{money(a.paidAmount)}</div>
            </Card>
          </div>

          {editing === 'pay' ? (
            <div className="flex gap-2">
              <Input
                type="number"
                inputMode="decimal"
                min={0}
                max={a.debt}
                placeholder={`Summa (${money(a.debt)} gacha)`}
                value={payAmount}
                onChange={(e) => setPayAmount(e.target.value)}
                autoFocus
              />
              <Button
                disabled={!payAmount || Number(payAmount) <= 0}
                loading={pay.isPending}
                onClick={() => pay.mutate()}
              >
                Saqlash
              </Button>
            </div>
          ) : (
            <Button
              size="lg"
              disabled={a.debt <= 0}
              onClick={() => {
                setPayAmount(String(a.debt));
                toggle('pay');
              }}
            >
              To&apos;lash
            </Button>
          )}
        </div>
      )}
    </Sheet>
  );
}

function EditButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      aria-label="Tahrirlash"
      onClick={() => {
        haptic('light');
        onClick();
      }}
      className="shrink-0 text-[18px] leading-none active:opacity-60"
    >
      ✏️
    </button>
  );
}
