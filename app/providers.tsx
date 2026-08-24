'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { AuthProvider } from '@/lib/auth';
import { MotionConfig } from '@/components/ui/motion';
import { ThemeSync } from '@/components/ui/theme-sync';

export function Providers({ children }: { children: React.ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: 1,
            refetchOnWindowFocus: false,
            staleTime: 15_000,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={client}>
      {/* Tizimda "harakatni kamaytirish" yoqilgan bo'lsa — animatsiyalar avtomatik o'chadi */}
      <MotionConfig reducedMotion="user">
        {/* Telegram sarlavhasi/foni ilova palitrasiga moslanadi */}
        <ThemeSync />
        <AuthProvider>{children}</AuthProvider>
      </MotionConfig>
    </QueryClientProvider>
  );
}
