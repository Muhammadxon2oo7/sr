'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { money } from '@/lib/format';
import type { WorkerDashboard } from '@/lib/types';
import { useState } from 'react';
import { Avatar, Button, Card, LoadingScreen, Row, Section, Sheet } from '@/components/ui';
import { FindProduction } from '@/components/onboarding/find-production';
import { DemoControls } from '@/components/demo/demo-controls';

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
            {user.username && <div className="text-[14px] text-fg-muted">@{user.username}</div>}
            <div className="mt-1 inline-block rounded-full bg-muted px-2.5 py-0.5 text-[13px] font-medium text-fg">
              {user.roleLabel}
            </div>
          </div>
        </div>
      </Card>

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
                        <div className="text-[12px] text-fg-muted">@{g.production.username}</div>
                      </div>
                    </div>
                  }
                  right={
                    <div className="text-[13px] text-fg-muted">{g.clients.length} klient</div>
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

      <p className="px-1 text-center text-[12px] text-fg-muted">
        Rol bir marta tanlanadi va o&apos;zgartirilmaydi.
      </p>

      <Sheet open={findOpen} onClose={() => setFindOpen(false)} title="Agentlik topish">
        <FindProduction onDone={() => setFindOpen(false)} />
      </Sheet>
    </div>
  );
}
