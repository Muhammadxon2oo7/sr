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
  Icon,
  Input,
  NumberInput,
  Sheet,
  cx,
} from '@/components/ui';
import { AnimatePresence } from '@/components/ui/motion';

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
            icon="team"
            title="Qo'shadigan ishchi yo'q"
            description="Jamoadagi barcha ishchilar allaqachon shu klientga biriktirilgan."
          />
        ) : (
          <>
            <div className="space-y-2">
              <div className="eyebrow px-1">Kim ishlaydi</div>
              {available.map((w) => (
                <button
                  key={w.userId}
                  onClick={() => setUserId(w.userId)}
                  className={cx(
                    'flex w-full items-center gap-3 rounded-[20px] border bg-surface px-3.5 py-3 text-left transition-colors active:bg-sunk',
                    userId === w.userId ? 'border-brand shadow-glow' : 'border-line',
                  )}
                >
                  <Avatar name={w.name} photoUrl={w.photoUrl} size={38} ring={userId === w.userId} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[15px] font-bold tracking-[-0.02em]">{w.name}</div>
                    <div className="truncate text-[12px] text-muted">{w.roleLabel}</div>
                  </div>
                  {userId === w.userId && (
                    <span className="text-brand">{Icon.check({ size: 17, strokeWidth: 2.6 })}</span>
                  )}
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
                    <NumberInput
                      value={totalUnits === '' ? undefined : Number(totalUnits)}
                      onValueChange={(v) => setTotalUnits(v === undefined ? '' : String(v))}
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
                  <NumberInput
                    decimal
                    value={unitPrice === '' ? undefined : Number(unitPrice)}
                    onValueChange={(v) => setUnitPrice(v === undefined ? '' : String(v))}
                    placeholder="0"
                  />
                </Field>

                <div className="space-y-2">
                  <div className="eyebrow">Dedlayn</div>
                  <div className="flex gap-2">
                    {(['ONE_TIME', 'RECURRING'] as DeadlineType[]).map((t) => (
                      <button
                        key={t}
                        onClick={() => setDeadlineType(t)}
                        className={cx(
                          'flex-1 rounded-xl border px-3 py-2.5 text-[13px] font-bold transition-colors',
                          deadlineType === t
                            ? 'border-brand bg-brand/10 text-brand'
                            : 'border-line text-muted',
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
                              'flex-1 rounded-xl border px-2 py-2.5 text-[12.5px] font-bold transition-colors',
                              intervalDays === String(i.days)
                                ? 'border-brand bg-brand/10 text-brand'
                                : 'border-line text-muted',
                            )}
                          >
                            {i.label}
                          </button>
                        ))}
                      </div>
                      <NumberInput
                        placeholder="yoki o'z intervalingiz (kun)"
                        value={intervalDays === '' ? undefined : Number(intervalDays)}
                        onValueChange={(v) => setIntervalDays(v === undefined ? '' : String(v))}
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

            <Button
              size="lg"
              icon="plus"
              disabled={!valid}
              loading={save.isPending}
              onClick={() => save.mutate()}
            >
              Biriktirish
            </Button>
          </>
        )}
      </div>
    </Sheet>
  );
}
