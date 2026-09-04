'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { EmptyState, LoadingScreen } from '@/components/ui';
import { RoleSelect } from '@/components/onboarding/role-select';
import { ManagerApp } from '@/components/manager/manager-app';
import { WorkerApp } from '@/components/worker/worker-app';
import {
  ContextPicker,
  MANAGED_CONTEXT_KEY,
  WORKER_CONTEXT,
} from '@/components/onboarding/context-picker';

/**
 * Ilova qaysi ekranni ko'rsatishini hal qiladi.
 *
 * Rol endi PRODAKSHN ICHIDA belgilanadi, ya'ni bitta odam A agentligida
 * menejer, B agentligida montajyor bo'lishi mumkin. Shuning uchun
 * "menejermisan?" degan bitta global savol o'rniga kontekst tanlanadi:
 *
 *   - `me.managed` bo'sh          → ishchi ekrani
 *   - bitta kontekst              → to'g'ridan-to'g'ri menejer paneli
 *   - bir nechta kontekst yoki
 *     ishchilik ham bor           → foydalanuvchi tanlaydi
 *
 * Tanlov `localStorage` da saqlanadi: ilova har ochilganda qayta
 * so'ramaydi, lekin profildan istalgan payt almashtirish mumkin.
 */
export function AppShell() {
  const { loading, error, me } = useAuth();
  const [context, setContext] = useState<string | null>(null);
  const [restored, setRestored] = useState(false);

  const managed = me?.managed ?? [];

  useEffect(() => {
    try {
      setContext(localStorage.getItem(MANAGED_CONTEXT_KEY));
    } catch {
      // Shaxsiy rejimda localStorage o'qib bo'lmaydi — muhim emas
    }
    setRestored(true);
  }, []);

  function choose(next: string | null) {
    setContext(next);
    try {
      if (next === null) localStorage.removeItem(MANAGED_CONTEXT_KEY);
      else localStorage.setItem(MANAGED_CONTEXT_KEY, next);
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

  // 2. Hech qayerda menejer emas — ishchi ekrani
  //    (agentlik yaratish tugmasi profil ichida turadi)
  if (managed.length === 0) return <WorkerApp />;

  // 3. "O'z ishlarim" rejimi ataylab tanlangan
  if (context === WORKER_CONTEXT) return <WorkerApp onSwitch={() => choose(null)} />;

  // 4. Saqlangan tanlov hali ham amal qiladimi
  //    (menejerlikdan tushirilgan bo'lsa ro'yxatda topilmaydi)
  const active = managed.find((m) => m.production.id === context);
  if (active) return <ManagerApp production={active.production} onSwitch={() => choose(null)} />;

  // 5. Bitta kontekst va boshqa ishi yo'q — tanlashning hojati yo'q
  if (managed.length === 1 && me.worksIn === 0) {
    return <ManagerApp production={managed[0].production} onSwitch={() => choose(null)} />;
  }

  // 6. Bir nechta o'rin — foydalanuvchi tanlaydi
  return <ContextPicker managed={managed} worksIn={me.worksIn} onPick={choose} />;
}
