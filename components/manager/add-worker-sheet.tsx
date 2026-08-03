'use client';

import { useState } from 'react';
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
  Input,
  Sheet,
  cx,
} from '@/components/ui';
import { AnimatePresence } from '@/components/ui/motion';
import { IconCheck, IconTeam } from '@/components/ui/icons';

const INTERVALS = [
  { days: 1, label: 'Har kuni' },
  { days: 2, label: 'Har 2 kunda' },
  { days: 7, label: 'Har hafta' },
];

/**
 * Mavjud klientga yangi ishchi biriktirish.
 * Backend assignmentlarni to'liq ro'yxat bo'yicha sinxronlaydi, shuning uchun
 * mavjudlarini ham birga yuboramiz.
 */
export function AddWorkerSheet({
  client,
  productionId,
  open,
  onClose,
}: {
  client: ClientDto;
  productionId: string;
  open: boolean;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const [userId, setUserId] = useState<string | null>(null);
  const [unitLabel, setUnitLabel] = useState('video');
  const [totalUnits, setTotalUnits] = useState('1');
  const [unitPrice, setUnitPrice] = useState('');
  const [deadlineType, setDeadlineType] = useState<DeadlineType>('ONE_TIME');
  const [deadlineDate, setDeadlineDate] = useState(
    toDateInput(new Date(Date.now() + 7 * 86400000).toISOString()),
  );
  const [intervalDays, setIntervalDays] = useState('');
  const [startDate, setStartDate] = useState(toDateInput(new Date().toISOString()));
  const [error, setError] = useState<string | null>(null);

  const team = useQuery({
    queryKey: ['team-options', productionId],
    queryFn: () => api.get<TeamOption[]>(`/productions/${productionId}/team/options`),
    enabled: open,
  });

  const taken = new Set(client.assignments.map((a) => a.worker.id));
  const available = (team.data ?? []).filter((w) => !taken.has(w.userId));

  const save = useMutation({
    mutationFn: () => {
      const existing: AssignmentInput[] = client.assignments.map((a) => ({
        userId: a.worker.id,
        unitLabel: a.unitLabel,
        totalUnits: a.totalUnits,
        unitPrice: a.unitPrice,
        deadlineType: a.deadlineType,
        deadlineDate: a.deadlineDate ?? undefined,
        intervalDays: a.intervalDays ?? undefined,
        startDate: a.startDate ?? undefined,
      }));

      const added: AssignmentInput = {
        userId: userId!,
        unitLabel: unitLabel.trim() || 'ish',
        totalUnits: Number(totalUnits),
        unitPrice: Number(unitPrice),
        deadlineType,
        deadlineDate:
          deadlineType === 'ONE_TIME' && deadlineDate
            ? new Date(`${deadlineDate}T12:00:00`).toISOString()
            : undefined,
        intervalDays: deadlineType === 'RECURRING' ? Number(intervalDays) : undefined,
        startDate:
          deadlineType === 'RECURRING' && startDate
            ? new Date(`${startDate}T12:00:00`).toISOString()
            : undefined,
      };

      return api.patch(`/clients/${client.id}`, { assignments: [...existing, added] });
    },
    onSuccess: () => {
      haptic('success');
      setError(null);
      setUserId(null);
      setUnitPrice('');
      void qc.invalidateQueries({ queryKey: ['client', client.id] });
      void qc.invalidateQueries({ queryKey: ['clients', productionId] });
      void qc.invalidateQueries({ queryKey: ['team', productionId] });
      void qc.invalidateQueries({ queryKey: ['dashboard', productionId] });
      onClose();
    },
    onError: (err) => {
      haptic('error');
      setError((err as Error).message);
    },
  });

  const valid =
    Boolean(userId) &&
    Number(totalUnits) > 0 &&
    Number(unitPrice) > 0 &&
    (deadlineType === 'ONE_TIME' ? Boolean(deadlineDate) : Boolean(intervalDays) && Boolean(startDate));

  return (
    <Sheet open={open} onClose={onClose} title="Ishchi biriktirish">
      <div className="space-y-4">
        {available.length === 0 ? (
          <EmptyState
            icon={<IconTeam size={22} />}
            title="Qo'shadigan ishchi yo'q"
            description="Jamoadagi barcha ishchilar allaqachon shu klientga biriktirilgan."
          />
        ) : (
          <>
            <div className="space-y-2">
              <div className="text-[13px] font-medium text-fg-muted">Kim ishlaydi</div>
              {available.map((w) => (
                <button
                  key={w.userId}
                  onClick={() => setUserId(w.userId)}
                  className={cx(
                    'flex w-full items-center gap-3 rounded-2xl border-2 bg-surface px-3.5 py-3 text-left active:opacity-70',
                    userId === w.userId ? 'border-fg' : 'border-transparent',
                  )}
                >
                  <Avatar name={w.name} photoUrl={w.photoUrl} size={36} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[15px] font-semibold">{w.name}</div>
                    <div className="truncate text-[12px] text-fg-muted">{w.roleLabel}</div>
                  </div>
                  {userId === w.userId && <IconCheck size={18} className="text-fg" />}
                </button>
              ))}
            </div>

            {userId && (
              <Card className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <Field label="Ish birligi">
                    <Input
                      value={unitLabel}
                      onChange={(e) => setUnitLabel(e.target.value)}
                      maxLength={24}
                    />
                  </Field>
                  <Field label="Jami soni">
                    <Input
                      type="number"
                      inputMode="numeric"
                      min={1}
                      value={totalUnits}
                      onChange={(e) => setTotalUnits(e.target.value)}
                    />
                  </Field>
                </div>

                <Field
                  label={`Har bir ${unitLabel || 'ish'} uchun narx ($)`}
                  hint={
                    Number(unitPrice) > 0
                      ? `Hammasi bajarilsa: ${money(Number(unitPrice) * Number(totalUnits || 0))}`
                      : undefined
                  }
                >
                  <Input
                    type="number"
                    inputMode="decimal"
                    min={0}
                    value={unitPrice}
                    onChange={(e) => setUnitPrice(e.target.value)}
                    placeholder="0"
                  />
                </Field>

                <div className="space-y-2">
                  <div className="text-[13px] font-medium text-fg-muted">Dedlayn</div>
                  <div className="flex gap-2">
                    {(['ONE_TIME', 'RECURRING'] as DeadlineType[]).map((t) => (
                      <button
                        key={t}
                        onClick={() => setDeadlineType(t)}
                        className={cx(
                          'flex-1 rounded-xl border-2 px-3 py-2 text-[13px] font-medium',
                          deadlineType === t
                            ? 'border-fg text-fg'
                            : 'border-border text-fg-muted',
                        )}
                      >
                        {t === 'ONE_TIME' ? 'Keyingi dedlayn' : 'Har N kuni'}
                      </button>
                    ))}
                  </div>

                  {deadlineType === 'ONE_TIME' ? (
                    <Input
                      type="date"
                      value={deadlineDate}
                      onChange={(e) => setDeadlineDate(e.target.value)}
                    />
                  ) : (
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        {INTERVALS.map((i) => (
                          <button
                            key={i.days}
                            onClick={() => setIntervalDays(String(i.days))}
                            className={cx(
                              'flex-1 rounded-xl border-2 px-2 py-2 text-[13px] font-medium',
                              intervalDays === String(i.days)
                                ? 'border-fg text-fg'
                                : 'border-border text-fg-muted',
                            )}
                          >
                            {i.label}
                          </button>
                        ))}
                      </div>
                      <Input
                        type="number"
                        min={1}
                        max={365}
                        placeholder="yoki o'z intervalingiz (kun)"
                        value={intervalDays}
                        onChange={(e) => setIntervalDays(e.target.value)}
                      />
                      <Field label="Birinchi dedlayn sanasi">
                        <Input
                          type="date"
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                        />
                      </Field>
                    </div>
                  )}
                </div>
              </Card>
            )}

            <AnimatePresence>{error && <ErrorBanner message={error} />}</AnimatePresence>

            <Button size="lg" disabled={!valid} loading={save.isPending} onClick={() => save.mutate()}>
              Biriktirish
            </Button>
          </>
        )}
      </div>
    </Sheet>
  );
}
