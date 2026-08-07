'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { haptic } from '@/lib/telegram';
import { useAuth } from '@/lib/auth';
import type { IncomingInvite } from '@/lib/types';
import { Avatar, Button, Card, Row, Section } from '@/components/ui';
import { AnimatePresence, AnimatedItem, AnimatedList } from '@/components/ui/motion';

/**
 * Menejer yuborgan takliflar — ishchi qabul qilsa jamoaga qo'shiladi.
 * (Referal havola orqali kirganlar bu bosqichdan o'tmaydi — ular darhol qo'shiladi.)
 */
export function IncomingInvites() {
  const qc = useQueryClient();
  const { refresh } = useAuth();

  const { data } = useQuery({
    queryKey: ['my-invites'],
    queryFn: () => api.get<IncomingInvite[]>('/me/invites'),
  });

  const respond = useMutation({
    mutationFn: ({ id, accept }: { id: string; accept: boolean }) =>
      api.post(`/members/${id}/invite/${accept ? 'accept' : 'decline'}`),
    onSuccess: async () => {
      haptic('success');
      void qc.invalidateQueries({ queryKey: ['my-invites'] });
      void qc.invalidateQueries({ queryKey: ['worker-dashboard'] });
      await refresh();
    },
    onError: () => haptic('error'),
  });

  if (!data?.length) return null;

  return (
    <Section title={`📨 Sizni jamoaga taklif qilishmoqda (${data.length})`}>
      <AnimatedList className="space-y-2">
        <AnimatePresence>
          {data.map((inv) => (
            <AnimatedItem key={inv.id} className="mb-2">
              <Card>
                <Row
                  left={
                    <div className="flex items-center gap-3">
                      <Avatar name={inv.production.name} photoUrl={inv.production.photoUrl} />
                      <div className="min-w-0">
                        <div className="truncate text-[16px] font-semibold">
                          {inv.production.name}
                        </div>
                        <div className="truncate text-[12px] text-tg-hint">
                          @{inv.production.username} · {inv.production.membersCount} a&apos;zo
                        </div>
                      </div>
                    </div>
                  }
                />
                <div className="mt-3 flex gap-2">
                  <Button
                    variant="success"
                    className="flex-1"
                    disabled={respond.isPending}
                    onClick={() => respond.mutate({ id: inv.id, accept: true })}
                  >
                    Qabul qilish
                  </Button>
                  <Button
                    variant="danger"
                    className="flex-1"
                    disabled={respond.isPending}
                    onClick={() => respond.mutate({ id: inv.id, accept: false })}
                  >
                    Rad etish
                  </Button>
                </div>
              </Card>
            </AnimatedItem>
          ))}
        </AnimatePresence>
      </AnimatedList>
    </Section>
  );
}
