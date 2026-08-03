'use client';

import { ReactNode, useEffect } from 'react';
import { assetUrl } from '@/lib/api';
import { initials } from '@/lib/format';
import { haptic } from '@/lib/telegram';
import { AnimatePresence, AnimatedNumber, motion, quick, softSpring, spring } from './motion';
import { IconCheck, IconX } from './icons';

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
        'rounded-[12px] border border-border bg-surface p-4',
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
        <div className="flex items-center justify-between px-0.5">
          {title && (
            <h2 className="text-[13px] font-medium text-fg-muted">{title}</h2>
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
  icon?: ReactNode;
}) {
  const variants: Record<string, string> = {
    primary: 'bg-primary text-primary-fg',
    secondary: 'bg-muted text-fg',
    outline: 'border border-border-strong bg-transparent text-fg',
    ghost: 'bg-transparent text-fg-muted',
    danger: 'border border-danger/25 bg-transparent text-danger',
    success: 'bg-primary text-primary-fg',
  };
  const sizes: Record<string, string> = {
    sm: 'h-8 px-3 text-[13px] rounded-[8px] gap-1.5',
    md: 'h-10 px-4 text-[14px] rounded-[10px] gap-2',
    lg: 'h-12 px-5 text-[15px] rounded-[10px] w-full gap-2',
  };

  return (
    <motion.button
      type={type}
      disabled={disabled || loading}
      whileTap={disabled || loading ? undefined : { scale: 0.97 }}
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
        'inline-flex items-center justify-center font-medium transition-opacity active:opacity-90 disabled:opacity-40',
        variants[variant],
        sizes[size],
        className,
      )}
    >
      {loading ? (
        <Spinner />
      ) : (
        <>
          {icon}
          {children}
        </>
      )}
    </motion.button>
  );
}

function Spinner() {
  return (
    <motion.span
      className="block h-[1.05em] w-[1.05em] rounded-full border-2 border-current border-t-transparent"
      animate={{ rotate: 360 }}
      transition={{ repeat: Infinity, duration: 0.7, ease: 'linear' }}
    />
  );
}

/** Faqat ikonkali dumaloq tugma */
export function IconButton({
  children,
  onClick,
  label,
  className,
}: {
  children: ReactNode;
  onClick: () => void;
  label: string;
  className?: string;
}) {
  return (
    <motion.button
      type="button"
      aria-label={label}
      whileTap={{ scale: 0.92 }}
      transition={spring}
      onClick={() => {
        haptic('light');
        onClick();
      }}
      className={cx(
        'inline-flex h-9 w-9 items-center justify-center rounded-[10px] border border-border text-fg-muted',
        className,
      )}
    >
      {children}
    </motion.button>
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
      className="shrink-0 rounded-full border border-border object-cover"
      style={{ width: size, height: size }}
    />
  ) : (
    <div
      className="flex shrink-0 items-center justify-center rounded-full border border-border bg-muted font-medium text-fg-muted"
      style={{ width: size, height: size, fontSize: size * 0.36 }}
    >
      {initials(name)}
    </div>
  );
}

// ── Progress ──────────────────────────────────────────────────

export function Progress({ percent }: { percent: number; tone?: 'default' | 'ok' }) {
  const clamped = Math.min(100, Math.max(0, percent));
  return (
    <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
      <motion.div
        className="h-full rounded-full bg-primary"
        initial={{ width: 0 }}
        animate={{ width: `${clamped}%` }}
        transition={softSpring}
      />
    </div>
  );
}

// ── Stat ──────────────────────────────────────────────────────

export function Stat({
  label,
  value,
  format,
  tone = 'default',
  hint,
}: {
  label: string;
  value: string | number;
  format?: (n: number) => string;
  tone?: 'default' | 'ok' | 'danger' | 'warn';
  hint?: string;
}) {
  const tones: Record<string, string> = {
    default: 'text-fg',
    ok: 'text-fg',
    danger: 'text-danger',
    warn: 'text-warn',
  };
  return (
    <div className="rounded-[12px] border border-border bg-surface px-3.5 py-3">
      <div className="text-[12px] text-fg-muted">{label}</div>
      <div className={cx('mt-1 text-[20px] font-semibold tabular', tones[tone])}>
        {typeof value === 'number' ? (
          <AnimatedNumber value={value} format={format ?? ((n) => String(Math.round(n)))} />
        ) : (
          value
        )}
      </div>
      {hint && <div className="mt-0.5 text-[11px] text-fg-subtle">{hint}</div>}
    </div>
  );
}

