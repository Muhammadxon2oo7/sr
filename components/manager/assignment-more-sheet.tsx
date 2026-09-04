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
  Icon,
  IconButton,
  Input,
  NumberInput,
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
                <div className="eyebrow">Dedlayn</div>
                <div
                  className={cx(
                    'mt-1 text-[24px] font-extrabold tracking-[-0.03em]',
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
                  <div className="mt-0.5 text-[12px] text-muted">
                    Har {a.intervalDays} kunda · {formatFullDate(a.startDate)} dan
                  </div>
                )}
              </div>
              <EditButton onClick={() => toggle('deadline')} />
            </div>

            {editing === 'deadline' && (
              <div className="mt-3.5 space-y-3 border-t border-line pt-3.5">
                <div className="flex gap-2">
                  {(['ONE_TIME', 'RECURRING'] as DeadlineType[]).map((t) => (
                    <button
                      key={t}
                      onClick={() => setDlType(t)}
                      className={cx(
                        'flex-1 rounded-xl border px-3 py-2.5 text-[13px] font-bold transition-colors',
                        dlType === t
                          ? 'border-brand bg-brand/10 text-brand'
                          : 'border-line text-muted',
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
                      <NumberInput
                        value={dlInterval === '' ? undefined : Number(dlInterval)}
                        onValueChange={(v) => setDlInterval(v === undefined ? '' : String(v))}
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
            <div className="flex items-center gap-2">
              <span className="eyebrow flex-1">Bajarilgan</span>
              <span className="nums text-[18px] font-extrabold">
                {a.completedUnits}
                <span className="text-faint">/{a.totalUnits}</span>
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
                    <NumberInput
                      value={units === '' ? undefined : Number(units)}
                      onValueChange={(v) => setUnits(v === undefined ? '' : String(v))}
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
            <div className="hairline flex items-center gap-2 rounded-2xl bg-surface px-4 py-3">
              <span className="flex-1 text-[13.5px] text-muted">
                Har bir {a.unitLabel} narxi
              </span>
              <span className="nums text-[16px] font-extrabold">{money(a.unitPrice)}</span>
              <EditButton onClick={() => toggle('price')} />
            </div>

            {editing === 'price' && (
              <div className="mt-3 flex gap-2">
                <NumberInput
                  decimal
                  value={price === '' ? undefined : Number(price)}
                  onValueChange={(v) => setPrice(v === undefined ? '' : String(v))}
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
              <div className="flex items-center gap-1.5 text-muted">
                {Icon.clock({ size: 13 })}
                <span className="text-[11.5px] font-semibold">To&apos;lash kerak</span>
              </div>
              <div
                className={cx(
                  'nums mt-1 text-[21px] font-extrabold',
                  a.debt > 0 ? 'text-danger' : 'text-ok',
                )}
              >
                {money(a.debt)}
              </div>
            </Card>
            <Card>
              <div className="flex items-center gap-1.5 text-muted">
                {Icon.check({ size: 13 })}
                <span className="text-[11.5px] font-semibold">To&apos;langan</span>
              </div>
              <div className="nums mt-1 text-[21px] font-extrabold">{money(a.paidAmount)}</div>
            </Card>
          </div>

          {editing === 'pay' ? (
            <div className="flex gap-2">
              <NumberInput
                decimal
                placeholder={`Summa (${money(a.debt)} gacha)`}
                value={payAmount === '' ? undefined : Number(payAmount)}
                onValueChange={(v) => setPayAmount(v === undefined ? '' : String(v))}
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
              icon="wallet"
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
  return <IconButton icon="edit" size={32} label="Tahrirlash" onClick={onClick} />;
}
