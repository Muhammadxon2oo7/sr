'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { alertDialog, openLink } from '@/lib/telegram';
import { money } from '@/lib/format';
import type { FinanceResponse } from '@/lib/types';
import {
  Avatar,
  Badge,
  Button,
  Card,
  Icon,
  LoadingScreen,
  LogoMark,
  PageHeader,
  Row,
  Section,
  Stat,
  cx,
} from '@/components/ui';
import { AnimatedItem, AnimatedList, motion, softSpring } from '@/components/ui/motion';
import { InviteSheet } from './invite-sheet';
import { EditProductionSheet } from './edit-production-sheet';
import { DemoControls } from '@/components/demo/demo-controls';

/** Rasmiy kanal — `.env` orqali almashtiriladi. */
const TELEGRAM_CHANNEL = process.env.NEXT_PUBLIC_TELEGRAM_CHANNEL ?? 'https://t.me/telegram';

/**
 * Menejer profili: agentlik ma'lumotlari + umumiy moliya jamlanmasi
 * (klientlar va ishchilar kesimida).
 */
export function ProfileTab({ productionId }: { productionId: string }) {
  const { me } = useAuth();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['finance', productionId],
    queryFn: () => api.get<FinanceResponse>(`/productions/${productionId}/finance`),
  });

  if (isLoading || !data) return <LoadingScreen />;

  const { production, totals, byClient, byWorker } = data;

  return (
    <div className="space-y-6 px-4 pb-6 pt-3">
      <PageHeader title="Profil" subtitle={`@${production.username}`} />

      {/* ── Agentlik kartasi ─────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={softSpring}
      >
        <Card className="overflow-hidden !p-0">
          {/* Yuqori qismda ember lenta — logoning "muhri" */}
          <div className="ember relative h-[74px]">
            <LogoMark
              size={150}
              rounded={false}
              className="pointer-events-none absolute -right-6 -top-8 text-white/[0.09]"
            />
          </div>

          <div className="px-4 pb-4">
            <div className="-mt-8 flex items-end gap-3.5">
              <span className="rounded-[24px] bg-surface p-1 shadow-card">
                <Avatar name={production.name} photoUrl={production.photoUrl} size={68} />
              </span>
              <div className="min-w-0 flex-1 pb-1">
                <div className="truncate text-[19px] font-extrabold tracking-[-0.03em]">
                  {production.name}
                </div>
                {me && (
                  <div className="mt-1">
                    <Badge tone="brand" icon="spark">
                      {me.user.roleLabel}
                    </Badge>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-4 flex gap-2">
              <Button
                className="flex-1"
                variant="secondary"
                icon="edit"
                onClick={() => setEditOpen(true)}
              >
                Tahrirlash
              </Button>
              <Button className="flex-1" icon="plus" onClick={() => setInviteOpen(true)}>
                Qo&apos;shish
              </Button>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* ── Moliya ───────────────────────────────────────────── */}
      <Section title="Moliya jamlanmasi">
        <div className="grid grid-cols-2 gap-2.5">
          <Stat
            icon="wallet"
            label="Klientlardan"
            value={totals.receivedFromClients}
            format={money}
            tone="ok"
          />
          <Stat icon="send" label="Jamoaga to'langan" value={totals.paidToTeam} format={money} />
          <Stat
            icon="trend"
            label="Foyda"
            value={totals.profit}
            format={money}
            tone={totals.profit >= 0 ? 'brand' : 'danger'}
          />
          <Stat
            icon="clock"
            label="Jamoaga qarz"
            value={totals.debtToTeam}
            format={money}
            tone={totals.debtToTeam > 0 ? 'danger' : 'default'}
          />
        </div>
      </Section>

      {/* ── Premium ──────────────────────────────────────────── */}
      <Card tone="ember" className="overflow-hidden">
        <LogoMark
          size={130}
          rounded={false}
          className="pointer-events-none absolute -bottom-8 -right-5 text-white/[0.08]"
        />
        <div className="relative flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/18 text-white backdrop-blur-sm">
            {Icon.spark({ size: 21 })}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[15px] font-extrabold tracking-[-0.02em] text-white">
              Prodakshn Premium
            </div>
            <div className="text-[12.5px] text-white/70">
              Cheksiz klient, chuqur analitika, eksport
            </div>
          </div>
        </div>
        <button
          onClick={() => alertDialog('Premium obuna tez orada.')}
          className="relative mt-3.5 w-full rounded-2xl bg-white py-3 text-[15px] font-bold text-brand-deep active:opacity-85"
        >
          Obuna bo&apos;lish
        </button>
      </Card>

      <Button
        size="lg"
        variant="secondary"
        icon="send"
        onClick={() => openLink(TELEGRAM_CHANNEL)}
      >
        Telegram kanalga qo&apos;shilish
      </Button>

      {/* ── Kesimlar ─────────────────────────────────────────── */}
      <Section title="Klientlar bo'yicha">
        <AnimatedList className="space-y-2">
          {byClient.length === 0 && (
            <Card tone="flat">
              <div className="py-1 text-center text-[13.5px] text-faint">Ma&apos;lumot yo&apos;q</div>
            </Card>
          )}
          {byClient.map((c) => (
            <AnimatedItem key={c.clientId} className="mb-2">
              <Card>
                <Row
                  left={
                    <div className="min-w-0">
                      <div className="truncate text-[15px] font-bold tracking-[-0.02em]">
                        {c.name}
                      </div>
                      <div className="nums text-[12px] text-muted">
                        {money(c.receivedAmount)} olingan · {money(c.paidToTeam)} to&apos;langan
                      </div>
                    </div>
                  }
                  right={
                    <div>
                      <div
                        className={cx(
                          'nums font-extrabold',
                          c.margin >= 0 ? 'text-ok' : 'text-danger',
                        )}
                      >
                        {money(c.margin)}
                      </div>
                      <div className="text-[10.5px] font-semibold uppercase tracking-[0.06em] text-faint">
                        foyda
                      </div>
                    </div>
                  }
                />
              </Card>
            </AnimatedItem>
          ))}
        </AnimatedList>
      </Section>

      <Section title="Ishchilar bo'yicha">
        <AnimatedList className="space-y-2">
          {byWorker.length === 0 && (
            <Card tone="flat">
              <div className="py-1 text-center text-[13.5px] text-faint">Ma&apos;lumot yo&apos;q</div>
            </Card>
          )}
          {byWorker.map((w) => (
            <AnimatedItem key={w.userId} className="mb-2">
              <Card>
                <Row
                  left={
                    <div className="flex items-center gap-3">
                      <Avatar name={w.name} photoUrl={w.photoUrl} size={38} />
                      <div className="min-w-0">
                        <div className="truncate text-[15px] font-bold tracking-[-0.02em]">
                          {w.name}
                        </div>
                        <div className="nums text-[12px] text-muted">
                          {money(w.paidAmount)} / {money(w.owedAmount)} to&apos;langan
                        </div>
                      </div>
                    </div>
                  }
                  right={
                    <div>
                      <div
                        className={cx(
                          'nums font-extrabold',
                          w.debt > 0 ? 'text-danger' : 'text-ok',
                        )}
                      >
                        {money(w.debt)}
                      </div>
                      <div className="text-[10.5px] font-semibold uppercase tracking-[0.06em] text-faint">
                        qarz
                      </div>
                    </div>
                  }
                />
              </Card>
            </AnimatedItem>
          ))}
        </AnimatedList>
      </Section>

      <DemoControls />

      <InviteSheet
        productionId={productionId}
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
      />
      <EditProductionSheet
        production={production}
        open={editOpen}
        onClose={() => setEditOpen(false)}
      />
    </div>
  );
}