// ── Badge ─────────────────────────────────────────────────────

export function Badge({
  children,
  tone = 'default',
}: {
  children: ReactNode;
  tone?: 'default' | 'danger' | 'warn' | 'ok';
}) {
  const tones: Record<string, string> = {
    default: 'border-border text-fg-muted',
    danger: 'border-danger/30 text-danger',
    warn: 'border-warn/30 text-warn',
    ok: 'border-border text-fg',
  };
  return (
    <span
      className={cx(
        'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium',
        tones[tone],
      )}
    >
      {children}
    </span>
  );
}

// ── Empty / Loading ───────────────────────────────────────────

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <motion.div
      className="flex flex-col items-center px-6 py-14 text-center"
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={softSpring}
    >
      {icon && (
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-border text-fg-subtle">
          {icon}
        </div>
      )}
      <div className="text-[15px] font-medium">{title}</div>
      {description && (
        <p className="mt-1.5 max-w-[280px] text-[13px] leading-relaxed text-fg-muted">
          {description}
        </p>
      )}
      {action && <div className="mt-6 w-full max-w-[280px]">{action}</div>}
    </motion.div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cx('skeleton rounded-[12px]', className)} />;
}

export function LoadingScreen() {
  return (
    <div className="space-y-3 p-4">
      <Skeleton className="h-16" />
      <Skeleton className="h-24" />
      <Skeleton className="h-24" />
    </div>
  );
}

// ── Sheet ─────────────────────────────────────────────────────

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
            className="absolute inset-0 bg-black/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={quick}
            onClick={onClose}
          />

          <motion.div
            className="relative max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-[16px] border-t border-border bg-bg pb-[calc(env(safe-area-inset-bottom)+20px)]"
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
            <div className="sticky top-0 z-10 bg-bg pt-2.5">
              <div className="mx-auto mb-2.5 h-1 w-9 rounded-full bg-border-strong" />
              <div className="flex items-center justify-between border-b border-border px-4 pb-3">
                <h3 className="text-[16px] font-semibold tracking-tight">{title}</h3>
                <button
                  onClick={onClose}
                  aria-label="Yopish"
                  className="-mr-1 flex h-8 w-8 items-center justify-center rounded-full text-fg-muted active:opacity-60"
                >
                  <IconX size={18} />
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

// ── Forma ─────────────────────────────────────────────────────

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
      <span className="block text-[13px] font-medium text-fg">{label}</span>
      {children}
      {error ? (
        <span className="block text-[12px] text-danger">{error}</span>
      ) : hint ? (
        <span className="block text-[12px] leading-snug text-fg-muted">{hint}</span>
      ) : null}
    </label>
  );
}

export const inputClass =
  'w-full rounded-[10px] border border-border bg-surface px-3.5 py-2.5 text-[15px] outline-none transition-colors placeholder:text-fg-subtle focus:border-fg';

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={cx(inputClass, props.disabled && 'opacity-50', props.className)}
    />
  );
}

export function Checkbox({
  checked,
  onChange,
  label,
  disabled,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  disabled?: boolean;
}) {
  return (
    <motion.button
      type="button"
      disabled={disabled}
      whileTap={disabled ? undefined : { scale: 0.99 }}
      transition={spring}
      onClick={() => {
        if (disabled) return;
        haptic('light');
        onChange(!checked);
      }}
      className={cx('flex w-full items-center gap-2.5 py-1 text-left', disabled && 'opacity-40')}
    >
      <span
        className={cx(
          'flex h-[20px] w-[20px] shrink-0 items-center justify-center rounded-[6px] border transition-colors',
          checked ? 'border-primary bg-primary text-primary-fg' : 'border-border-strong',
        )}
      >
        <AnimatePresence>
          {checked && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              transition={spring}
            >
              <IconCheck size={13} strokeWidth={2.5} />
            </motion.span>
          )}
        </AnimatePresence>
      </span>
      <span className="text-[14px]">{label}</span>
    </motion.button>
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
      className="rounded-[10px] border border-danger/25 px-3.5 py-2.5 text-[13px] leading-snug text-danger"
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={quick}
    >
      {message}
    </motion.div>
  );
}

/** Sahifa sarlavhasi — barcha tablar uchun bir xil */
export function PageHeader({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <h1 className="text-[22px] font-semibold tracking-tight">{title}</h1>
      {action}
    </div>
  );
}
