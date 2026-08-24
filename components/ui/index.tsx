'use client';

import { ReactNode, useEffect } from 'react';
import { assetUrl } from '@/lib/api';
import { initials } from '@/lib/format';
import { haptic } from '@/lib/telegram';
import { AnimatePresence, AnimatedNumber, motion, quick, softSpring, spring } from './motion';
import { Icon, type IconName } from './icons';
import { LogoMark } from './brand';
import { cx } from './cx';

export { cx };
export { Icon, type IconName } from './icons';
export { LogoMark, Wordmark } from './brand';

// ── Card / Section ────────────────────────────────────────────

/**
 * Asosiy sirt. Soyaga emas — nozik chegara + yumshoq soya kombinatsiyasiga
 * tayanadi, shunda qorong'i mavzuda ham qatlamlar aniq ajraladi.
 */
export function Card({
  children,
  className,
  onClick,
  tone = 'default',
}: {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  /** `ember` — brend gradientli kartа (faqat kalit blok uchun) */
  tone?: 'default' | 'ember' | 'flat';
}) {
  return (
    <motion.div
      whileTap={onClick ? { scale: 0.985 } : undefined}
      transition={spring}
      onClick={
        onClick
          ? () => {
              haptic('light');
              onClick();
            }
          : undefined
      }
      className={cx(
        'relative rounded-[22px] p-4',
        tone === 'ember' && 'ember overflow-hidden text-white shadow-glow',
        tone === 'default' && 'hairline bg-surface shadow-card',
        tone === 'flat' && 'bg-sunk',
        onClick && 'cursor-pointer',
        className,
      )}
    >
      {children}
    </motion.div>
  );
}

export function Section({
  title,
  action,
  children,
  className,
}: {
  title?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cx('space-y-2.5', className)}>
      {(title || action) && (
        <div className="flex items-center justify-between gap-3 px-1">
          {title && <h2 className="eyebrow">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

/** Ekran sarlavhasi — logo belgisi bilan, har sahifada bir xil ritm. */
export function PageHeader({
  title,
  subtitle,
  right,
}: {
  title: string;
  subtitle?: string;
  right?: ReactNode;
}) {
  return (
    <motion.header
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={softSpring}
      className="flex items-center gap-3 pt-1"
    >
      <div className="min-w-0 flex-1">
        <h1 className="truncate text-[27px] font-extrabold leading-tight tracking-[-0.035em]">
          {title}
        </h1>
        {subtitle && <p className="mt-0.5 truncate text-[14px] text-muted">{subtitle}</p>}
      </div>
      {right}
    </motion.header>
  );
}

// ── Button ────────────────────────────────────────────────────

export function Button({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  disabled,
  loading,
  type = 'button',
  className,
  icon,
}: {
  children?: ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'success' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  type?: 'button' | 'submit';
  className?: string;
  icon?: IconName;
}) {
  const variants: Record<string, string> = {
    // Asosiy amal — ember gradienti, logodagi olov
    primary: 'ember text-white shadow-glow',
    secondary: 'bg-sunk text-ink hairline',
    outline: 'bg-transparent text-brand border border-brand/35',
    ghost: 'bg-transparent text-brand',
    danger: 'bg-danger/12 text-danger',
    success: 'bg-ok/12 text-ok',
  };
  const sizes: Record<string, string> = {
    sm: 'px-3.5 py-2 text-[13px] rounded-full gap-1.5',
    md: 'px-4.5 py-2.5 text-[15px] rounded-2xl gap-2',
    lg: 'px-5 py-3.5 text-[16px] rounded-2xl w-full gap-2',
  };

  return (
    <motion.button
      type={type}
      disabled={disabled || loading}
      whileTap={disabled || loading ? undefined : { scale: 0.965 }}
      transition={spring}
      onClick={
        onClick
          ? () => {
              haptic('light');
              onClick();
            }
          : undefined
      }
      className={cx(
        'inline-flex items-center justify-center font-semibold tracking-[-0.01em] transition-opacity disabled:opacity-40 disabled:shadow-none',
        variants[variant],
        sizes[size],
        className,
      )}
    >
      {loading ? (
        <Spinner />
      ) : (
        <>
          {icon && Icon[icon]({ size: size === 'sm' ? 15 : 18 })}
          {children}
        </>
      )}
    </motion.button>
  );
}

/** Yuklanish indikatori — matn o'rniga aylanuvchi halqa. */
function Spinner() {
  return (
    <motion.span
      className="block h-[1.1em] w-[1.1em] rounded-full border-2 border-current border-t-transparent"
      animate={{ rotate: 360 }}
      transition={{ repeat: Infinity, duration: 0.7, ease: 'linear' }}
    />
  );
}

/** Doiraviy ikonka tugma — sarlavhalardagi ikkilamchi amallar uchun. */
export function IconButton({
  icon,
  onClick,
  label,
  tone = 'default',
  size = 40,
}: {
  icon: IconName;
  onClick: () => void;
  label: string;
  tone?: 'default' | 'brand';
  size?: number;
}) {
  return (
    <motion.button
      aria-label={label}
      whileTap={{ scale: 0.9 }}
      transition={spring}
      onClick={() => {
        haptic('light');
        onClick();
      }}
      style={{ width: size, height: size }}
      className={cx(
        'flex shrink-0 items-center justify-center rounded-full',
        tone === 'brand' ? 'ember text-white shadow-glow' : 'hairline bg-surface text-ink',
      )}
    >
      {Icon[icon]({ size: size * 0.46 })}
    </motion.button>
  );
}

// ── Avatar ────────────────────────────────────────────────────

export function Avatar({
  name,
  photoUrl,
  size = 40,
  ring,
}: {
  name: string;
  photoUrl?: string | null;
  size?: number;
  /** Ember halqa — faol/muhim shaxsni ajratadi */
  ring?: boolean;
}) {
  const url = assetUrl(photoUrl);
  const radius = size * 0.34;

  const inner = url ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url}
      alt={name}
      width={size}
      height={size}
      className="object-cover"
      style={{ width: size, height: size, borderRadius: radius }}
    />
  ) : (
    <div
      className="flex items-center justify-center font-bold text-ink"
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        fontSize: size * 0.36,
        letterSpacing: '-0.03em',
        background: 'linear-gradient(150deg, color-mix(in srgb, var(--c-brand) 22%, transparent), color-mix(in srgb, var(--c-brand-deep) 12%, transparent))',
      }}
    >
      {initials(name)}
    </div>
  );

  if (!ring) return <span className="shrink-0">{inner}</span>;

  return (
    <span
      className="ember inline-flex shrink-0 items-center justify-center p-[2px]"
      style={{ borderRadius: radius + 3 }}
    >
      <span className="bg-surface p-[2px]" style={{ borderRadius: radius + 1.5 }}>
        {inner}
      </span>
    </span>
  );
}

