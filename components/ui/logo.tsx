'use client';

import { useState } from 'react';
import { cx } from './index';

/**
 * Loyiha belgisi.
 *
 * `public/logo.svg` (yoki `logo.png`) mavjud bo'lsa — o'sha ishlatiladi.
 * Fayl bo'lmasa quyidagi geometrik belgi ko'rsatiladi: burchakli kesim va
 * "play" uchburchagi — prodakshn/video ma'nosini beradi.
 */
export function Logo({
  size = 40,
  className,
  rounded = true,
}: {
  size?: number;
  className?: string;
  rounded?: boolean;
}) {
  const [custom, setCustom] = useState(true);

  if (custom) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src="/logo.svg"
        alt="Prodakshn"
        width={size}
        height={size}
        onError={() => setCustom(false)}
        className={cx('shrink-0 object-contain', rounded && 'rounded-[22%]', className)}
        style={{ width: size, height: size }}
      />
    );
  }

  return <LogoMark size={size} className={className} rounded={rounded} />;
}

/** Ichki (zaxira) belgi — sof geometrik, faqat oq va qora. */
export function LogoMark({
  size = 40,
  className,
  rounded = true,
}: {
  size?: number;
  className?: string;
  rounded?: boolean;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      className={cx('shrink-0', className)}
      aria-label="Prodakshn"
    >
      <rect width="48" height="48" rx={rounded ? 11 : 0} fill="currentColor" />
      {/* Burchakli kesim — yuqori o'ng tomondan */}
      <path d="M48 0 L48 15 L33 0 Z" className="fill-bg" />
      {/* Play uchburchagi */}
      <path d="M19 15.5 L34 24 L19 32.5 Z" className="fill-bg" />
      {/* Chap ustun */}
      <rect x="11" y="15.5" width="4.5" height="17" className="fill-bg" />
    </svg>
  );
}

/** Belgi + matn (login ekrani, sarlavhalar uchun) */
export function LogoLockup({ size = 32 }: { size?: number }) {
  return (
    <div className="flex items-center gap-2.5">
      <Logo size={size} />
      <span
        className="font-semibold tracking-tight"
        style={{ fontSize: size * 0.56, letterSpacing: '-0.03em' }}
      >
        Prodakshn
      </span>
    </div>
  );
}
