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
import { AdminApp } from '@/components/admin/admin-app';
import { useAuth } from '@/lib/auth';
import { AccountBar } from './account-bar';

type Tab = 'home' | 'team' | 'clients' | 'profile' | 'admin';

const BASE_ORDER = ['home', 'team', 'clients', 'profile'] as const;

export function ManagerApp({
  production,
  onExit,
}: {
  production: ProductionDto;
  /** Shaxsiy hisobga qaytish */
  onExit: () => void;
}) {
  const [tab, setTab] = useState<Tab>('home');
  const { me } = useAuth();
  const isAdmin = me?.user.isAdmin ?? false;
  const isOwner = me?.user.id === production.ownerId;

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
    ...(isAdmin ? [{ key: 'admin' as const, label: 'Admin', icon: 'shield' as const }] : []),
  ];
  const order = isAdmin ? ([...BASE_ORDER, 'admin'] as const) : BASE_ORDER;

  return (
    <div className="mx-auto min-h-dvh max-w-lg overflow-x-hidden pb-28">
      {/* Doimiy eslatma: bu shaxsiy hisob emas, agentlik hisobi */}
      <AccountBar production={production} isOwner={isOwner} onExit={onExit} />

      {/* Chapga/o'ngga surish bilan ham tab almashadi */}
      <SwipeTabs order={order} active={tab} onChange={setTab}>
        {tab === 'home' && <HomeTab productionId={production.id} />}
        {tab === 'team' && <TeamTab productionId={production.id} />}
        {tab === 'clients' && <ClientsTab productionId={production.id} />}
        {tab === 'profile' && <ProfileTab productionId={production.id} onExit={onExit} />}
        {tab === 'admin' && <AdminApp />}
      </SwipeTabs>

      <TabBar tabs={tabs} active={tab} onChange={setTab} />
    </div>
  );
}
