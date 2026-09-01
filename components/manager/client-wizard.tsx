'use client';

import { useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion, spring, stepVariants } from '@/components/ui/motion';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { haptic } from '@/lib/telegram';
import { money, toDateInput } from '@/lib/format';
import type { AssignmentInput, ClientDto, DeadlineType, TeamOption } from '@/lib/types';
import {
  Avatar,
  Button,
  Card,
  EmptyState,
  ErrorBanner,
  Field,
  Icon,
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
        // Kun tanlanadi, vaqt esa peshinga qo'yiladi. Yarim tundagi
        // dedlayn o'sha kunning o'zida darhol "muddati o'tdi" bo'lib
        // qolardi — peshin butun kun davomida "bugun" bo'lib turadi.
        const at = d.deadlineDate
          ? new Date(`${d.deadlineDate}T12:00:00`).toISOString()
          : undefined;
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
            <div key={i} className="h-1.5 flex-1 overflow-hidden rounded-full bg-sunk">
              <motion.div
                className="ember h-full rounded-full"
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
            {team.isLoading && <div className="text-muted">Yuklanmoqda…</div>}
            {team.data?.length === 0 && (
              <EmptyState
                icon="team"
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
                    'flex w-full items-center gap-3 rounded-[20px] border bg-surface px-3.5 py-3 text-left transition-colors active:bg-sunk',
                    on ? 'border-brand shadow-glow' : 'border-line',
                  )}
                >
                  <Avatar name={w.name} photoUrl={w.photoUrl} size={40} ring={on} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[15px] font-bold tracking-[-0.02em]">{w.name}</div>
                    <div className="truncate text-[12.5px] text-muted">{w.roleLabel}</div>
                  </div>
                  <div
                    className={cx(
                      'flex h-6 w-6 items-center justify-center rounded-lg border-2 text-white transition-colors',
                      on ? 'border-brand bg-brand' : 'border-line-strong',
                    )}
                  >
                    {on ? Icon.check({ size: 13, strokeWidth: 3 }) : null}
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {step === 2 && (
          <>
            <Field
              label="Bitim umumiy summasi ($)"
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
                  <div className="flex items-center gap-2.5">
                    <Avatar name={d.name} size={32} />
                    <div className="text-[16px] font-bold tracking-[-0.02em]">{d.name}</div>
                  </div>

                  <div className="grid grid-cols-2 items-end gap-2">
                    <Field label="Ish soni" hint="Jami nechta">
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
                    <Field label="Bir ish narxi" hint="$ hisobida">
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
                    <div className="eyebrow">Dedlayn</div>
                    {/*
                      `date`, `datetime-local` emas: ilova hech qayerda
                      soatni ko'rsatmaydi (08.09.2026, "8 kun qoldi"),
                      ya'ni daqiqa aniqligi ortiqcha edi va maydonni
                      keraksiz kengaytirardi.
                    */}
                    <Input
                      type="date"
                      value={d.deadlineDate ?? ''}
                      onChange={(e) => patchDraft(d.userId, { deadlineDate: e.target.value })}
                    />

                    {/*
                      Takrorlanish alohida qatorda. Avval bu 44px tugma,
                      "Har", input va "kun" bitta qatorga tiqilgan edi —
                      input `w-full` bo'lgani uchun "kun" kartadan
                      chiqib ketardi va tugmaning nima qilishi
                      tushunarsiz edi.
                    */}
                    <button
                      type="button"
                      onClick={() =>
                        patchDraft(d.userId, {
                          deadlineType: (recurring ? 'ONE_TIME' : 'RECURRING') as DeadlineType,
                          intervalDays: recurring ? undefined : (d.intervalDays ?? 2),
                        })
                      }
                      className={cx(
                        'flex w-full items-center gap-3 rounded-[16px] border px-3.5 py-3 text-left transition-colors',
                        recurring ? 'border-ok bg-ok/8' : 'border-line bg-surface',
                      )}
                    >
                      <span
                        className={cx(
                          'flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border-2 text-white transition-colors',
                          recurring ? 'border-ok bg-ok' : 'border-line-strong',
                        )}
                      >
                        {recurring ? Icon.check({ size: 13, strokeWidth: 3 }) : null}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-[14px] font-bold">Takrorlanuvchi ish</span>
                        <span className="block text-[12px] text-muted">
                          Dedlayn har N kuni avtomatik qayta belgilanadi
                        </span>
                      </span>
                    </button>

                    <AnimatePresence>
                      {recurring && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={spring}
                          className="overflow-hidden"
                        >
                          <div className="flex items-center gap-2 pt-1">
                            <span className="shrink-0 text-[14px] text-muted">Har</span>
                            {/* min-w-0 flex-1 — aks holda w-full qatorni yorib chiqadi */}
                            <Input
                              className="min-w-0 flex-1"
                              type="number"
                              inputMode="numeric"
                              min={1}
                              max={365}
                              value={d.intervalDays ?? ''}
                              onChange={(e) =>
                                patchDraft(d.userId, {
                                  intervalDays: Number(e.target.value) || undefined,
                                })
                              }
                            />
                            <span className="shrink-0 text-[14px] text-muted">kunda</span>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
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
                left={<div className="text-[17px] font-extrabold tracking-[-0.03em]">{name}</div>}
                right={
                  <div className="nums text-[17px] font-extrabold">{money(Number(totalAmount))}</div>
                }
              />
              <Row
                className="mt-1"
                left={<span className="text-[13.5px] text-muted">Olingan pul</span>}
                right={
                  <span className="nums font-extrabold text-ok">{money(Number(receivedAmount || 0))}</span>
                }
              />
            </Card>

            {activeDrafts.map((d) => (
              <Card key={d.userId}>
                <Row
                  left={
                    <div className="min-w-0">
                      <div className="truncate text-[15px] font-bold tracking-[-0.02em]">{d.name}</div>
                      <div className="text-[12.5px] text-muted">
                        {d.totalUnits} {d.unitLabel} × {money(Number(d.unitPrice))} ·{' '}
                        {d.deadlineType === 'ONE_TIME'
                          ? d.deadlineDate
                          : `har ${d.intervalDays} kunda (${d.deadlineDate} dan)`}
                      </div>
                    </div>
                  }
                  right={
                    <div className="nums font-extrabold">
                      {money(Number(d.unitPrice) * Number(d.totalUnits))}
                    </div>
                  }
                />
              </Card>
            ))}

            <Card>
              <Row
                left={<span className="text-[13.5px] text-muted">Jamoaga jami (hammasi bitsa)</span>}
                right={<span className="nums font-extrabold">{money(totalToTeam)}</span>}
              />
              <Row
                className="mt-1"
                left={<span className="text-[13.5px] text-muted">Kutilayotgan foyda</span>}
                right={
                  <span
                    className={cx('nums font-extrabold', expectedMargin >= 0 ? 'text-ok' : 'text-danger')}
                  >
                    {money(expectedMargin)}
                  </span>
                }
              />
            </Card>

            <p className="px-1 text-[12.5px] text-faint">
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
