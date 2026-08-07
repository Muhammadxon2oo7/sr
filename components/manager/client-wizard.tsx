'use client';

import { useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion, spring, stepVariants } from '@/components/ui/motion';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { haptic } from '@/lib/telegram';
import { money, toDateTimeInput } from '@/lib/format';
import type { AssignmentInput, ClientDto, DeadlineType, TeamOption } from '@/lib/types';
import {
  Avatar,
  Button,
  Card,
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
          unitLabel: 'ish',
          totalUnits: 1,
          unitPrice: 0,
          deadlineType: 'ONE_TIME',
          deadlineDate: toDateTimeInput(new Date(Date.now() + 7 * 86400000).toISOString()),
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
        (d.deadlineType === 'ONE_TIME' || Number(d.intervalDays) > 0),
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
      assignments: activeDrafts.map((d) => {
        // Bitta datetime maydoni: bir martalik uchun dedlayn, takrorlanuvchi uchun birinchi sana
        const at = d.deadlineDate ? new Date(d.deadlineDate).toISOString() : undefined;
        return {
          userId: d.userId,
          unitLabel: d.unitLabel?.trim() || 'ish',
          totalUnits: Number(d.totalUnits),
          unitPrice: Number(d.unitPrice),
          deadlineType: d.deadlineType,
          deadlineDate: d.deadlineType === 'ONE_TIME' ? at : undefined,
          intervalDays: d.deadlineType === 'RECURRING' ? Number(d.intervalDays) : undefined,
          startDate: d.deadlineType === 'RECURRING' ? at : undefined,
        };
      }),
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
            <div key={i} className="h-1 flex-1 overflow-hidden rounded-full bg-tg-separator">
              <motion.div
                className="h-full rounded-full bg-tg-button"
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
            {team.isLoading && <div className="text-tg-hint">Yuklanmoqda…</div>}
            {team.data?.length === 0 && (
              <EmptyState
                icon="👥"
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
                    'flex w-full items-center gap-3 rounded-2xl border-2 bg-tg-section px-3.5 py-3 text-left active:opacity-70',
                    on ? 'border-tg-button' : 'border-transparent',
                  )}
                >
                  <Avatar name={w.name} photoUrl={w.photoUrl} size={38} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[15px] font-semibold">{w.name}</div>
                    <div className="truncate text-[13px] text-tg-hint">{w.roleLabel}</div>
                  </div>
                  <div
                    className={cx(
                      'flex h-5 w-5 items-center justify-center rounded-md border-2 text-[12px] font-bold text-white',
                      on ? 'border-tg-button bg-tg-button' : 'border-tg-separator',
                    )}
                  >
                    {on ? '✓' : ''}
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
          <div className="space-y-4">
            {activeDrafts.map((d) => {
              const recurring = d.deadlineType === 'RECURRING';
              return (
                <Card key={d.userId} className="space-y-4">
                  <div className="text-[18px] font-semibold">{d.name}</div>

                  <div className="grid grid-cols-2 gap-2">
                    <Field label="Jami qilinadigan ish soni">
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
                    <Field label="Har bir ish narxi">
                      <Input
                        type="number"
                        inputMode="decimal"
                        min={0}
                        value={d.unitPrice}
                        onChange={(e) =>
                          patchDraft(d.userId, { unitPrice: Number(e.target.value) || 0 })
                        }
                      />
                    </Field>
                  </div>

                  <div className="space-y-2">
                    <div className="text-[18px] font-semibold">Dedlayn</div>
                    <Input
                      type="datetime-local"
                      value={d.deadlineDate ?? ''}
                      onChange={(e) => patchDraft(d.userId, { deadlineDate: e.target.value })}
                    />

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        aria-label="Takrorlanuvchi dedlayn"
                        onClick={() =>
                          patchDraft(d.userId, {
                            deadlineType: (recurring
                              ? 'ONE_TIME'
                              : 'RECURRING') as DeadlineType,
                            intervalDays: recurring ? undefined : (d.intervalDays ?? 2),
                          })
                        }
                        className={cx(
                          'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border-2 text-[18px] font-bold text-white',
                          recurring ? 'border-ok bg-ok' : 'border-tg-separator',
                        )}
                      >
                        {recurring ? '✓' : ''}
                      </button>
                      <div className="flex flex-1 items-center gap-2">
                        <span className="text-[15px]">Har</span>
                        <Input
                          type="number"
                          inputMode="numeric"
                          min={1}
                          max={365}
                          disabled={!recurring}
                          value={d.intervalDays ?? ''}
                          onChange={(e) =>
                            patchDraft(d.userId, {
                              intervalDays: Number(e.target.value) || undefined,
                            })
                          }
                        />
                        <span className="text-[15px]">kun</span>
                      </div>
                    </div>

                    <p className="text-[13px] leading-snug text-tg-hint">
                      O&apos;chiq bo&apos;lsa tanlab bo&apos;lmaydi. Yoniq bo&apos;lsa har N kuni
                      dedlayn avtomatik belgilanadi.
                    </p>
                  </div>
                </Card>
              );
            })}
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
                left={<span className="text-[14px] text-tg-hint">Olingan pul</span>}
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
                      <div className="text-[13px] text-tg-hint">
                        {d.totalUnits} {d.unitLabel} × {money(Number(d.unitPrice))} ·{' '}
                        {d.deadlineType === 'ONE_TIME'
                          ? d.deadlineDate
                          : `har ${d.intervalDays} kunda (${d.deadlineDate} dan)`}
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
                left={<span className="text-[14px] text-tg-hint">Jamoaga jami (hammasi bitsa)</span>}
                right={<span className="font-semibold">{money(totalToTeam)}</span>}
              />
              <Row
                className="mt-1"
                left={<span className="text-[14px] text-tg-hint">Kutilayotgan foyda</span>}
                right={
                  <span
                    className={cx('font-semibold', expectedMargin >= 0 ? 'text-ok' : 'text-danger')}
                  >
                    {money(expectedMargin)}
                  </span>
                }
              />
            </Card>

            <p className="px-1 text-[13px] text-tg-hint">
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
