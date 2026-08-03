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
import { DEMO, api, setToken } from './api';
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
  /** Demo rejim: login/parol bilan kirish */
  demo: boolean;
  needsLogin: boolean;
  loginAs: (userId: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthState | null>(null);

/**
 * Telegram yorug'/qorong'i rejimini <html data-theme> ga o'tkazadi.
 * Telegram tashqarisida — tizim sozlamasi (CSS media query) ishlaydi.
 */
function applyColorScheme(scheme?: 'light' | 'dark') {
  if (typeof document === 'undefined' || !scheme) return;
  document.documentElement.dataset.theme = scheme;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [me, setMeState] = useState<MeResponse | null>(null);
  const [startParam, setStartParam] = useState<string | null>(null);
  const [needsLogin, setNeedsLogin] = useState(false);

  const refresh = useCallback(async () => {
    const data = await api.get<MeResponse>('/me');
    setMeState(data);
  }, []);

  const loginAs = useCallback(
    async (userId: string) => {
      const { setSession } = await import('./mock/store');
      setSession(userId);
      setNeedsLogin(false);
      setLoading(true);
      try {
        await refresh();
        setError(null);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    },
    [refresh],
  );

  const logout = useCallback(() => {
    void import('./mock/store').then(({ setSession }) => setSession(null));
    setMeState(null);
    setNeedsLogin(true);
  }, []);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        // ── Demo rejim: server yo'q, login/parol bilan kiriladi ──
        if (DEMO) {
          applyColorScheme(tg()?.colorScheme);
          const { getSession } = await import('./mock/store');
          if (!getSession()) {
            if (!cancelled) {
              setNeedsLogin(true);
              setLoading(false);
            }
            return;
          }
          await refresh();
          if (!cancelled) setLoading(false);
          return;
        }

        const app = tg();
        app?.ready();
        app?.expand();
        app?.disableVerticalSwipes?.();
        applyColorScheme(app?.colorScheme);

        const url = new URL(window.location.href);
        const param =
          app?.initDataUnsafe?.start_param ??
          url.searchParams.get('tgWebAppStartParam') ??
          url.searchParams.get('startapp') ??
          null;
        if (!cancelled) setStartParam(param);

        if (app?.initData) {
          const res = await api.post<{ token: string }>('/auth/telegram', {
            initData: app.initData,
            startParam: param ?? undefined,
          });
          setToken(res.token);
        } else {
          // Telegram tashqarisida — faqat development uchun
          const devId = url.searchParams.get('devId');
          if (!devId) {
            throw new Error(
              'Bu ilova Telegram ichida ochilishi kerak. Botni oching va "Ilovani ochish" tugmasini bosing.',
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
    () => ({
      loading,
      error,
      me,
      startParam,
      refresh,
      setMe: setMeState,
      demo: DEMO,
      needsLogin,
      loginAs,
      logout,
    }),
    [loading, error, me, startParam, refresh, needsLogin, loginAs, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth AuthProvider ichida ishlatilishi kerak');
  return ctx;
}
