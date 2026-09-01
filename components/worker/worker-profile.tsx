'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { alertDialog, openLink } from '@/lib/telegram';
import type { WorkerDashboard } from '@/lib/types';
import { useState } from 'react';
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
  Sheet,
} from '@/components/ui';
import { motion, softSpring } from '@/components/ui/motion';
import { FindProduction } from '@/components/onboarding/find-production';

/** Rasmiy kanal — `.env` orqali almashtiriladi. */
const TELEGRAM_CHANNEL = process.env.NEXT_PUBLIC_TELEGRAM_CHANNEL ?? 'https://t.me/telegram';

/** Profil tab'i (TZ 6.3). */
export function WorkerProfile() {
  const { me } = useAuth();
  const [findOpen, setFindOpen] = useState(false);

  const { data } = useQuery({
    queryKey: ['worker-dashboard'],
    queryFn: () => api.get<WorkerDashboard>('/me/dashboard'),
  });

  if (!me) return <LoadingScreen />;
  const user = me.user;

  return (
    <div className="space-y-5 px-4 pb-6 pt-3">
      <PageHeader title="Profil" subtitle={user.username ? `@${user.username}` : undefined} />

      {/* ── Shaxs kartasi ────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={softSpring}
      >
        <Card tone="ember" className="!p-4">
          <EmberWatermark size={150} position="-right-9 -top-10" />
          <div className="ember-scrim pointer-events-none absolute inset-0" />

          <div className="relative flex items-center gap-3.5">
            <span className="rounded-[21px] bg-white/20 p-[3px] ring-1 ring-white/30 backdrop-blur-md">
              <Avatar name={user.name} photoUrl={user.photoUrl} size={58} />
            </span>
            <div className="min-w-0 flex-1">
              <div className="display truncate text-[19px] font-extrabold text-white">
                {user.name}
              </div>
              <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                {user.username && <Badge tone="onEmber">@{user.username}</Badge>}
                <Badge tone="onEmber" icon="spark">
                  {user.roleLabel}
                </Badge>
              </div>
            </div>
          </div>
        </Card>
      </motion.div>

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
              Ko&apos;proq buyurtma, tezroq to&apos;lov
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

      {data && data.groups.length > 0 && (
        <Section title="Prodakshnlar">
          <div className="space-y-2">
            {data.groups.map((g) => (
              <Card key={g.production.id}>
                <Row
                  left={
                    <div className="flex items-center gap-3">
                      <Avatar name={g.production.name} photoUrl={g.production.photoUrl} size={38} />
                      <div className="min-w-0">
                        <div className="truncate text-[15px] font-bold tracking-[-0.02em]">
                          {g.production.name}
                        </div>
                        <div className="text-[12px] text-muted">@{g.production.username}</div>
                      </div>
                    </div>
                  }
                  right={<Badge>{g.clients.length} klient</Badge>}
                />
              </Card>
            ))}
          </div>
        </Section>
      )}

      <div className="space-y-2">
        <Button size="lg" variant="secondary" icon="search" onClick={() => setFindOpen(true)}>
          Agentlik topish
        </Button>
        <Button
          size="lg"
          variant="secondary"
          icon="send"
          onClick={() => openLink(TELEGRAM_CHANNEL)}
        >
          Telegram kanalga qo&apos;shilish
        </Button>
      </div>

      <p className="px-6 text-center text-[11.5px] leading-relaxed text-faint">
        Rol bir marta tanlanadi va o&apos;zgartirilmaydi.
      </p>

      <Sheet open={findOpen} onClose={() => setFindOpen(false)} title="Agentlik topish">
        <FindProduction onDone={() => setFindOpen(false)} />
      </Sheet>
    </div>
  );
}
