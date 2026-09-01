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
  EmberWatermark,
  Icon,
  LoadingScreen,
  PageHeader,
  Row,
  Section,
  Stat,
  cx,
} from '@/components/ui';
import { AnimatedItem, AnimatedList, motion, softSpring } from '@/components/ui/motion';
import { InviteSheet } from './invite-sheet';
import { EditProductionSheet } from './edit-production-sheet';
import { DangerZone } from '@/components/account/danger-zone';

/** Rasmiy kanal — `.env` orqali almashtiriladi. */
const TELEGRAM_CHANNEL = process.env.NEXT_PUBLIC_TELEGRAM_CHANNEL ?? 'https://t.me/prodlyapp';

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
    <div className="space-y-5 px-4 pb-6 pt-3">
      <PageHeader title="Profil" subtitle={`@${production.username}`} />

      {/* ── Agentlik kartasi ─────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={softSpring}
      >
        <Card tone="ember" className="!p-4">
          {/* Suv belgisi → parda → kontent. Parda tufayli matn gradientning
              yorug' uchida ham to'liq o'qiladi. */}
          <EmberWatermark size={150} position="-right-9 -top-10" />
          <div className="ember-scrim pointer-events-none absolute inset-0" />

          <div className="relative">
            <div className="flex items-center gap-3.5">
              <span className="rounded-[21px] bg-white/20 p-[3px] ring-1 ring-white/30 backdrop-blur-md">
                <Avatar name={production.name} photoUrl={production.photoUrl} size={58} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="display truncate text-[19px] font-extrabold text-white">
                  {production.name}
                </div>
                <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                  <Badge tone="onEmber">@{production.username}</Badge>
                  {me && (
                    <Badge tone="onEmber" icon="spark">
                      {me.user.roleLabel}
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-4 flex gap-2">
              <button
                onClick={() => setEditOpen(true)}
                className="glass-on-ember flex flex-1 items-center justify-center gap-2 rounded-[15px] py-2.5 text-[14.5px] font-bold text-white ring-1 ring-white/20 active:opacity-80"
              >
                {Icon.edit({ size: 16, strokeWidth: 2.1 })} Tahrirlash
              </button>
              <button
                onClick={() => setInviteOpen(true)}
                className="flex flex-1 items-center justify-center gap-2 rounded-[15px] bg-white py-2.5 text-[14.5px] font-extrabold text-brand-deep active:opacity-85"
              >
                {Icon.plus({ size: 16, strokeWidth: 2.6 })} Qo&apos;shish
              </button>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* ── Moliya ───────────────────────────────────────────── */}
      <Section title="Moliya jamlanmasi">
        <div className="grid grid-cols-2 gap-2">
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
      <Card tone="ember">
        <EmberWatermark size={116} position="-bottom-9 -right-6" />
        <div className="ember-scrim pointer-events-none absolute inset-0" />

        <div className="relative flex items-center gap-3">
          <div className="glass-on-ember flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] text-white">
            {Icon.spark({ size: 19 })}
          </div>
          <div className="min-w-0 flex-1">
            <div className="display text-[15px] font-extrabold text-white">Prodly Premium</div>
            <div className="truncate text-[12px] text-white/75">
              Cheksiz klient, analitika, eksport
            </div>
          </div>
        </div>
        <button
          onClick={() => alertDialog('Premium obuna tez orada.')}
          className="relative mt-3 w-full rounded-[15px] bg-white py-2.5 text-[15px] font-extrabold text-brand-deep active:opacity-85"
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
                        <div className="flex items-center gap-1.5">
                          <span className="truncate text-[15px] font-bold tracking-[-0.02em]">
                            {w.name}
                          </span>
                          {w.isDeleted && <Badge tone="neutral">hisob o&apos;chirilgan</Badge>}
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

      <DangerZone productionId={productionId} />

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
