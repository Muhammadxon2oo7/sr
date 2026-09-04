'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { confirmDialog, haptic } from '@/lib/telegram';
import { deadlineText, money } from '@/lib/format';
import type { TeamMemberClientRow, TeamResponse } from '@/lib/types';
import {
  Avatar,
  Badge,
  Button,
  Card,
  Dot,
  EmptyState,
  Icon,
  IconButton,
  EmberWatermark,
  LoadingScreen,
  Section,
  cx,
} from '@/components/ui';
import {
  AnimatePresence,
  AnimatedItem,
  AnimatedList,
  motion,
  softSpring,
  spring,
} from '@/components/ui/motion';
import { RequestsList } from './requests-list';
import { InviteSheet } from './invite-sheet';
import { AssignmentMoreSheet } from './assignment-more-sheet';
import { useAuth } from '@/lib/auth';

/**
 * Jamoa sahifasi: rol bo'yicha guruhlar → ishchi → uning klientlari darhol ko'rinadi.
 * Har bir klient yonidagi "batafsil" tugmasi to'liq kartani ochadi.
 */
export function TeamTab({ productionId }: { productionId: string }) {
  const qc = useQueryClient();
  const { me } = useAuth();
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

  /**
   * A'zoning SHU prodakshndagi rolini o'zgartirish.
   *
   * Menejerlikka ko'tarilgan odam o'ziga biriktirilgan klientlar
   * bo'yicha boshqa ishchilarga vazifa taqsimlay oladi. Rol faqat shu
   * agentlikda amal qiladi — uning boshqa joydagi o'rniga tegmaydi.
   */
  const setRole = useMutation({
    mutationFn: ({ memberId, role }: { memberId: string; role: string }) =>
      api.put(`/members/${memberId}/role`, { role }),
    onSuccess: () => {
      haptic('success');
      void qc.invalidateQueries({ queryKey: ['team', productionId] });
      void qc.invalidateQueries({ queryKey: ['managers', productionId] });
      void qc.invalidateQueries({ queryKey: ['clients', productionId] });
    },
    onError: (err) => alert((err as Error).message),
  });

  if (isLoading || !data) return <LoadingScreen />;

  const isOwner = me?.user.id === data.production.ownerId;

  const totalMembers = data.groups.reduce((acc, g) => acc + g.members.length, 0);
  const totalDebt = data.groups.reduce(
    (acc, g) => acc + g.members.reduce((s, m) => s + m.debt, 0),
    0,
  );

  return (
    <div className="space-y-5 px-4 pb-6 pt-3">
      {/* ── Prodakshn identifikatori ─────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={softSpring}
      >
        <Card tone="ember" className="!p-3.5">
          <EmberWatermark size={124} position="-right-7 -top-9" />
          <div className="ember-scrim pointer-events-none absolute inset-0" />

          <div className="relative flex items-center gap-3">
            <span className="rounded-[19px] bg-white/20 p-[3px] ring-1 ring-white/30 backdrop-blur-md">
              <Avatar name={data.production.name} photoUrl={data.production.photoUrl} size={48} />
            </span>
            <div className="min-w-0 flex-1">
              <div className="display truncate text-[17.5px] font-extrabold text-white">
                {data.production.name}
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-1.5">
                <Badge tone="onEmber" icon="team">
                  {totalMembers} ishchi
                </Badge>
                {totalDebt > 0 && (
                  <Badge tone="onEmber" icon="wallet">
                    {money(totalDebt)} qarz
                  </Badge>
                )}
              </div>
            </div>
            {/* Jamoa tarkibi — egalik huquqi. Ko'tarilgan menejer
                ishlarni taqsimlaydi, odam qo'shib-chiqarmaydi. */}
            {isOwner && (
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => {
                  haptic('light');
                  setInviteOpen(true);
                }}
                aria-label="Jamoaga qo'shish"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-brand-deep"
              >
                {Icon.plus({ size: 19, strokeWidth: 2.6 })}
              </motion.button>
            )}
          </div>
        </Card>
      </motion.div>

      {isOwner && data.pendingRequests.length > 0 && (
        <Section title={`Kutilayotgan arizalar · ${data.pendingRequests.length}`}>
          <RequestsList requests={data.pendingRequests} productionId={productionId} />
        </Section>
      )}

      {totalMembers === 0 ? (
        <EmptyState
          icon="team"
          title="Jamoa hali bo'sh"
          description="Ishchilarni qidirib taklif yuboring yoki referal havolani ulashing."
          action={
            <Button size="lg" icon="plus" onClick={() => setInviteOpen(true)}>
              Jamoaga qo&apos;shish
            </Button>
          }
        />
      ) : (
        data.groups.map((g) => (
          <Section key={g.key} title={`${g.label} · ${g.members.length}`}>
            <AnimatedList className="space-y-2">
              {g.members.map((m) => {
                const isOpen = !collapsed[m.userId];
                return (
                  <AnimatedItem key={m.userId} className="mb-2">
                    <Card className="overflow-hidden !p-0">
                      {/* Ishchi qatori */}
                      <button
                        onClick={() => {
                          haptic('light');
                          setCollapsed((c) => ({ ...c, [m.userId]: !c[m.userId] }));
                        }}
                        className="w-full px-3.5 py-3 text-left active:bg-sunk/60"
                      >
                        <div className="flex items-center gap-3">
                          <Avatar name={m.name} photoUrl={m.photoUrl} size={40} />

                          <div className="min-w-0 flex-1">
                            <div className="truncate text-[15.5px] font-bold tracking-[-0.02em]">
                              {m.name}
                            </div>
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className="truncate text-[12px] text-muted">
                                {m.clientsCount} klient · shu oyda {m.completedThisMonth} ish
                              </span>
                              {m.isManager && (
                                <Badge tone="brand" icon="spark">
                                  menejer
                                </Badge>
                              )}
                            </div>
                          </div>

                          <div className="shrink-0 text-right">
                            <div
                              className={cx(
                                'nums text-[15px] font-extrabold',
                                m.debt > 0 ? 'text-danger' : 'text-ok',
                              )}
                            >
                              {money(m.debt)}
                            </div>
                            <div className="text-[10.5px] font-semibold uppercase tracking-[0.06em] text-faint">
                              {m.debt > 0 ? "to'lash kerak" : 'qarz yo’q'}
                            </div>
                          </div>

                          <motion.span
                            animate={{ rotate: isOpen ? 90 : 0 }}
                            transition={spring}
                            className="shrink-0 text-faint"
                          >
                            {Icon.chevron({ size: 16 })}
                          </motion.span>
                        </div>
                      </button>

                      {/* Shu ishchining klientlari */}
                      <AnimatePresence initial={false}>
                        {isOpen && m.clients.length > 0 && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={spring}
                            className="overflow-hidden border-t border-line bg-sunk/40"
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
                        <div className="border-t border-line px-3.5 py-2.5 text-[12.5px] text-faint">
                          Klient biriktirilmagan
                        </div>
                      )}

                      {/* Menejerlikka ko'tarish — faqat ega. Menejer o'ziga
                          teng menejer yaratsa, jamoa tarkibini ham
                          o'zgartira olardi. */}
                      {isOpen && isOwner && (
                        <button
                          className="w-full border-t border-line py-2.5 text-[12px] font-semibold text-brand active:bg-brand/8"
                          onClick={async () => {
                            const warn = m.isManager
                              ? `${m.name} menejerlikdan olinsinmi? Unga biriktirilgan ${m.managedClients} ta klient sizga qaytadi.`
                              : `${m.name} menejer qilinsinmi? U o'ziga biriktirilgan klientlar bo'yicha jamoaga ish taqsimlay oladi.`;
                            if (!(await confirmDialog(warn))) return;
                            setRole.mutate({
                              memberId: m.memberId,
                              role: m.isManager ? (m.role ?? 'OTHER') : 'MANAGER',
                            });
                          }}
                        >
                          {m.isManager ? 'Menejerlikdan olish' : 'Menejer qilish'}
                        </button>
                      )}

                      {isOpen && isOwner && (
                        <button
                          className="w-full border-t border-line py-2.5 text-[12px] font-semibold text-danger active:bg-danger/8"
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

/** Ishchi ostidagi bitta klient qatori: nomi — to'lash kerak — (batafsil) */
function ClientLine({ client, onMore }: { client: TeamMemberClientRow; onMore: () => void }) {
  const overdue = client.deadlineStatus === 'overdue';

  return (
    <div className="flex items-center gap-2.5 px-3.5 py-2.5">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          {overdue && <Dot tone="danger" />}
          <span className="truncate text-[14px] font-semibold">{client.clientName}</span>
        </div>
        <div className="nums truncate text-[11.5px] text-faint">
          {client.completedUnits}/{client.totalUnits} {client.unitLabel} ·{' '}
          {money(client.unitPrice)}/{client.unitLabel}
        </div>
      </div>

      <div className="shrink-0 text-right">
        <div
          className={cx(
            'nums text-[14px] font-bold',
            client.debt > 0 ? 'text-danger' : 'text-ok',
          )}
        >
          {money(client.debt)}
        </div>
        {client.deadlineDate && (
          <div className={cx('text-[11px]', overdue ? 'text-danger' : 'text-faint')}>
            {deadlineText(client.deadlineDate, client.deadlineStatus)}
          </div>
        )}
      </div>

      <IconButton icon="info" size={30} label="Batafsil" onClick={onMore} />
    </div>
  );
}
