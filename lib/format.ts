import type { DeadlineStatus } from './types';

/** Faqat $ — ko'p-valyutalilik yo'q (TZ 8). */
export function money(value: number | null | undefined): string {
  const n = Number(value ?? 0);
  const abs = Math.abs(n);
  const formatted =
    abs >= 1000
      ? abs.toLocaleString('en-US', { maximumFractionDigits: abs % 1 === 0 ? 0 : 2 })
      : abs.toLocaleString('en-US', { maximumFractionDigits: 2 });
  return `${n < 0 ? '−' : ''}$${formatted}`;
}

const MONTHS = [
  'yan',
  'fev',
  'mar',
  'apr',
  'may',
  'iyun',
  'iyul',
  'avg',
  'sen',
  'okt',
  'noy',
  'dek',
];

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return `${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

export function formatFullDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

export function toDateInput(iso: string | null | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function deadlineText(
  iso: string | null,
  status: DeadlineStatus,
  daysLeft?: number | null,
): string {
  if (!iso) return 'Dedlayn belgilanmagan';
  if (status === 'overdue') {
    const days = daysLeft != null ? Math.abs(daysLeft) : null;
    return days ? `${formatDate(iso)} — ${days} kun kechikdi` : `${formatDate(iso)} — muddati o'tdi`;
  }
  if (status === 'today') return `Bugun — ${formatDate(iso)}`;
  if (daysLeft != null && daysLeft <= 7) return `${formatDate(iso)} — ${daysLeft} kun qoldi`;
  return formatDate(iso);
}

/** Dedlaynga qancha qolgani — "2 soat qoldi", "3 kun qoldi", "1 kun kechikdi". */
export function timeLeftText(iso: string | null): string {
  if (!iso) return 'Dedlayn yo\'q';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return 'Dedlayn yo\'q';

  const diffMs = d.getTime() - Date.now();
  const hours = Math.floor(Math.abs(diffMs) / 3_600_000);
  const days = Math.floor(hours / 24);

  if (diffMs <= 0) {
    if (hours < 1) return 'Muddati o\'tdi';
    return days >= 1 ? `${days} kun kechikdi` : `${hours} soat kechikdi`;
  }
  if (hours < 1) return `${Math.max(1, Math.floor(diffMs / 60_000))} daqiqa qoldi`;
  return days >= 1 ? `${days} kun qoldi` : `${hours} soat qoldi`;
}

export function deadlineColor(status: DeadlineStatus): string {
  switch (status) {
    case 'overdue':
      return 'text-danger';
    case 'today':
      return 'text-warn';
    default:
      return 'text-tg-hint';
  }
}

export function deadlineBadge(status: DeadlineStatus): string {
  switch (status) {
    case 'overdue':
      return '⚠️';
    case 'today':
      return '🔔';
    default:
      return '';
  }
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
}

export function plural(count: number, unit: string): string {
  return `${count} ${unit}`;
}
