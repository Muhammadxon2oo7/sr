'use client';

import { useAuth } from '@/lib/auth';
import { EmptyState, LoadingScreen } from '@/components/ui';
import { RoleSelect } from '@/components/onboarding/role-select';
import { CreateProduction } from '@/components/onboarding/create-production';
import { ManagerApp } from '@/components/manager/manager-app';
import { WorkerApp } from '@/components/worker/worker-app';

export function AppShell() {
  const { loading, error, me } = useAuth();

  if (loading) return <LoadingScreen />;

  if (error) {
    return <EmptyState icon="warning" title="Kirish amalga oshmadi" description={error} />;
  }

  if (!me) return <LoadingScreen />;

  // 1. Rol tanlanmagan — birinchi qadam
  if (!me.user.role) return <RoleSelect />;

  // 2. Menejer, lekin prodakshn yo'q
  if (me.user.isManager && me.ownedProductions.length === 0) return <CreateProduction />;

  // 3. Menejer paneli
  if (me.user.isManager) return <ManagerApp production={me.ownedProductions[0]} />;

  // 4. Ishchi paneli
  return <WorkerApp />;
}
