'use client';

import { DB_VERSION, createSeed, type MockAssignment, type MockDb, type MockUser } from './data';

const KEY = 'pb_demo_db';
const SESSION_KEY = 'pb_demo_session';

let cache: MockDb | null = null;

/** Ma'lumotlar bazasini localStorage'dan o'qiydi, bo'lmasa demo ma'lumot bilan to'ldiradi. */
export function db(): MockDb {
  if (cache) return cache;
  if (typeof window === 'undefined') return createSeed();

  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as MockDb;
      // Sxema yangilansa — demo ma'lumot qaytadan yaratiladi
      if (parsed.version === DB_VERSION) {
        cache = parsed;
        return cache;
      }
    }
  } catch {
    /* buzilgan JSON — qaytadan boshlaymiz */
  }

  cache = createSeed();
  save();
  return cache;
}

export function save() {
  if (typeof window === 'undefined' || !cache) return;
  try {
    localStorage.setItem(KEY, JSON.stringify(cache));
  } catch {
    /* localStorage to'lgan bo'lishi mumkin — demo uchun jim o'tamiz */
  }
}

/** Demo ma'lumotlarni boshlang'ich holatga qaytaradi. */
export function resetDb() {
  cache = createSeed();
  save();
}

// ── Sessiya ───────────────────────────────────────────────────

export function getSession(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(SESSION_KEY);
}

export function setSession(userId: string | null) {
  if (typeof window === 'undefined') return;
  if (userId) localStorage.setItem(SESSION_KEY, userId);
  else localStorage.removeItem(SESSION_KEY);
}

export function currentUser(): MockUser {
  const id = getSession();
  const user = db().users.find((u) => u.id === id);
  if (!user) throw new MockError('Sessiya topilmadi. Qaytadan kiring.', 401);
  return user;
}

// ── Yordamchilar ──────────────────────────────────────────────

export class MockError extends Error {
  constructor(
    message: string,
    readonly status = 400,
  ) {
    super(message);
  }
}

export function uid(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

export function nowIso(): string {
  return new Date().toISOString();
}

export function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function displayName(u: { firstName: string; lastName?: string | null; username?: string | null }): string {
  const full = [u.firstName, u.lastName].filter(Boolean).join(' ').trim();
  return full || (u.username ? `@${u.username}` : 'Foydalanuvchi');
}

const ROLE_LABELS: Record<string, string> = {
  MANAGER: '🎬 Prodakshn-menejer',
  VIDEOGRAPHER: '🎥 Videograf',
  EDITOR: '✂️ Montajyor',
  DESIGNER: '🎨 Dizayner',
  OTHER: '➕ Boshqa',
};

export const ROLE_GROUPS: Record<string, string> = {
  MANAGER: 'Menejerlar',
  VIDEOGRAPHER: 'Videograflar',
  EDITOR: 'Montajyorlar',
  DESIGNER: 'Dizaynerlar',
  OTHER: 'Boshqa',
};

export function roleLabel(role: string | null, custom?: string | null): string {
  if (!role) return '—';
  if (role === 'OTHER' && custom) return custom;
  return ROLE_LABELS[role] ?? role;
}

export function roleName(role: string | null, custom?: string | null): string {
  if (!role) return '—';
  if (role === 'OTHER' && custom) return custom;
  return (ROLE_LABELS[role] ?? role).replace(/^\S+\s/, '');
}

// ── Dedlayn mantiqi (backend bilan bir xil) ───────────────────

export function deadlineStatus(
  date: string | null,
  now = new Date(),
): { status: 'none' | 'upcoming' | 'today' | 'overdue'; daysLeft: number | null } {
  if (!date) return { status: 'none', daysLeft: null };
  const target = new Date(date);
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startTarget = new Date(
    target.getFullYear(),
    target.getMonth(),
    target.getDate(),
  ).getTime();
  const daysLeft = Math.round((startTarget - startToday) / 86_400_000);
  if (daysLeft < 0) return { status: 'overdue', daysLeft };
  if (daysLeft === 0) return { status: 'today', daysLeft };
  return { status: 'upcoming', daysLeft };
}

/** Takrorlanuvchi dedlayn: birinchi sana + k×interval */
export function nextRecurring(startDate: string, intervalDays: number, after = new Date()): string {
  const step = Math.max(1, intervalDays);
  const start = new Date(startDate);
  if (start.getTime() > after.getTime()) return start.toISOString();
  const elapsed = (after.getTime() - start.getTime()) / 86_400_000;
  const steps = Math.floor(elapsed / step) + 1;
  const next = new Date(start.getTime());
  next.setDate(next.getDate() + steps * step);
  return next.toISOString();
}

// ── Pul hisob-kitobi ──────────────────────────────────────────

export function paidFor(assignmentId: string): number {
  return round2(
    db()
      .payments.filter((p) => p.type === 'WORKER_PAYOUT' && p.assignmentId === assignmentId)
      .reduce((a, p) => a + p.amount, 0),
  );
}

export function receivedFor(clientId: string): number {
  return round2(
    db()
      .payments.filter((p) => p.type === 'CLIENT_INCOME' && p.clientId === clientId)
      .reduce((a, p) => a + p.amount, 0),
  );
}

/** To'lash kerak = har bir ish narxi × bajarilgan ishlar soni */
export function owedFor(a: MockAssignment): number {
  return round2(a.unitPrice * a.completedUnits);
}

export function plannedFor(a: MockAssignment): number {
  return round2(a.unitPrice * a.totalUnits);
}

export function startOfMonth(): number {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).getTime();
}
