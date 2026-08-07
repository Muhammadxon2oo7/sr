'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { haptic } from '@/lib/telegram';
import type { PendingRequest } from '@/lib/types';
import { Avatar, Button, Card, Row } from '@/components/ui';

/** Kutilayotgan a'zolik arizalari — qabul qilish / rad etish (TZ 5.2, 4.3). */
export function RequestsList({
  requests,
  productionId,
}: {
  requests: PendingRequest[];
  productionId: string;
}) {
  const qc = useQueryClient();

  const decide = useMutation({
    mutationFn: ({ id, accept }: { id: string; accept: boolean }) =>
      api.post(`/members/${id}/${accept ? 'accept' : 'reject'}`),
    onSuccess: () => {
      haptic('success');
      void qc.invalidateQueries({ queryKey: ['dashboard', productionId] });
      void qc.invalidateQueries({ queryKey: ['team', productionId] });
    },
    onError: () => haptic('error'),
  });

  if (!requests.length) return null;

  return (
    <div className="space-y-2">
      {requests.map((r) => (
        <Card key={r.id}>
          <Row
            left={
              <div className="flex items-center gap-3">
                <Avatar name={r.name} photoUrl={r.photoUrl} />
                <div className="min-w-0">
                  <div className="truncate text-[16px] font-semibold">{r.name}</div>
                  <div className="truncate text-[13px] text-tg-hint">{r.roleLabel}</div>
                </div>
              </div>
            }
          />
          <div className="mt-3 flex gap-2">
            <Button
              variant="success"
              className="flex-1"
              disabled={decide.isPending}
              onClick={() => decide.mutate({ id: r.id, accept: true })}
            >
              Qabul qilish
            </Button>
            <Button
              variant="danger"
              className="flex-1"
              disabled={decide.isPending}
              onClick={() => decide.mutate({ id: r.id, accept: false })}
            >
              Rad etish
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
}
