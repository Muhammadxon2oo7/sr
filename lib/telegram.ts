'use client';

export interface TelegramWebApp {
  initData: string;
  initDataUnsafe: {
    user?: { id: number; first_name: string; last_name?: string; username?: string };
    start_param?: string;
  };
  version: string;
  colorScheme: 'light' | 'dark';
  themeParams: Record<string, string>;
  isExpanded: boolean;
  ready(): void;
  expand(): void;
  close(): void;
  disableVerticalSwipes?(): void;
  setHeaderColor?(color: string): void;
  setBackgroundColor?(color: string): void;
  openTelegramLink?(url: string): void;
  showAlert?(message: string, cb?: () => void): void;
  showConfirm?(message: string, cb: (ok: boolean) => void): void;
  HapticFeedback?: {
    impactOccurred(style: 'light' | 'medium' | 'heavy'): void;
    notificationOccurred(type: 'error' | 'success' | 'warning'): void;
    selectionChanged(): void;
  };
  BackButton?: {
    show(): void;
    hide(): void;
    onClick(cb: () => void): void;
    offClick(cb: () => void): void;
  };
}

declare global {
  interface Window {
    Telegram?: { WebApp?: TelegramWebApp };
  }
}

export function tg(): TelegramWebApp | null {
  if (typeof window === 'undefined') return null;
  return window.Telegram?.WebApp ?? null;
}

export function isTelegram(): boolean {
  const app = tg();
  return Boolean(app?.initData);
}

export function haptic(type: 'light' | 'medium' | 'heavy' | 'success' | 'error' | 'warning') {
  const h = tg()?.HapticFeedback;
  if (!h) return;
  if (type === 'success' || type === 'error' || type === 'warning') {
    h.notificationOccurred(type);
  } else {
    h.impactOccurred(type);
  }
}

export function confirmDialog(message: string): Promise<boolean> {
  const app = tg();
  if (app?.showConfirm) {
    return new Promise((resolve) => app.showConfirm!(message, resolve));
  }
  return Promise.resolve(typeof window !== 'undefined' ? window.confirm(message) : false);
}

export function alertDialog(message: string): void {
  const app = tg();
  if (app?.showAlert) app.showAlert(message);
  else if (typeof window !== 'undefined') window.alert(message);
}

export function openLink(url: string) {
  const app = tg();
  if (app?.openTelegramLink && url.startsWith('https://t.me/')) app.openTelegramLink(url);
  else if (typeof window !== 'undefined') window.open(url, '_blank');
}

/**
 * Havolani Telegram kontaktlariga yuborish.
 * Telegram ichida chat tanlash oynasi ochiladi (foydalanuvchi kimga yuborishni o'zi tanlaydi).
 */
export function shareToTelegram(url: string, text: string) {
  const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`;
  const app = tg();

  // Telegram 6.1+ da chat tanlash oynasini ochadi
  if (app?.openTelegramLink) {
    app.openTelegramLink(shareUrl);
    return true;
  }
  // Brauzerda — Telegram Web ochiladi
  if (typeof window !== 'undefined') {
    window.open(shareUrl, '_blank');
    return true;
  }
  return false;
}

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}
