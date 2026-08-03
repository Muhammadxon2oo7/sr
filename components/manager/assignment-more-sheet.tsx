'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { haptic } from '@/lib/telegram';
import { deadlineText, money } from '@/lib/format';
import type { AssignmentDto, ClientDto } from '@/lib/types';
import {
  Button,
  Card,
  ErrorBanner,
  Input,
  Progress,
  Row,
  Sheet,
  Skeleton,
  cx,
} from '@/components/ui';
import { AnimatePresence, motion, spring } from '@/components/ui/motion';
import { IconClock } from '@/components/ui/icons';

/**
 * Ishchi–klient kartasi (Jamoa → "more").
 * Faqat eng kerakli ma'lumot: klient, dedlayn, progress, narx va pul holati.
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
  const [payOpen, setPayOpen] = useState(false);
  const [payAmount, setPayAmount] = useState('');
  const [loadedFor, setLoadedFor] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['assignment-more', assignmentId],
    enabled: Boolean(assignmentId),
    queryFn: async () => {
      const clients = await api.get<ClientDto[]>(`/productions/${productionId}/clients`);
      for (const c of clients) {
        const found = c.assignments.find((x) => x.id === assignmentId);
        if (found) return found;
      }
      return null;
    },
  });

  const a: AssignmentDto | null | undefined = data;

  if (a && loadedFor !== a.id) {
    setLoadedFor(a.id);
    setPayOpen(false);
    setPayAmount('');
    setError(null);
  }

  const pay = useMutation({
    mutationFn: () => api.post(`/assignments/${a!.id}/payouts`, { amount: Number(payAmount) }),
    onSuccess: () => {
      haptic('success');
      setPayAmount('');
      setPayOpen(false);
      setError(null);
      void qc.invalidateQueries({ queryKey: ['assignment-more', assignmentId] });
      void qc.invalidateQueries({ queryKey: ['team', productionId] });
      void qc.invalidateQueries({ queryKey: ['clients', productionId] });
      void qc.invalidateQueries({ queryKey: ['dashboard', productionId] });
      void qc.invalidateQueries({ queryKey: ['finance', productionId] });
    },
    onError: (err) => {
      haptic('error');
      setError((err as Error).message);
    },
  });

  return (
    <Sheet open={Boolean(assignmentId)} onClose={onClose} title={a?.clientName ?? 'Klient'}>
      {isLoading || !a ? (
        <div className="space-y-3">
          <Skeleton className="h-20" />
          <Skeleton className="h-28" />
        </div>
      ) : (
        <div className="space-y-4">
          <AnimatePresence>{error && <ErrorBanner message={error} />}</AnimatePresence>

          {/* Klient + dedlayn */}
          <div>
            <h3 className="text-[22px] font-bold leading-tight">{a.clientName}</h3>
            <div
              className={cx(
                'mt-1.5 flex items-center gap-1.5 text-[15px] font-medium',
                a.deadlineStatus === 'overdue'
                  ? 'text-danger'
                  : a.deadlineStatus === 'today'
                    ? 'text-warn'
                    : 'text-fg-muted',
              )}
            >
              <IconClock size={15} />
              {deadlineText(a.deadlineDate, a.deadlineStatus, a.daysLeft)}
            </div>
          </div>

          {/* Bajarildi */}
          <Card>
            <Row
              left={<span className="text-[14px] text-fg-muted">Bajarildi</span>}
              right={
                <span className="text-[17px] font-bold tabular-nums">
                  {a.completedUnits} / {a.totalUnits} {a.unitLabel}
                </span>
              }
            />
            <div className="mt-2.5">
              <Progress percent={a.progressPercent} />
            </div>
          </Card>

          {/* Pul */}
          <Card className="space-y-2">
            <Row
              left={<span className="text-[14px] text-fg-muted">Har bir {a.unitLabel} narxi</span>}
              right={<span className="text-[16px] font-semibold">{money(a.unitPrice)}</span>}
            />
            <Row
              left={<span className="text-[14px] text-fg-muted">To&apos;lash kerak</span>}
              right={<span className="text-[16px] font-semibold">{money(a.owedAmount)}</span>}
            />
            <Row
              left={<span className="text-[14px] text-fg-muted">To&apos;langan</span>}
              right={<span className="text-[16px] font-semibold text-ok">{money(a.paidAmount)}</span>}
            />
          </Card>

          {/* To'lash */}
          <AnimatePresence mode="wait">
            {payOpen ? (
              <motion.div
                key="form"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={spring}
                className="space-y-2"
              >
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
                <div className="flex gap-2">
                  <button
                    className="flex-1 rounded-xl bg-muted py-2 text-[13px] font-medium active:opacity-70"
                    onClick={() => setPayAmount(String(a.debt))}
                  >
                    To&apos;liq: {money(a.debt)}
                  </button>
                  <button
                    className="flex-1 rounded-xl py-2 text-[13px] text-fg-muted active:opacity-60"
                    onClick={() => setPayOpen(false)}
                  >
                    Bekor qilish
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div key="btn" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <Button size="lg" disabled={a.debt <= 0} onClick={() => setPayOpen(true)}>
                  {a.debt > 0 ? `To'lash — ${money(a.debt)}` : "To'liq to'langan"}
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </Sheet>
  );
}
