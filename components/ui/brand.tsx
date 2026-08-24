'use client';

import { cx } from './cx';

/**
 * Logo belgisi — kesilgan geometrik "P".
 * Yuqoridagi "V" o'yig'i va ichidagi burchakli teshik montaj kesimini
 * eslatadi; shakl biroz oldinga engashgan — harakatdagi prodakshn.
 */
export function LogoMark({
  size = 40,
  className,
  rounded = true,
  glow = false,
}: {
  size?: number;
  className?: string;
  /** Gradient blok ichida (true) yoki faqat harf sifatida (false) */
  rounded?: boolean;
  glow?: boolean;
}) {
  return (
    <span
      className={cx(
        'relative inline-flex shrink-0 items-center justify-center overflow-hidden',
        rounded && 'ember',
        glow && 'shadow-glow',
        className,
      )}
      style={{
        width: size,
        height: size,
        borderRadius: rounded ? size * 0.28 : 0,
      }}
    >
      <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden="true">
        <path
          d="M29 26 L43 26 L48.5 31 L54 26 L79 26 L79 51.5 L53 55.5 L59.5 78 L31 78 Z
             M55 38.5 L68 37.5 L55 47.5 Z"
          fillRule="evenodd"
          fill={rounded ? '#fff' : 'currentColor'}
        />
      </svg>
    </span>
  );
}

/** Logo + nom — kirish va onboarding sarlavhalarida. */
export function Wordmark({ size = 44 }: { size?: number }) {
  return (
    <div className="flex items-center gap-3">
      <LogoMark size={size} glow />
      <div className="leading-none">
        <div
          className="font-extrabold tracking-[-0.04em]"
          style={{ fontSize: size * 0.55 }}
        >
          Prodakshn
        </div>
        <div className="eyebrow mt-1.5">Studio OS</div>
      </div>
    </div>
  );
}

/**
 * Logodagi diagonal kesim motivi — kartalar burchagida
 * juda past kontrastli suv belgisi sifatida ishlatiladi.
 */
export function EmberWatermark({ className }: { className?: string }) {
  return (
    <LogoMark
      size={128}
      rounded={false}
      className={cx('pointer-events-none absolute text-white/10', className)}
    />
  );
}