// ── Progress ──────────────────────────────────────────────────

export function Progress({
  percent,
  tone = 'default',
  height = 6,
}: {
  percent: number;
  tone?: 'default' | 'ok';
  height?: number;
}) {
  const clamped = Math.min(100, Math.max(0, percent));
  const done = clamped >= 100 || tone === 'ok';
  return (
    <div
      className="w-full overflow-hidden rounded-full bg-sunk"
      style={{ height }}
    >
      <motion.div
        className={cx('h-full rounded-full', done ? 'bg-ok' : 'ember')}
        initial={{ width: 0 }}
        animate={{ width: `${clamped}%` }}
        transition={softSpring}
      />
    </div>
  );
}

/** Doiraviy progress — kalit ko'rsatkichlar uchun (klient kartasi). */
export function Ring({
  percent,
  size = 46,
  stroke = 4,
  children,
}: {
  percent: number;
  size?: number;
  stroke?: number;
  children?: ReactNode;
}) {
  const clamped = Math.min(100, Math.max(0, percent));
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const done = clamped >= 100;

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <defs>
          <linearGradient id="ring-ember" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="var(--c-brand-deep)" />
            <stop offset="100%" stopColor="var(--c-brand-hi)" />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--c-sunk)"
          strokeWidth={stroke}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={done ? 'var(--c-ok)' : 'url(#ring-ember)'}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c - (c * clamped) / 100 }}
          transition={softSpring}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center text-[11px] font-bold nums">
        {children ?? `${Math.round(clamped)}%`}
      </div>
    </div>
  );
}

// ── Stat tile ─────────────────────────────────────────────────

