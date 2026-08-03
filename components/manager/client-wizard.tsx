'use client';

import { useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion, spring, stepVariants } from '@/components/ui/motion';
import { IconCheck, IconTeam } from '@/components/ui/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { haptic } from '@/lib/telegram';
import { money, toDateInput } from '@/lib/format';
import type { AssignmentInput, ClientDto, DeadlineType, TeamOption } from '@/lib/types';
import {
  Avatar,
  Button,
  Card,
  Checkbox,
  EmptyState,
  ErrorBanner,
  Field,
  Input,
  Row,
  Sheet,
  cx,
} from '@/components/ui';

interface Draft extends AssignmentInput {
  name: string;
}

/** Tez tanlash uchun tayyor intervallar (kun) */
const INTERVALS = [{ days: 1 }, { days: 2 }, { days: 7 }];

/** "+ Yangi klient" — bosqichma-bosqich master (TZ 5.4.1). */
export function ClientWizard({
  productionId,
  open,
  onClose,
  onCreated,
}: {
  productionId: string;
  open: boolean;
  onClose: () => void;
  onCreated?: () => void;
}) {
  const qc = useQueryClient();
  const [step, setStep] = useState(0);
  const dir = useRef(1);

  function goStep(next: number) {
    dir.current = next > step ? 1 : -1;
    setStep(next);
  }

  const [name, setName] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [receivedAmount, setReceivedAmount] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [error, setError] = useState<string | null>(null);

  const team = useQuery({
    queryKey: ['team-options', productionId],
    queryFn: () => api.get<TeamOption[]>(`/productions/${productionId}/team/options`),
    enabled: open,
  });

  const create = useMutation({
    mutationFn: (payload: {
      name: string;
      totalAmount: number;
      receivedAmount: number;
      assignments: AssignmentInput[];
    }) =>
      api.post<ClientDto>(`/productions/${productionId}/clients`, payload),
    onSuccess: () => {
      haptic('success');
      void qc.invalidateQueries({ queryKey: ['clients', productionId] });
      void qc.invalidateQueries({ queryKey: ['dashboard', productionId] });
      void qc.invalidateQueries({ queryKey: ['finance', productionId] });
      reset();
      onClose();
      onCreated?.();
    },
    onError: (err) => {
      haptic('error');
      setError((err as Error).message);
    },
  });

  function reset() {
    setStep(0);
    setName('');
    setTotalAmount('');
    setReceivedAmount('');
    setSelected([]);
    setDrafts({});
    setError(null);
  }

  function toggleWorker(w: TeamOption) {
    setSelected((prev) => {
      if (prev.includes(w.userId)) return prev.filter((id) => id !== w.userId);
      setDrafts((d) => ({
        ...d,
        [w.userId]: d[w.userId] ?? {
          userId: w.userId,
          name: w.name,
          unitLabel: 'video',
          totalUnits: 1,
          unitPrice: 0,
          deadlineType: 'ONE_TIME',
          deadlineDate: toDateInput(new Date(Date.now() + 7 * 86400000).toISOString()),
        },
      }));
      return [...prev, w.userId];
    });
  }

  function patchDraft(userId: string, patch: Partial<Draft>) {
    setDrafts((d) => ({ ...d, [userId]: { ...d[userId], ...patch } }));
  }

  const activeDrafts = useMemo(
    () => selected.map((id) => drafts[id]).filter(Boolean),
    [selected, drafts],
  );

  // Hammasi bajarilsa jamoaga to'lanadigan jami summa
  const totalToTeam = activeDrafts.reduce(
    (acc, d) => acc + Number(d.unitPrice || 0) * Number(d.totalUnits || 0),
    0,
  );
  const expectedMargin = Number(totalAmount || 0) - totalToTeam;

  const stepValid = [
    name.trim().length > 0,
    selected.length > 0,
    Number(totalAmount) >= 0 && totalAmount !== '',
    activeDrafts.every(
      (d) =>
        d.totalUnits > 0 &&
        Number(d.unitPrice) > 0 &&
        Boolean(d.deadlineDate) &&
        (d.deadlineType === 'ONE_TIME' || Boolean(d.intervalDays)),
    ),
    true,
  ][step];

  const titles = [
    'Klient nomi',
    'Kim ishlaydi?',
    'Pul',
    'Ish va narx',
    'Tekshirish',
  ];

  function submit() {
    setError(null);
    create.mutate({
      name: name.trim(),
      totalAmount: Number(totalAmount),
      receivedAmount: Number(receivedAmount || 0),
      assignments: activeDrafts.map((d) => ({
        userId: d.userId,
        unitLabel: d.unitLabel?.trim() || 'ish',
        totalUnits: Number(d.totalUnits),
        unitPrice: Number(d.unitPrice),
        deadlineType: d.deadlineType,
        deadlineDate:
          d.deadlineType === 'ONE_TIME' && d.deadlineDate
            ? new Date(`${d.deadlineDate}T12:00:00`).toISOString()
            : undefined,
        intervalDays: d.deadlineType === 'RECURRING' ? Number(d.intervalDays) : undefined,
        // Takrorlanuvchi dedlaynda kiritilgan sana — birinchi dedlayn
        startDate:
          d.deadlineType === 'RECURRING' && d.deadlineDate
            ? new Date(`${d.deadlineDate}T12:00:00`).toISOString()
            : undefined,
      })),
    });
  }

  return (
    <Sheet
      open={open}
      onClose={() => {
        reset();
        onClose();
      }}
      title={`${step + 1}/5 · ${titles[step]}`}
    >
      <div className="space-y-4">
        <div className="flex gap-1.5">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="h-1 flex-1 overflow-hidden rounded-full bg-border">
              <motion.div
                className="h-full rounded-full bg-primary"
                initial={false}
                animate={{ scaleX: i <= step ? 1 : 0 }}
                style={{ originX: 0 }}
                transition={spring}
              />
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait" custom={dir.current} initial={false}>
          <motion.div
            key={step}
            custom={dir.current}
            variants={stepVariants}
            initial="enter"
            animate="center"
            exit="exit"
            className="space-y-4"
          >
        {step === 0 && (
          <Field label="Klient nomi">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Masalan: Coffee House"
              maxLength={80}
              autoFocus
            />
          </Field>
        )}

        {step === 1 && (
          <div className="space-y-2">
            {team.isLoading && <div className="text-fg-muted">Yuklanmoqda…</div>}
            {team.data?.length === 0 && (
              <EmptyState
                icon={<IconTeam size={22} />}
                title="Jamoada hech kim yo'q"
                description="Avval 'Jamoa' bo'limidan taklif havolasini yuboring."
              />
            )}
            {team.data?.map((w) => {
              const on = selected.includes(w.userId);
              return (
                <button
                  key={w.userId}
                  onClick={() => toggleWorker(w)}
                  className={cx(
                    'flex w-full items-center gap-3 rounded-2xl border-2 bg-surface px-3.5 py-3 text-left active:opacity-70',
                    on ? 'border-fg' : 'border-transparent',
                  )}
                >
                  <Avatar name={w.name} photoUrl={w.photoUrl} size={38} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[15px] font-semibold">{w.name}</div>
                    <div className="truncate text-[13px] text-fg-muted">{w.roleLabel}</div>
                  </div>
                  <div
                    className={cx(
                      'flex h-5 w-5 shrink-0 items-center justify-center rounded-[6px] border',
                      on ? 'border-primary bg-primary text-primary-fg' : 'border-border-strong',
                    )}
                  >
                    {on && <IconCheck size={13} strokeWidth={2.5} />}
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {step === 2 && (
          <>
            <Field
              label="Sделка umumiy summasi ($)"
              hint="Klient bilan kelishilgan summa — hali tushgan pul emas."
            >
              <Input
                type="number"
                inputMode="decimal"
                value={totalAmount}
                onChange={(e) => setTotalAmount(e.target.value)}
                placeholder="0"
                min={0}
                autoFocus
              />
            </Field>
          </>
        )}

        {step === 3 && (
          <div className="space-y-3">
            {activeDrafts.map((d) => (
              <Card key={d.userId} className="space-y-3">
                <div className="text-[16px] font-semibold">{d.name}</div>

                <div className="grid grid-cols-2 gap-2">
                  <Field label="Ish birligi">
                    <Input
                      value={d.unitLabel ?? ''}
                      onChange={(e) => patchDraft(d.userId, { unitLabel: e.target.value })}
                      placeholder="video / maket / kun"
                      maxLength={24}
                    />
                  </Field>
                  <Field label="Jami soni">
                    <Input
                      type="number"
                      inputMode="numeric"
                      min={1}
                      value={d.totalUnits}
                      onChange={(e) =>
                        patchDraft(d.userId, { totalUnits: Number(e.target.value) || 0 })
                      }
                    />
                  </Field>
                </div>

                <Field
                  label={`Har bir ${d.unitLabel || 'ish'} uchun narx ($)`}
                  hint={
                    Number(d.unitPrice) > 0
                      ? `Hammasi bajarilsa: ${money(Number(d.unitPrice) * Number(d.totalUnits || 0))}`
                      : 'To\'lash kerak bo\'lgan summa shu narx × bajarilgan ishlar soni bo\'yicha hisoblanadi.'
                  }
                >
                  <Input
                    type="number"
                    inputMode="decimal"
                    min={0}
                    value={d.unitPrice}
                    onChange={(e) => patchDraft(d.userId, { unitPrice: Number(e.target.value) || 0 })}
                  />
                </Field>

                {/* Dedlayn: aniq sana + ixtiyoriy takrorlanish */}
                <div className="space-y-2.5">
                  <Field
                    label="Dedlayn sanasi"
                    hint={
                      d.deadlineType === 'RECURRING'
                        ? 'Birinchi dedlayn. Keyingilari shu sanadan hisoblanadi.'
                        : undefined
                    }
                  >
                    <Input
                      type="date"
                      value={d.deadlineDate ?? ''}
                      onChange={(e) => patchDraft(d.userId, { deadlineDate: e.target.value })}
                    />
                  </Field>

                  <Checkbox
                    checked={d.deadlineType === 'RECURRING'}
                    onChange={(on) =>
                      patchDraft(d.userId, {
                        deadlineType: on ? 'RECURRING' : 'ONE_TIME',
                        intervalDays: on ? (d.intervalDays ?? 2) : undefined,
                      })
                    }
                    label="Takrorlanadigan dedlayn"
                  />

                  {/* Interval faqat checkbox belgilanganda faollashadi */}
                  <div
                    className={cx(
                      'flex items-center gap-2 transition-opacity',
                      d.deadlineType === 'RECURRING' ? 'opacity-100' : 'pointer-events-none opacity-40',
                    )}
                  >
                    <span className="shrink-0 text-[14px]">Har</span>
                    <Input
                      type="number"
                      inputMode="numeric"
                      min={1}
                      max={365}
                      className="w-20 text-center"
                      disabled={d.deadlineType !== 'RECURRING'}
                      value={d.intervalDays ?? ''}
                      onChange={(e) =>
                        patchDraft(d.userId, { intervalDays: Number(e.target.value) || undefined })
                      }
                    />
                    <span className="shrink-0 text-[14px]">kunda</span>

                    <div className="ml-auto flex gap-1.5">
                      {INTERVALS.map((i) => (
                        <button
                          key={i.days}
                          disabled={d.deadlineType !== 'RECURRING'}
                          onClick={() => patchDraft(d.userId, { intervalDays: i.days })}
                          className={cx(
                            'rounded-lg px-2.5 py-1.5 text-[12px] font-medium transition-colors',
                            d.intervalDays === i.days
                              ? 'bg-primary text-primary-fg'
                              : 'bg-muted text-fg-muted',
                          )}
                        >
                          {i.days}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {step === 4 && (
          <div className="space-y-3">
            <Card>
              <Row
                left={<div className="text-[17px] font-bold">{name}</div>}
                right={<div className="text-[17px] font-bold">{money(Number(totalAmount))}</div>}
              />
              <Row
                className="mt-1"
                left={<span className="text-[14px] text-fg-muted">Olingan pul</span>}
                right={
                  <span className="font-semibold text-ok">{money(Number(receivedAmount || 0))}</span>
                }
              />
            </Card>

            {activeDrafts.map((d) => (
              <Card key={d.userId}>
                <Row
                  left={
                    <div className="min-w-0">
                      <div className="truncate text-[15px] font-semibold">{d.name}</div>
                      <div className="text-[13px] text-fg-muted">
                        {d.totalUnits} {d.unitLabel} × {money(Number(d.unitPrice))} ·{' '}
                        {d.deadlineType === 'ONE_TIME'
                          ? d.deadlineDate
                          : `${d.deadlineDate} dan har ${d.intervalDays} kunda`}
                      </div>
                    </div>
                  }
                  right={
                    <div className="font-semibold">
                      {money(Number(d.unitPrice) * Number(d.totalUnits))}
                    </div>
                  }
                />
              </Card>
            ))}

            <Card>
              <Row
                left={<span className="text-[14px] text-fg-muted">Jamoaga jami (hammasi bitsa)</span>}
                right={<span className="font-semibold">{money(totalToTeam)}</span>}
              />
              <Row
                className="mt-1"
                left={<span className="text-[14px] text-fg-muted">Kutilayotgan foyda</span>}
                right={
                  <span
                    className={cx('font-semibold', expectedMargin >= 0 ? 'text-ok' : 'text-danger')}
                  >
                    {money(expectedMargin)}
                  </span>
                }
              />
            </Card>

            <p className="px-1 text-[13px] text-fg-muted">
              Yaratilgach barcha tanlangan ishchilarga bot orqali xabar boradi.
            </p>
          </div>
        )}

          </motion.div>
        </AnimatePresence>

        <AnimatePresence>{error && <ErrorBanner message={error} />}</AnimatePresence>

        <div className="flex gap-2 pt-2">
          {step > 0 && (
            <Button variant="secondary" size="lg" onClick={() => goStep(step - 1)}>
              Orqaga
            </Button>
          )}
          {step < 4 ? (
            <Button size="lg" disabled={!stepValid} onClick={() => goStep(step + 1)}>
              Keyingisi
            </Button>
          ) : (
            <Button size="lg" loading={create.isPending} onClick={submit}>
              Klientni yaratish
            </Button>
          )}
        </div>
      </div>
    </Sheet>
  );
}
