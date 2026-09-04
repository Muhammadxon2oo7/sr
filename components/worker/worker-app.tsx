'use client';

import { useState } from 'react';
import { TabBar, type TabDef } from '@/components/ui/tab-bar';
import { SwipeTabs } from '@/components/ui/swipe-tabs';
import { WorkerHome } from './worker-home';
import { WorkerProfile } from './worker-profile';
import { AdminApp } from '@/components/admin/admin-app';
import { useAuth } from '@/lib/auth';

type Tab = 'home' | 'profile' | 'admin';

const BASE_ORDER = ['home', 'profile'] as const;

export function WorkerApp({
  onOpenBusiness,
}: {
  /** Agentlik hisobiga o'tish */
  onOpenBusiness: (productionId: string) => void;
}) {
  const [tab, setTab] = useState<Tab>('home');
  const { me } = useAuth();
  const isAdmin = me?.user.isAdmin ?? false;

  const tabs: TabDef<Tab>[] = [
    { key: 'home', label: 'Asosiy', icon: 'home' },
    { key: 'profile', label: 'Profil', icon: 'user' },
    ...(isAdmin ? [{ key: 'admin' as const, label: 'Admin', icon: 'shield' as const }] : []),
  ];
  const order = isAdmin ? ([...BASE_ORDER, 'admin'] as const) : BASE_ORDER;

  return (
    <div className="mx-auto min-h-dvh max-w-lg overflow-x-hidden pb-28">
      {/* Chapga/o'ngga surish bilan ham tab almashadi */}
      <SwipeTabs order={order} active={tab} onChange={setTab}>
        {tab === 'home' && <WorkerHome />}
        {tab === 'profile' && <WorkerProfile onOpenBusiness={onOpenBusiness} />}
        {tab === 'admin' && <AdminApp />}
      </SwipeTabs>

      <TabBar tabs={tabs} active={tab} onChange={setTab} />
    </div>
  );
}
