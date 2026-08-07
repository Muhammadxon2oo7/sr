'use client';

import { useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { DashboardResponse, ProductionDto } from '@/lib/types';
import { TabBar, type TabDef } from '@/components/ui/tab-bar';
import { AnimatePresence, motion, tabVariants } from '@/components/ui/motion';
import { HomeTab } from './home-tab';
import { TeamTab } from './team-tab';
import { ClientsTab } from './clients-tab';
import { ProfileTab } from './profile-tab';

type Tab = 'home' | 'team' | 'clients' | 'profile';

const ORDER: Tab[] = ['home', 'team', 'clients', 'profile'];

export function ManagerApp({ production }: { production: ProductionDto }) {
  const [tab, setTab] = useState<Tab>('home');
  // Tab qaysi tomonga siljishini aniqlaydi (chapga yoki o'ngga)
  const direction = useRef(1);

  function goTo(next: Tab) {
    direction.current = ORDER.indexOf(next) > ORDER.indexOf(tab) ? 1 : -1;
    setTab(next);
  }

  const dashboard = useQuery({
    queryKey: ['dashboard', production.id],
    queryFn: () => api.get<DashboardResponse>(`/productions/${production.id}/dashboard`),
  });

  const pendingCount = dashboard.data?.pendingRequests.length ?? 0;

  const tabs: TabDef<Tab>[] = [
    { key: 'home', label: 'Bosh sahifa', icon: '🏠' },
    { key: 'team', label: 'Jamoa', icon: '👥', badge: pendingCount || undefined },
    { key: 'clients', label: 'Klientlar', icon: '💼' },
    { key: 'profile', label: 'Profil', icon: '👤' },
  ];

  return (
    <div className="mx-auto min-h-dvh max-w-lg overflow-x-hidden pb-24">
      <AnimatePresence mode="wait" custom={direction.current} initial={false}>
        <motion.div
          key={tab}
          custom={direction.current}
          variants={tabVariants}
          initial="enter"
          animate="center"
          exit="exit"
        >
          {tab === 'home' && <HomeTab productionId={production.id} />}
          {tab === 'team' && <TeamTab productionId={production.id} />}
          {tab === 'clients' && <ClientsTab productionId={production.id} />}
          {tab === 'profile' && <ProfileTab productionId={production.id} />}
        </motion.div>
      </AnimatePresence>

      <TabBar tabs={tabs} active={tab} onChange={goTo} />
    </div>
  );
}
