'use client';

import {
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { api, setToken } from './api';
import { tg } from './telegram';
import type { MeResponse } from './types';

interface AuthState {
  loading: boolean;
  error: string | null;
  me: MeResponse | null;
  /** Deep link parametri (`prod_<id>`) — mavjud bo'lsa */
  startParam: string | null;
  refresh: () => Promise<void>;
  setMe: (me: MeResponse) => void;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [me, setMeState] = useState<MeResponse | null>(null);
  const [startParam, setStartParam] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const data = await api.get<MeResponse>('/me');
    setMeState(data);
  }, []);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const app = tg();
        app?.ready();
        app?.expand();
        app?.disableVerticalSwipes?.();

        // Deep link: `t.me/bot?start=prod_<id>` orqali kelgan taklif
        const url = new URL(window.location.href);
        const param =
          app?.initDataUnsafe?.start_param ??
          url.searchParams.get('tgWebAppStartParam') ??
          url.searchParams.get('startapp') ??
          null;
        if (!cancelled) setStartParam(param);

        if (app?.initData) {
          // Telegram imzosini serverda tekshiramiz — bu yagona
          // haqiqiy autentifikatsiya yo'li.
          const res = await api.post<{ token: string }>('/auth/telegram', {
            initData: app.initData,
            startParam: param ?? undefined,
          });
          setToken(res.token);
        } else {
          // Telegram tashqarisida. Server `ALLOW_DEV_LOGIN=true` bilan
          // ishlayotgan bo'lsagina `?devId=...` bilan kirish mumkin;
          // ishlab chiqarishda bu yo'l yopiq.
          const devId = url.searchParams.get('devId');
          if (!devId) {
            throw new Error(
              'Bu ilova Telegram ichida ochilishi kerak. @prodlyappbot ni oching va "Ilovani ochish" tugmasini bosing.',
            );
          }
          const res = await api.post<{ token: string }>('/auth/dev', {
            telegramId: devId,
            firstName: url.searchParams.get('devName') ?? `Dev ${devId}`,
            startParam: param ?? undefined,
          });
          setToken(res.token);
        }

        await refresh();
      } catch (err) {
        if (!cancelled) setError((err as Error).message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [refresh]);

  const value = useMemo<AuthState>(
    () => ({ loading, error, me, startParam, refresh, setMe: setMeState }),
    [loading, error, me, startParam, refresh],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth AuthProvider ichida ishlatilishi kerak');
  return ctx;
}
