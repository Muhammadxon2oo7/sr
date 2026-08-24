'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { DashboardResponse, ProductionDto } from '@/lib/types';
import { TabBar, type TabDef } from '@/components/ui/tab-bar';
import { SwipeTabs } from '@/components/ui/swipe-tabs';
import { HomeTab } from './home-tab';
import { TeamTab } from './team-tab';
import { ClientsTab } from './clients-tab';
import { ProfileTab } from './profile-tab';

type Tab = 'home' | 'team' | 'clients' | 'profile';

const ORDER = ['home', 'team', 'clients', 'profile'] as const;

export function ManagerApp({ production }: { production: ProductionDto }) {
  const [tab, setTab] = useState<Tab>('home');

  const dashboard = useQuery({
    queryKey: ['dashboard', production.id],
    queryFn: () => api.get<DashboardResponse>(`/productions/${production.id}/dashboard`),
  });

  const pendingCount = dashboard.data?.pendingRequests.length ?? 0;

  const tabs: TabDef<Tab>[] = [
    { key: 'home', label: 'Asosiy', icon: 'home' },
    { key: 'team', label: 'Jamoa', icon: 'team', badge: pendingCount || undefined },
    { key: 'clients', label: 'Klientlar', icon: 'clients' },
    { key: 'profile', label: 'Profil', icon: 'user' },
  ];

  return (
    <div className="mx-auto min-h-dvh max-w-lg overflow-x-hidden pb-28">
      {/* Chapga/o'ngga surish bilan ham tab almashadi */}
      <SwipeTabs order={ORDER} active={tab} onChange={setTab}>
        {tab === 'home' && <HomeTab productionId={production.id} />}
        {tab === 'team' && <TeamTab productionId={production.id} />}
        {tab === 'clients' && <ClientsTab productionId={production.id} />}
        {tab === 'profile' && <ProfileTab productionId={production.id} />}
      </SwipeTabs>

      <TabBar tabs={tabs} active={tab} onChange={setTab} />
    </div>
  );
}