export function Stat({
  label,
  value,
  format,
  tone = 'default',
  hint,
  icon,
}: {
  label: string;
  /** Raqam berilsa — qiymat "sanalib" animatsiya bilan ko'rsatiladi. */
  value: string | number;
  format?: (n: number) => string;
  tone?: 'default' | 'ok' | 'danger' | 'warn' | 'brand';
  hint?: string;
  icon?: IconName;
}) {
  const tones: Record<string, string> = {
    default: 'text-ink',
    ok: 'text-ok',
    danger: 'text-danger',
    warn: 'text-warn',
    brand: 'text-brand',
  };
  return (
    <motion.div
      className="hairline relative overflow-hidden rounded-[18px] bg-surface p-3 shadow-card"
      whileTap={{ scale: 0.98 }}
      transition={spring}
    >
      <div className="flex items-center gap-1.5 text-muted">
        {icon && Icon[icon]({ size: 13 })}
        <span className="truncate text-[11.5px] font-semibold tracking-[0.01em]">{label}</span>
      </div>
      <div className={cx('nums mt-1 text-[19px] font-extrabold', tones[tone])}>
        {typeof value === 'number' ? (
          <AnimatedNumber value={value} format={format ?? ((n) => String(Math.round(n)))} />
        ) : (
          value
        )}
      </div>
      {hint && <div className="mt-0.5 text-[11px] text-faint">{hint}</div>}
    </motion.div>
  );
}

// ── Badge / Chip ──────────────────────────────────────────────

export function Badge({
  children,
  tone = 'neutral',
  icon,
}: {
  children: ReactNode;
  tone?: 'neutral' | 'brand' | 'ok' | 'warn' | 'danger' | 'onEmber';
  icon?: IconName;
}) {
  const tones: Record<string, string> = {
    neutral: 'bg-sunk text-muted',
    brand: 'bg-brand/12 text-brand',
    ok: 'bg-ok/12 text-ok',
    warn: 'bg-warn/14 text-warn',
    danger: 'bg-danger/12 text-danger',
    onEmber: 'bg-white/18 text-white backdrop-blur-sm',
  };
  return (
    <span
      className={cx(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11.5px] font-bold tracking-[0.01em]',
        tones[tone],
      )}
    >
      {icon && Icon[icon]({ size: 12 })}
      {children}
    </span>
  );
}

/** Gorizontal filtr chipi — faol fon bir chipdan ikkinchisiga sirg'aladi. */
export function Chip({
  children,
  active,
  onClick,
  layoutId = 'chip-pill',
}: {
  children: ReactNode;
  active: boolean;
  onClick: () => void;
  layoutId?: string;
}) {
  return (
    <motion.button
      onClick={() => {
        haptic('light');
        onClick();
      }}
      whileTap={{ scale: 0.94 }}
      transition={spring}
      className={cx(
        'relative shrink-0 rounded-full px-4 py-2 text-[13px] font-semibold transition-colors',
        active ? 'text-white' : 'hairline bg-surface text-muted',
      )}
    >
      {active && (
        <motion.span
          layoutId={layoutId}
          transition={spring}
          className="ember absolute inset-0 -z-10 rounded-full shadow-glow"
        />
      )}
      <span className="relative">{children}</span>
    </motion.button>
  );
}

// ── Empty / Loading ───────────────────────────────────────────

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  /** Ikonka nomi yoki emoji (eski chaqiriqlar bilan mos) */
  icon: IconName | string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  const named = (Icon as Record<string, ((p: { size?: number }) => ReactNode) | undefined>)[icon];

  return (
    <motion.div
      className="flex flex-col items-center px-6 py-12 text-center"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={softSpring}
    >
      <motion.div
        className="relative mb-4 flex h-[72px] w-[72px] items-center justify-center rounded-[26px] bg-brand/10 text-brand"
        animate={{ y: [0, -5, 0] }}
        transition={{ repeat: Infinity, duration: 3.4, ease: 'easeInOut' }}
      >
        <span className="absolute inset-0 rounded-[26px] bg-brand/10 blur-xl" />
        {named ? named({ size: 30 }) : <span className="text-[32px] leading-none">{icon}</span>}
      </motion.div>
      <div className="text-[17px] font-bold tracking-[-0.02em]">{title}</div>
      {description && (
        <p className="mt-1.5 max-w-xs text-[14px] leading-relaxed text-muted">{description}</p>
      )}
      {action && <div className="mt-6 w-full max-w-xs">{action}</div>}
    </motion.div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cx('skeleton rounded-2xl', className)} />;
}

