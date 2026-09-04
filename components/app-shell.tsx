'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { EmptyState, LoadingScreen } from '@/components/ui';
import { RoleSelect } from '@/components/onboarding/role-select';
import { ManagerApp } from '@/components/manager/manager-app';
import { WorkerApp } from '@/components/worker/worker-app';

/** Ochilgan agentlik hisobi shu kalitda saqlanadi. */
const ACCOUNT_KEY = 'prodly:account';

/**
 * Ilova qaysi ekranni ko'rsatishini hal qiladi.
 *
 * Model oddiy: har kimning BITTA shaxsiy hisobi bor — u kasbini tanlaydi
 * va odatdagidek ishlaydi. Agentlik ochish ixtiyoriy; ochilgan agentlik
 * ALOHIDA HISOB bo'lib turadi va unga profildagi "Biznesim" bo'limidan
 * kiriladi. Ichkarida yuqori panel doim ko'rinadi, "Chiqish" esa shaxsiy
 * hisobga qaytaradi.
 *
 * Ochilgan hisob `localStorage` da saqlanadi: ilova qayta ochilganda
 * odam qolgan joyidan davom etadi.
 */
export function AppShell() {
  const { loading, error, me } = useAuth();
  const [account, setAccount] = useState<string | null>(null);
  const [restored, setRestored] = useState(false);

  useEffect(() => {
    try {
      setAccount(localStorage.getItem(ACCOUNT_KEY));
    } catch {
      // Shaxsiy rejimda localStorage o'qib bo'lmaydi — muhim emas
    }
    setRestored(true);
  }, []);

  function open(productionId: string | null) {
    setAccount(productionId);
    try {
      if (productionId === null) localStorage.removeItem(ACCOUNT_KEY);
      else localStorage.setItem(ACCOUNT_KEY, productionId);
    } catch {
      // saqlanmasa ham sessiya davomida ishlaydi
    }
  }

  if (loading || !restored) return <LoadingScreen />;

  if (error) {
    return <EmptyState icon="warning" title="Kirish amalga oshmadi" description={error} />;
  }

  if (!me) return <LoadingScreen />;

  // 1. Kasb tanlanmagan — birinchi qadam
  if (!me.user.role) return <RoleSelect />;

  // 2. Agentlik hisobi ochilganmi va u hali ham amal qiladimi?
  //    (menejerlikdan tushirilgan bo'lsa ro'yxatda topilmaydi)
  const active = me.managed.find((m) => m.production.id === account);
  if (active) {
    return (
      <ManagerApp
        key={active.production.id}
        production={active.production}
        onExit={() => open(null)}
      />
    );
  }

  // 3. Shaxsiy hisob — asosiy holat
  return <WorkerApp onOpenBusiness={open} />;
}
