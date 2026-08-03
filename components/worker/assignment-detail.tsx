'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { haptic } from '@/lib/telegram';
import { deadlineText, money } from '@/lib/format';
import type { WorkerAssignmentDetail } from '@/lib/types';
import { Button, Card, ErrorBanner, Progress, Row, Sheet, Skeleton, cx } from '@/components/ui';
import { AnimatePresence, motion, spring } from '@/components/ui/motion';
import { IconCheck, IconClock } from '@/components/ui/icons';

/**
 * Ishchi uchun klient kartasi.
 * Faqat kerakli ma'lumot: dedlayn, bajarilgan ish, ishlangan/to'langan/qolgan pul.
 * Pul faqat ko'rish uchun — o'zgartirishni menejer qiladi.
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
          <Skeleton className="h-20" />
          <Skeleton className="h-28" />
        </div>
      ) : (
        <div className="space-y-4">
          <AnimatePresence>{error && <ErrorBanner message={error} />}</AnimatePresence>

          {/* Klient + dedlayn */}
          <div>
            <h3 className="text-[22px] font-bold leading-tight">{data.clientName}</h3>
            <div
              className={cx(
                'mt-1.5 flex items-center gap-1.5 text-[15px] font-medium',
                data.deadlineStatus === 'overdue'
                  ? 'text-danger'
                  : data.deadlineStatus === 'today'
                    ? 'text-warn'
                    : 'text-fg-muted',
              )}
            >
              <IconClock size={15} />
              {deadlineText(data.deadlineDate, data.deadlineStatus, data.daysLeft)}
            </div>
          </div>

          {/* Bajarilgan ish */}
          <Card>
            <Row
              left={<span className="text-[14px] text-fg-muted">Bajarildi</span>}
              right={
                <span className="text-[17px] font-bold tabular-nums">
                  {data.completedUnits} / {data.totalUnits} {data.unitLabel}
                </span>
              }
            />
            <div className="mt-2.5">
              <Progress percent={data.progressPercent} />
            </div>
          </Card>

          {/* Pul */}
          <Card className="space-y-2">
            <Row
              left={<span className="text-[14px] text-fg-muted">Ishlangan pul</span>}
              right={<span className="text-[16px] font-semibold">{money(data.owedAmount)}</span>}
            />
            <Row
              left={<span className="text-[14px] text-fg-muted">To&apos;langan</span>}
              right={
                <span className="text-[16px] font-semibold text-ok">{money(data.paidAmount)}</span>
              }
            />
            <Row
              left={<span className="text-[14px] font-medium">Qolgan</span>}
              right={
                <span
                  className={cx('text-[19px] font-bold', data.debt > 0 ? 'text-warn' : 'text-ok')}
                >
                  {money(data.debt)}
                </span>
              }
            />
          </Card>

          <Button
            size="lg"
            variant={data.isFinished ? 'secondary' : 'primary'}
            icon={data.isFinished ? undefined : <IconCheck size={17} />}
            disabled={data.isFinished || complete.isPending}
            loading={complete.isPending}
            onClick={() => complete.mutate()}
          >
            {data.isFinished
              ? 'Barcha ishlar bajarilgan'
              : `Ish bajarildi (${data.completedUnits + 1}/${data.totalUnits})`}
          </Button>
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
              className="flex h-20 w-20 items-center justify-center rounded-full bg-primary text-primary-fg"
              initial={{ scale: 0.3, rotate: -20 }}
              animate={{ scale: [0.3, 1.15, 1], rotate: 0 }}
              exit={{ scale: 0.5, opacity: 0 }}
              transition={spring}
            >
              <IconCheck size={36} strokeWidth={2.2} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </Sheet>
  );
}