/** Yuklanish — brend belgisi asta nafas oladi, keyin skeletonlar. */
export function LoadingScreen() {
  return (
    <div className="space-y-3 px-4 pt-4">
      <div className="flex items-center gap-3 pb-1">
        <motion.span
          animate={{ opacity: [0.35, 1, 0.35] }}
          transition={{ repeat: Infinity, duration: 1.6, ease: 'easeInOut' }}
        >
          <LogoMark size={30} />
        </motion.span>
        <Skeleton className="h-4 w-32" />
      </div>
      <Skeleton className="h-32" />
      <div className="grid grid-cols-2 gap-3">
        <Skeleton className="h-20" />
        <Skeleton className="h-20" />
      </div>
      <Skeleton className="h-24" />
      <Skeleton className="h-24" />
    </div>
  );
}

// ── Sheet (bottom modal) ──────────────────────────────────────

export function Sheet({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <motion.div
            className="absolute inset-0 bg-black/55 backdrop-blur-[3px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={quick}
            onClick={onClose}
          />

          {/* Pastdan chiqadi va barmoq bilan pastga surib yopiladi */}
          <motion.div
            className="relative max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-[28px] border-t border-line-strong bg-canvas pb-[calc(env(safe-area-inset-bottom)+16px)] shadow-lift"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={spring}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.5 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 110 || info.velocity.y > 550) onClose();
            }}
          >
            {/* Yuqori qirrada ingichka ember chizig'i — brend imzosi */}
            <div className="ember absolute inset-x-0 top-0 h-[3px] rounded-t-[28px] opacity-90" />

            <div className="sticky top-0 z-10 glass pt-2.5">
              <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-line-strong" />
              <div className="flex items-center justify-between gap-3 border-b border-line px-4 pb-3">
                <h3 className="truncate text-[18px] font-bold tracking-[-0.02em]">{title}</h3>
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={onClose}
                  aria-label="Yopish"
                  className="-mr-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sunk text-muted"
                >
                  {Icon.close({ size: 16 })}
                </motion.button>
              </div>
            </div>
            <div className="p-4">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

// ── Form fields ───────────────────────────────────────────────

export function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="block px-1 text-[12px] font-bold uppercase tracking-[0.08em] text-faint">
        {label}
      </span>
      {children}
      {error ? (
        <span className="block px-1 text-[12px] font-medium text-danger">{error}</span>
      ) : hint ? (
        <span className="block px-1 text-[12px] text-muted">{hint}</span>
      ) : null}
    </label>
  );
}

export const inputClass =
  'w-full rounded-2xl border border-line bg-surface px-4 py-3 text-ink outline-none transition-[border-color,box-shadow] focus:border-brand/60 focus:shadow-[0_0_0_4px_color-mix(in_srgb,var(--c-brand)_14%,transparent)]';

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input {...props} className={cx(inputClass, props.disabled && 'opacity-40', props.className)} />
  );
}

// ── Row ───────────────────────────────────────────────────────

export function Row({
  left,
  right,
  className,
}: {
  left: ReactNode;
  right?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cx('flex items-center justify-between gap-3', className)}>
      <div className="min-w-0 flex-1">{left}</div>
      {right && <div className="shrink-0 text-right">{right}</div>}
    </div>
  );
}

export function ErrorBanner({ message }: { message: string }) {
  return (
    <motion.div
      className="flex items-start gap-2 rounded-2xl bg-danger/10 px-3.5 py-3 text-[13.5px] font-medium text-danger"
      initial={{ opacity: 0, height: 0, marginTop: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={quick}
    >
      <span className="mt-[1px] shrink-0">{Icon.warning({ size: 15 })}</span>
      <span>{message}</span>
    </motion.div>
  );
}

/** Ro'yxatdagi holat nuqtasi — dedlayn/qarz kabi signal uchun. */
export function Dot({ tone }: { tone: 'ok' | 'warn' | 'danger' | 'brand' }) {
  const tones = {
    ok: 'bg-ok',
    warn: 'bg-warn',
    danger: 'bg-danger',
    brand: 'bg-brand',
  } as const;
  return (
    <span className="relative flex h-2 w-2 shrink-0">
      <span className={cx('absolute inset-0 rounded-full ember-pulse', tones[tone])} />
      <span className={cx('relative h-2 w-2 rounded-full', tones[tone])} />
    </span>
  );
}
