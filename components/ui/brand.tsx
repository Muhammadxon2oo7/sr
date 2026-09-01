'use client';

import { cx } from './cx';

/**
 * Logo belgisi — kesilgan geometrik "P".
 * Yuqoridagi "V" o'yig'i va ichidagi burchakli teshik montaj kesimini
 * eslatadi; shakl biroz oldinga engashgan — harakatdagi prodakshn.
 *
 * Diqqat: bu yerda `relative` qo'yilmaydi. Suv belgisi sifatida
 * ishlatilganda chaqiruvchi `absolute` beradi, va ikkalasi to'qnashsa
 * Tailwind'da `relative` yutib, belgi oqimda qolib kartani cho'zib
 * yuboradi (avval aynan shu xato kartalarni ulkan qilib qo'ygan edi).
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
        'inline-flex shrink-0 items-center justify-center overflow-hidden leading-none',
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
      <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden="true" className="block">
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

/**
 * Karta burchagidagi suv belgisi — brend imzosi.
 * Joylashuvi bir joyda belgilangan, shunda barcha ember kartalar
 * bir xil ritmda ko'rinadi va hech qayerda kontentni surib yubormaydi.
 */
export function EmberWatermark({
  size = 150,
  position = '-right-8 -top-7',
  className,
}: {
  size?: number;
  /**
   * Joylashuv klasslari alohida prop — `className` bilan aralashsa
   * Tailwind'da `top-auto` va `-top-7` kabi juftlar to'qnashib,
   * qaysi biri yutishi klass tartibiga emas, CSS tartibiga bog'liq
   * bo'lib qolardi. Shu sabab pozitsiya har doim to'liq almashtiriladi.
   */
  position?: string;
  className?: string;
}) {
  return (
    <LogoMark
      size={size}
      rounded={false}
      className={cx('pointer-events-none absolute text-white/[0.07]', position, className)}
    />
  );
}

/** Logo + nom — kirish va onboarding sarlavhalarida. */
export function Wordmark({ size = 44 }: { size?: number }) {
  return (
    <div className="flex items-center gap-3">
      <LogoMark size={size} glow />
      <div className="leading-none">
        <div className="display font-extrabold" style={{ fontSize: size * 0.55 }}>
          Prodly
        </div>
        <div className="eyebrow mt-1.5">Studio OS</div>
      </div>
    </div>
  );
}
