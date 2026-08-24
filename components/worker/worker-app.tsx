'use client';

import { useState } from 'react';
import { TabBar, type TabDef } from '@/components/ui/tab-bar';
import { SwipeTabs } from '@/components/ui/swipe-tabs';
import { WorkerHome } from './worker-home';
import { WorkerProfile } from './worker-profile';

type Tab = 'home' | 'profile';

const ORDER = ['home', 'profile'] as const;

const tabs: TabDef<Tab>[] = [
  { key: 'home', label: 'Asosiy', icon: 'home' },
  { key: 'profile', label: 'Profil', icon: 'user' },
];

export function WorkerApp() {
  const [tab, setTab] = useState<Tab>('home');

  return (
    <div className="mx-auto min-h-dvh max-w-lg overflow-x-hidden pb-28">
      {/* Chapga/o'ngga surish bilan ham tab almashadi */}
      <SwipeTabs order={ORDER} active={tab} onChange={setTab}>
        {tab === 'home' ? <WorkerHome /> : <WorkerProfile />}
      </SwipeTabs>

      <TabBar tabs={tabs} active={tab} onChange={setTab} />
    </div>
  );
}
