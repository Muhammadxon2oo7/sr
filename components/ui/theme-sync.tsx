'use client';

import { useEffect } from 'react';
import { tg } from '@/lib/telegram';

/**
 * Mavzuni Telegram bilan moslashtiradi.
 *
 * Ilova o'z palitrasiga ega (brend logosidan olingan), lekin foydalanuvchi
 * Telegramda yorug'/qorong'i rejimni tanlagan bo'lsa — biz shunga bo'ysunamiz.
 * Shuningdek Telegram sarlavhasi va foni ilova foni bilan bir xil bo'ladi,
 * shunda WebApp "ilovaning davomi" bo'lib ko'rinadi, qadama-qadam emas.
 */
export function ThemeSync() {
  useEffect(() => {
    const root = document.documentElement;
    const app = tg();

    if (app?.colorScheme) root.dataset.theme = app.colorScheme;

    // Joriy canvas rangini hisoblab, Telegram chrome'iga uzatamiz
    const apply = () => {
      const canvas = getComputedStyle(root).getPropertyValue('--c-canvas').trim();
      if (!canvas) return;
      const hex = toHex(canvas);
      if (!hex) return;
      app?.setHeaderColor?.(hex);
      app?.setBackgroundColor?.(hex);
      document
        .querySelector('meta[name="theme-color"]')
        ?.setAttribute('content', hex);
    };

    apply();

    // Tizim mavzusi o'zgarsa (Telegram tanlovi bo'lmasa) — qayta hisoblaymiz
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => apply();
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  return null;
}

/** `#rrggbb` ko'rinishiga keltiradi — Telegram faqat shu formatni qabul qiladi. */
function toHex(color: string): string | null {
  if (color.startsWith('#')) return color.length === 4
    ? `#${color[1]}${color[1]}${color[2]}${color[2]}${color[3]}${color[3]}`
    : color;

  const m = color.match(/rgba?\(([^)]+)\)/);
  if (!m) return null;
  const [r, g, b] = m[1].split(',').map((v) => Math.round(Number(v.trim())));
  return `#${[r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')}`;
}
