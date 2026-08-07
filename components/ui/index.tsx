'use client';

import { ReactNode, useEffect } from 'react';
import { assetUrl } from '@/lib/api';
import { initials } from '@/lib/format';
import { haptic } from '@/lib/telegram';
import { AnimatePresence, AnimatedNumber, motion, quick, softSpring, spring } from './motion';

export function cx(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(' ');
}

// ── Card / Section ────────────────────────────────────────────

export function Card({
  children,
  className,
  onClick,
}: {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  return (
    <motion.div
      whileTap={onClick ? { scale: 0.975 } : undefined}
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
        'rounded-2xl bg-tg-section p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04)]',
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
    <section className={cx('space-y-2', className)}>
      {(title || action) && (
        <div className="flex items-center justify-between px-1">
          {title && (
            <h2 className="text-[13px] font-semibold uppercase tracking-wide text-tg-hint">
              {title}
            </h2>
          )}
          {action}
        </div>
      )}
      {children}
    </section>
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
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  type?: 'button' | 'submit';
  className?: string;
}) {
  const variants: Record<string, string> = {
    primary: 'bg-tg-button text-tg-button-text',
    secondary: 'bg-tg-secondary text-tg-text',
    ghost: 'bg-transparent text-tg-link',
    danger: 'bg-danger/10 text-danger',
    success: 'bg-ok/10 text-ok',
  };
  const sizes: Record<string, string> = {
    sm: 'px-3 py-1.5 text-[13px] rounded-lg',
    md: 'px-4 py-2.5 text-[15px] rounded-xl',
    lg: 'px-5 py-3.5 text-[16px] rounded-2xl w-full',
  };

  return (
    <motion.button
      type={type}
      disabled={disabled || loading}
      whileTap={disabled || loading ? undefined : { scale: 0.96 }}
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
        'font-medium transition-opacity disabled:opacity-40',
        variants[variant],
        sizes[size],
        className,
      )}
    >
      {loading ? <Spinner /> : children}
    </motion.button>
  );
}

/** Yuklanish indikatori — matn o'rniga aylanuvchi halqa. */
function Spinner() {
  return (
    <motion.span
      className="mx-auto block h-[1.1em] w-[1.1em] rounded-full border-2 border-current border-t-transparent"
      animate={{ rotate: 360 }}
      transition={{ repeat: Infinity, duration: 0.7, ease: 'linear' }}
    />
  );
}

// ── Avatar ────────────────────────────────────────────────────

export function Avatar({
  name,
  photoUrl,
  size = 40,
}: {
  name: string;
  photoUrl?: string | null;
  size?: number;
}) {
  const url = assetUrl(photoUrl);
  return url ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url}
      alt={name}
      width={size}
      height={size}
      className="shrink-0 rounded-full object-cover"
      style={{ width: size, height: size }}
    />
  ) : (
    <div
      className="flex shrink-0 items-center justify-center rounded-full bg-tg-button/15 font-semibold text-tg-button"
      style={{ width: size, height: size, fontSize: size * 0.38 }}
    >
      {initials(name)}
    </div>
  );
}

// ── Progress ──────────────────────────────────────────────────

export function Progress({ percent, tone = 'default' }: { percent: number; tone?: 'default' | 'ok' }) {
  const clamped = Math.min(100, Math.max(0, percent));
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-tg-separator">
      <motion.div
        className={cx(
          'h-full rounded-full',
          tone === 'ok' || clamped >= 100 ? 'bg-ok' : 'bg-tg-button',
        )}
        initial={{ width: 0 }}
        animate={{ width: `${clamped}%` }}
        transition={softSpring}
      />
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
}: {
  label: string;
  /** Raqam berilsa — qiymat "sanalib" animatsiya bilan ko'rsatiladi. */
  value: string | number;
  format?: (n: number) => string;
  tone?: 'default' | 'ok' | 'danger' | 'warn';
  hint?: string;
}) {
  const tones: Record<string, string> = {
    default: 'text-tg-text',
    ok: 'text-ok',
    danger: 'text-danger',
    warn: 'text-warn',
  };
  return (
    <motion.div
      className="rounded-2xl bg-tg-section p-3"
      whileTap={{ scale: 0.98 }}
      transition={spring}
    >
      <div className="text-[12px] font-medium text-tg-hint">{label}</div>
      <div className={cx('mt-0.5 text-[19px] font-bold tabular-nums', tones[tone])}>
        {typeof value === 'number' ? (
          <AnimatedNumber value={value} format={format ?? ((n) => String(Math.round(n)))} />
        ) : (
          value
        )}
      </div>
      {hint && <div className="text-[11px] text-tg-hint">{hint}</div>}
    </motion.div>
  );
}

// ── Empty / Loading ───────────────────────────────────────────

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <motion.div
      className="flex flex-col items-center px-6 py-12 text-center"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={softSpring}
    >
      <motion.div
        className="mb-3 text-[44px] leading-none"
        animate={{ y: [0, -6, 0] }}
        transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
      >
        {icon}
      </motion.div>
      <div className="text-[16px] font-semibold">{title}</div>
      {description && <p className="mt-1 max-w-xs text-[14px] text-tg-hint">{description}</p>}
      {action && <div className="mt-5 w-full max-w-xs">{action}</div>}
    </motion.div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cx('skeleton rounded-xl', className)} />;
}

export function LoadingScreen() {
  return (
    <div className="space-y-3 p-4">
      <Skeleton className="h-20" />
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
            className="absolute inset-0 bg-black/45 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={quick}
            onClick={onClose}
          />

          {/* Pastdan chiqadi va barmoq bilan pastga surib yopiladi */}
          <motion.div
            className="relative max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-tg-bg pb-[calc(env(safe-area-inset-bottom)+16px)] shadow-[0_-8px_40px_rgba(0,0,0,0.18)]"
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
            <div className="sticky top-0 z-10 bg-tg-bg pt-2">
              <div className="mx-auto mb-2 h-1 w-9 rounded-full bg-tg-separator" />
              <div className="flex items-center justify-between border-b border-tg-separator px-4 pb-3">
                <h3 className="text-[17px] font-semibold">{title}</h3>
                <button
                  onClick={onClose}
                  className="-mr-1 rounded-full px-2 py-1 text-[15px] text-tg-link active:opacity-60"
                >
                  Yopish
                </button>
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
      <span className="block text-[13px] font-medium text-tg-hint">{label}</span>
      {children}
      {error ? (
        <span className="block text-[12px] text-danger">{error}</span>
      ) : hint ? (
        <span className="block text-[12px] text-tg-hint">{hint}</span>
      ) : null}
    </label>
  );
}

export const inputClass =
  'w-full rounded-xl border border-tg-separator bg-tg-section px-3.5 py-2.5 outline-none focus:border-tg-button transition-colors';

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={cx(inputClass, props.disabled && 'opacity-40', props.className)}
    />
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
      className="rounded-xl bg-danger/10 px-3.5 py-2.5 text-[14px] text-danger"
      initial={{ opacity: 0, height: 0, marginTop: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={quick}
    >
      {message}
    </motion.div>
  );
}
