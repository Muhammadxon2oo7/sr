'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { alertDialog, openLink } from '@/lib/telegram';
import { money } from '@/lib/format';
import type { FinanceResponse } from '@/lib/types';
import { Avatar, Button, Card, LoadingScreen, Row, Section, Stat, cx } from '@/components/ui';
import { AnimatedItem, AnimatedList } from '@/components/ui/motion';
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
    <div className="space-y-5 px-4 pb-6 pt-4">
      <h1 className="text-[24px] font-bold">Profil</h1>

      {/* Agentlik */}
      <Card>
        <div className="flex items-center gap-4">
          <Avatar name={production.name} photoUrl={production.photoUrl} size={64} />
          <div className="min-w-0">
            <div className="truncate text-[19px] font-bold">{production.name}</div>
            <div className="text-[13px] text-tg-hint">@{production.username}</div>
            {me && (
              <div className="mt-1 inline-block rounded-full bg-tg-button/10 px-2.5 py-0.5 text-[12px] font-medium text-tg-button">
                {me.user.roleLabel}
              </div>
            )}
          </div>
        </div>
        <div className="mt-3 flex gap-2">
          <Button className="flex-1" variant="secondary" onClick={() => setEditOpen(true)}>
            Tahrirlash
          </Button>
          <Button className="flex-1" onClick={() => setInviteOpen(true)}>
            + Jamoaga qo&apos;shish
          </Button>
        </div>
      </Card>

      {/* Moliya jamlanmasi */}
      <Section title="Moliya">
        <div className="grid grid-cols-2 gap-2">
          <Stat
            label="Klientlardan olingan"
            value={totals.receivedFromClients}
            format={money}
            tone="ok"
          />
          <Stat label="Jamoaga to'langan" value={totals.paidToTeam} format={money} />
          <Stat
            label="Foyda"
            value={totals.profit}
            format={money}
            tone={totals.profit >= 0 ? 'ok' : 'danger'}
          />
          <Stat
            label="Jamoaga qarz"
            value={totals.debtToTeam}
            format={money}
            tone={totals.debtToTeam > 0 ? 'danger' : 'default'}
          />
        </div>
      </Section>

      <Section>
        <Card className="space-y-2">
          <Button className="w-full" onClick={() => alertDialog('Premium obuna tez orada.')}>
            Premiumga obuna
          </Button>
          <Button
            className="w-full"
            variant="secondary"
            onClick={() => openLink(TELEGRAM_CHANNEL)}
          >
            Telegram kanalga qo&apos;shilish
          </Button>
        </Card>
      </Section>

      <Section title="Klientlar bo'yicha">
        <AnimatedList className="space-y-2">
          {byClient.length === 0 && (
            <Card>
              <div className="py-2 text-center text-[14px] text-tg-hint">Ma&apos;lumot yo&apos;q</div>
            </Card>
          )}
          {byClient.map((c) => (
            <AnimatedItem key={c.clientId} className="mb-2">
              <Card>
                <Row
                  left={
                    <div className="min-w-0">
                      <div className="truncate text-[15px] font-semibold">{c.name}</div>
                      <div className="text-[12px] text-tg-hint">
                        {money(c.receivedAmount)} olingan · {money(c.paidToTeam)} to&apos;langan
                      </div>
                    </div>
                  }
                  right={
                    <div>
                      <div className={cx('font-bold', c.margin >= 0 ? 'text-ok' : 'text-danger')}>
                        {money(c.margin)}
                      </div>
                      <div className="text-[11px] text-tg-hint">foyda</div>
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
            <Card>
              <div className="py-2 text-center text-[14px] text-tg-hint">Ma&apos;lumot yo&apos;q</div>
            </Card>
          )}
          {byWorker.map((w) => (
            <AnimatedItem key={w.userId} className="mb-2">
              <Card>
                <Row
                  left={
                    <div className="flex items-center gap-3">
                      <Avatar name={w.name} photoUrl={w.photoUrl} size={36} />
                      <div className="min-w-0">
                        <div className="truncate text-[15px] font-semibold">{w.name}</div>
                        <div className="text-[12px] text-tg-hint">
                          {money(w.paidAmount)} / {money(w.owedAmount)} to&apos;langan
                        </div>
                      </div>
                    </div>
                  }
                  right={
                    <div>
                      <div className={cx('font-bold', w.debt > 0 ? 'text-danger' : 'text-ok')}>
                        {money(w.debt)}
                      </div>
                      <div className="text-[11px] text-tg-hint">qarz</div>
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
