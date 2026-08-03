'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { confirmDialog, haptic } from '@/lib/telegram';
import { deadlineText, money } from '@/lib/format';
import type { TeamMemberClientRow, TeamResponse } from '@/lib/types';
import {
  Avatar,
  Button,
  Card,
  EmptyState,
  LoadingScreen,
  Row,
  Section,
  cx,
} from '@/components/ui';
import { AnimatePresence, AnimatedItem, AnimatedList, motion, spring } from '@/components/ui/motion';
import { IconAlert, IconChevronRight, IconPlus, IconTeam } from '@/components/ui/icons';
import { RequestsList } from './requests-list';
import { InviteSheet } from './invite-sheet';
import { AssignmentMoreSheet } from './assignment-more-sheet';

/**
 * Jamoa sahifasi: rol bo'yicha guruhlar → ishchi → uning klientlari darhol ko'rinadi.
 * Har bir klient yonidagi "more" batafsil kartani ochadi.
 */
export function TeamTab({ productionId }: { productionId: string }) {
  const qc = useQueryClient();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [openAssignment, setOpenAssignment] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const { data, isLoading } = useQuery({
    queryKey: ['team', productionId],
    queryFn: () => api.get<TeamResponse>(`/productions/${productionId}/team`),
  });

  /** Ishchini jamoadan chiqarish (klientlari saqlanadi, a'zolik olib tashlanadi) */
  const removeMember = useMutation({
    mutationFn: (memberId: string) => api.del(`/members/${memberId}`),
    onSuccess: () => {
      haptic('success');
      void qc.invalidateQueries({ queryKey: ['team', productionId] });
      void qc.invalidateQueries({ queryKey: ['dashboard', productionId] });
      void qc.invalidateQueries({ queryKey: ['team-options', productionId] });
    },
    onError: (err) => alert((err as Error).message),
  });

  if (isLoading || !data) return <LoadingScreen />;

  const totalMembers = data.groups.reduce((acc, g) => acc + g.members.length, 0);

  return (
    <div className="space-y-5 px-4 pb-6 pt-4">
      <div className="flex items-center justify-between">
        <h1 className="text-[24px] font-bold">Jamoa</h1>
        <Button size="sm" icon={<IconPlus size={15} />} onClick={() => setInviteOpen(true)}>
          Qo&apos;shish
        </Button>
      </div>

      {data.pendingRequests.length > 0 && (
        <Section title={`Kutilayotgan arizalar (${data.pendingRequests.length})`}>
          <RequestsList requests={data.pendingRequests} productionId={productionId} />
        </Section>
      )}

      {totalMembers === 0 ? (
        <EmptyState
          icon={<IconTeam size={22} />}
          title="Jamoa hali bo'sh"
          description="Ishchilarni qidirib taklif yuboring yoki referal havolani ulashing."
          action={
            <Button size="lg" onClick={() => setInviteOpen(true)}>
              Jamoaga qo&apos;shish
            </Button>
          }
        />
      ) : (
        data.groups.map((g) => (
          <Section key={g.key} title={`${g.label} (${g.members.length})`}>
            <AnimatedList className="space-y-2">
              {g.members.map((m) => {
                const isOpen = !collapsed[m.userId];
                return (
                  <AnimatedItem key={m.userId} className="mb-2">
                    <Card className="!p-0 overflow-hidden">
                      {/* Ishchi qatori */}
                      <button
                        onClick={() =>
                          setCollapsed((c) => ({ ...c, [m.userId]: !c[m.userId] }))
                        }
                        className="w-full px-4 py-3.5 text-left active:opacity-70"
                      >
                        <Row
                          left={
                            <div className="flex items-center gap-3">
                              <Avatar name={m.name} photoUrl={m.photoUrl} />
                              <div className="min-w-0">
                                <div className="truncate text-[16px] font-semibold">{m.name}</div>
                                <div className="truncate text-[12px] text-fg-muted">
                                  {m.clientsCount} klient · shu oyda {m.completedThisMonth} ish
                                </div>
                              </div>
                            </div>
                          }
                          right={
                            <div className="flex items-center gap-2">
                              <div>
                                <div
                                  className={cx(
                                    'text-[15px] font-bold',
                                    m.debt > 0 ? 'text-danger' : 'text-ok',
                                  )}
                                >
                                  {money(m.debt)}
                                </div>
                                <div className="text-[11px] text-fg-muted">to&apos;lash kerak</div>
                              </div>
                              <motion.span
                                animate={{ rotate: isOpen ? 90 : 0 }}
                                transition={spring}
                                className="text-fg-muted"
                              >
                                <IconChevronRight size={18} />
                              </motion.span>
                            </div>
                          }
                        />
                      </button>

                      {/* Shu ishchining klientlari */}
                      <AnimatePresence initial={false}>
                        {isOpen && m.clients.length > 0 && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={spring}
                            className="overflow-hidden border-t border-border"
                          >
                            {m.clients.map((c) => (
                              <ClientLine
                                key={c.assignmentId}
                                client={c}
                                onMore={() => setOpenAssignment(c.assignmentId)}
                              />
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {isOpen && m.clients.length === 0 && (
                        <div className="border-t border-border px-4 py-3 text-[13px] text-fg-muted">
                          Klient biriktirilmagan
                        </div>
                      )}

                      {isOpen && (
                        <button
                          className="w-full border-t border-border py-2.5 text-[12px] text-danger active:opacity-60"
                          onClick={async () => {
                            const warn =
                              m.clientsCount > 0
                                ? `${m.name} jamoadan chiqarilsinmi? U ${m.clientsCount} ta klientda ishlayapti — ishlari saqlanadi, lekin u endi jamoada ko'rinmaydi.`
                                : `${m.name} jamoadan chiqarilsinmi?`;
                            if (!(await confirmDialog(warn))) return;
                            removeMember.mutate(m.memberId);
                          }}
                        >
                          Jamoadan chiqarish
                        </button>
                      )}
                    </Card>
                  </AnimatedItem>
                );
              })}
            </AnimatedList>
          </Section>
        ))
      )}

      <InviteSheet
        productionId={productionId}
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
      />
      <AssignmentMoreSheet
        assignmentId={openAssignment}
        productionId={productionId}
        onClose={() => setOpenAssignment(null)}
      />
    </div>
  );
}

/** Ishchi ostidagi bitta klient qatori: nomi — to'lash kerak — (more) */
function ClientLine({
  client,
  onMore,
}: {
  client: TeamMemberClientRow;
  onMore: () => void;
}) {
  return (
    <div className="flex items-center gap-2 px-4 py-2.5">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          {client.deadlineStatus === 'overdue' && (
            <IconAlert size={14} className="shrink-0 text-danger" />
          )}
          <span className="truncate text-[14px] font-medium">{client.clientName}</span>
        </div>
        <div className="truncate text-[12px] text-fg-muted">
          {client.completedUnits}/{client.totalUnits} {client.unitLabel} ·{' '}
          {money(client.unitPrice)}/{client.unitLabel}
        </div>
      </div>

      <div className="shrink-0 text-right">
        <div className={cx('text-[14px] font-semibold', client.debt > 0 ? 'text-danger' : 'text-ok')}>
          {money(client.debt)}
        </div>
        {client.deadlineDate && (
          <div className="text-[11px] text-fg-muted">
            {deadlineText(client.deadlineDate, client.deadlineStatus)}
          </div>
        )}
      </div>

      <button
        onClick={onMore}
        className="shrink-0 rounded-lg bg-muted px-2.5 py-1.5 text-[12px] font-medium text-fg active:opacity-60"
      >
        more
      </button>
    </div>
  );
}
