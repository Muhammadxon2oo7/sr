'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { haptic } from '@/lib/telegram';
import { deadlineText, formatFullDate, money } from '@/lib/format';
import type { WorkerAssignmentDetail } from '@/lib/types';
import {
  Button,
  Card,
  ErrorBanner,
  Progress,
  Row,
  Sheet,
  Skeleton,
  cx,
} from '@/components/ui';
import { AnimatePresence, motion, spring } from '@/components/ui/motion';

/**
 * Klient tafsilotlari (TZ 6.2).
 * Ishchi faqat progressni belgilaydi — pul bilan bog'liq hech narsani tahrirlay olmaydi.
 */
export function AssignmentDetail({
  assignmentId,
  onClose,
}: {
  assignmentId: string | null;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const [celebrate, setCelebrate] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['assignment', assignmentId],
    queryFn: () => api.get<WorkerAssignmentDetail>(`/me/assignments/${assignmentId}`),
    enabled: Boolean(assignmentId),
  });

  const complete = useMutation({
    mutationFn: () => api.post(`/assignments/${assignmentId}/complete`),
    onSuccess: () => {
      haptic('success');
      setError(null);
      // Bajarilgan ish darhol tasdiqlanadi — ishchi natijani ko'radi
      setCelebrate(true);
      setTimeout(() => setCelebrate(false), 1100);
      void qc.invalidateQueries({ queryKey: ['assignment', assignmentId] });
      void qc.invalidateQueries({ queryKey: ['worker-dashboard'] });
    },
    onError: (err) => {
      haptic('error');
      setError((err as Error).message);
    },
  });

  return (
    <Sheet open={Boolean(assignmentId)} onClose={onClose} title={data?.clientName ?? 'Klient'}>
      {isLoading || !data ? (
        <div className="space-y-3">
          <Skeleton className="h-24" />
          <Skeleton className="h-32" />
        </div>
      ) : (
        <div className="space-y-4">
          {error && <ErrorBanner message={error} />}

          <Card>
            <div className="text-[13px] text-tg-hint">{data.production.name}</div>
            <div className="mt-1 text-[20px] font-bold">{data.clientName}</div>

            <div className="mt-3 flex items-center gap-2">
              <Progress percent={data.progressPercent} />
              <span className="shrink-0 text-[13px] font-semibold tabular-nums">
                {data.completedUnits}/{data.totalUnits}
              </span>
            </div>
            <div className="mt-1 text-[12px] text-tg-hint">{data.unitLabel}</div>
          </Card>

          <Card>
            <Row
              left={<span className="text-[14px] text-tg-hint">Dedlayn</span>}
              right={
                <span
                  className={cx(
                    'font-semibold',
                    data.deadlineStatus === 'overdue'
                      ? 'text-danger'
                      : data.deadlineStatus === 'today'
                        ? 'text-warn'
                        : '',
                  )}
                >
                  {deadlineText(data.deadlineDate, data.deadlineStatus, data.daysLeft)}
                </span>
              }
            />
            {data.deadlineType === 'RECURRING' && (
              <div className="mt-1 text-[12px] text-tg-hint">
                Takrorlanuvchi: har {data.intervalDays} kunda
              </div>
            )}
          </Card>

          {/* Pul — faqat ko'rish uchun */}
          <Card className="space-y-1.5">
            <div className="text-[13px] font-semibold uppercase tracking-wide text-tg-hint">
              Pul (faqat ko&apos;rish)
            </div>
            <Row
              left={<span className="text-[14px] text-tg-hint">Har bir {data.unitLabel}</span>}
              right={<span className="font-semibold">{money(data.unitPrice)}</span>}
            />
            <Row
              left={<span className="text-[14px] text-tg-hint">Ishlangan pul</span>}
              right={<span className="font-semibold">{money(data.owedAmount)}</span>}
            />
            <Row
              left={<span className="text-[14px] text-tg-hint">To&apos;langan</span>}
              right={<span className="font-semibold text-ok">{money(data.paidAmount)}</span>}
            />
            <Row
              left={<span className="text-[14px] text-tg-hint">To&apos;lanmagan</span>}
              right={
                <span className={cx('text-[17px] font-bold', data.debt > 0 ? 'text-warn' : 'text-ok')}>
                  {money(data.debt)}
                </span>
              }
            />
          </Card>

          {data.payouts.length > 0 && (
            <div className="space-y-2">
              <div className="px-1 text-[13px] font-semibold uppercase tracking-wide text-tg-hint">
                To&apos;lovlar tarixi
              </div>
              {data.payouts.map((p) => (
                <Card key={p.id}>
                  <Row
                    left={<span className="text-[15px] font-semibold">{money(p.amount)}</span>}
                    right={
                      <span className="text-[12px] text-tg-hint">{formatFullDate(p.paidAt)}</span>
                    }
                  />
                  {p.note && <div className="mt-1 text-[12px] text-tg-hint">{p.note}</div>}
                </Card>
              ))}
            </div>
          )}

          <Button
            size="lg"
            variant={data.isFinished ? 'secondary' : 'success'}
            disabled={data.isFinished || complete.isPending}
            loading={complete.isPending}
            onClick={() => complete.mutate()}
          >
            {data.isFinished
              ? 'Barcha ishlar bajarilgan ✓'
              : `✓ Ish bajarildi (${data.completedUnits + 1}/${data.totalUnits})`}
          </Button>

          <p className="px-1 text-center text-[12px] text-tg-hint">
            Belgilaganingizdan so&apos;ng menejerga avtomatik xabar boradi.
          </p>
        </div>
      )}

      {/* Ish qayd etilgani — bir lahzalik vizual tasdiq */}
      <AnimatePresence>
        {celebrate && (
          <motion.div
            className="pointer-events-none fixed inset-0 z-60 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="flex h-24 w-24 items-center justify-center rounded-full bg-ok text-[44px] text-white shadow-2xl"
              initial={{ scale: 0.3, rotate: -20 }}
              animate={{ scale: [0.3, 1.15, 1], rotate: 0 }}
              exit={{ scale: 0.5, opacity: 0 }}
              transition={spring}
            >
              ✓
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </Sheet>
  );
}
