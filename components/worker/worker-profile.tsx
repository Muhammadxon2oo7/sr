'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { alertDialog, openLink } from '@/lib/telegram';
import type { WorkerDashboard } from '@/lib/types';
import { useState } from 'react';
import { Avatar, Button, Card, LoadingScreen, Row, Section, Sheet } from '@/components/ui';
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
    <div className="space-y-5 px-4 pb-6 pt-4">
      <h1 className="text-[24px] font-bold">Profil</h1>

      <Card>
        <div className="flex items-center gap-4">
          <Avatar name={user.name} photoUrl={user.photoUrl} size={64} />
          <div className="min-w-0">
            <div className="truncate text-[19px] font-bold">{user.name}</div>
            {user.username && <div className="text-[14px] text-tg-hint">@{user.username}</div>}
            <div className="mt-1 inline-block rounded-full bg-tg-button/10 px-2.5 py-0.5 text-[13px] font-medium text-tg-button">
              {user.roleLabel}
            </div>
          </div>
        </div>
      </Card>

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

      {data && data.groups.length > 0 && (
        <Section title="Prodakshnlar">
          <div className="space-y-2">
            {data.groups.map((g) => (
              <Card key={g.production.id}>
                <Row
                  left={
                    <div className="flex items-center gap-3">
                      <Avatar name={g.production.name} photoUrl={g.production.photoUrl} size={36} />
                      <div className="min-w-0">
                        <div className="truncate text-[15px] font-semibold">{g.production.name}</div>
                        <div className="text-[12px] text-tg-hint">@{g.production.username}</div>
                      </div>
                    </div>
                  }
                  right={
                    <div className="text-[13px] text-tg-hint">{g.clients.length} klient</div>
                  }
                />
              </Card>
            ))}
          </div>
        </Section>
      )}

      <Button size="lg" variant="secondary" onClick={() => setFindOpen(true)}>
        Agentlik topish
      </Button>

      <DemoControls />

      <p className="px-1 text-center text-[12px] text-tg-hint">
        Rol bir marta tanlanadi va o&apos;zgartirilmaydi.
      </p>

      <Sheet open={findOpen} onClose={() => setFindOpen(false)} title="Agentlik topish">
        <FindProduction onDone={() => setFindOpen(false)} />
      </Sheet>
    </div>
  );
}
