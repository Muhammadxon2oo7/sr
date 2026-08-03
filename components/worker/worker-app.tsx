'use client';

import { useRef, useState } from 'react';
import { TabBar, type TabDef } from '@/components/ui/tab-bar';
import { IconHome, IconUser } from '@/components/ui/icons';
import { AnimatePresence, motion, tabVariants } from '@/components/ui/motion';
import { WorkerHome } from './worker-home';
import { WorkerProfile } from './worker-profile';

type Tab = 'home' | 'profile';

const tabs: TabDef<Tab>[] = [
  { key: 'home', label: 'Bosh sahifa', icon: <IconHome size={21} /> },
  { key: 'profile', label: 'Profil', icon: <IconUser size={21} /> },
];

export function WorkerApp() {
  const [tab, setTab] = useState<Tab>('home');
  const direction = useRef(1);

  function goTo(next: Tab) {
    direction.current = next === 'profile' ? 1 : -1;
    setTab(next);
  }

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
          {tab === 'home' ? <WorkerHome /> : <WorkerProfile />}
        </motion.div>
      </AnimatePresence>

      <TabBar tabs={tabs} active={tab} onChange={goTo} />
    </div>
  );
}
