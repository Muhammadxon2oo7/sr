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
  Icon,
  LoadingScreen,
  LogoMark,
  PageHeader,
  Row,
  Section,
  Sheet,
} from '@/components/ui';
import { motion, softSpring } from '@/components/ui/motion';
import { FindProduction } from '@/components/onboarding/find-production';
import { DemoControls } from '@/components/demo/demo-controls';

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
    <div className="space-y-6 px-4 pb-6 pt-3">
      <PageHeader title="Profil" subtitle={user.username ? `@${user.username}` : undefined} />

      {/* ── Shaxs kartasi ────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={softSpring}
      >
        <Card className="overflow-hidden !p-0">
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
                <Avatar name={user.name} photoUrl={user.photoUrl} size={68} />
              </span>
              <div className="min-w-0 flex-1 pb-1">
                <div className="truncate text-[19px] font-extrabold tracking-[-0.03em]">
                  {user.name}
                </div>
                <div className="mt-1">
                  <Badge tone="brand" icon="spark">
                    {user.roleLabel}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </motion.div>

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
            <div className="text-[12.5px] text-white/70">Ko&apos;proq buyurtma, tezroq to&apos;lov</div>
          </div>
        </div>
        <button
          onClick={() => alertDialog('Premium obuna tez orada.')}
          className="relative mt-3.5 w-full rounded-2xl bg-white py-3 text-[15px] font-bold text-brand-deep active:opacity-85"
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

      <DemoControls />

      <p className="px-6 text-center text-[11.5px] leading-relaxed text-faint">
        Rol bir marta tanlanadi va o&apos;zgartirilmaydi.
      </p>

      <Sheet open={findOpen} onClose={() => setFindOpen(false)} title="Agentlik topish">
        <FindProduction onDone={() => setFindOpen(false)} />
      </Sheet>
    </div>
  );
}
