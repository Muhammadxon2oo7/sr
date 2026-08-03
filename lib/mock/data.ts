import type { DeadlineType, MemberStatus, Role } from '@/lib/types';

/**
 * Demo rejim uchun ma'lumotlar modeli — backend'dagi Prisma sxemasining nusxasi.
 * Barcha yozuvlar localStorage'da saqlanadi, server kerak emas.
 */

export interface MockUser {
  id: string;
  telegramId: string;
  firstName: string;
  lastName?: string | null;
  username?: string | null;
  photoUrl?: string | null;
  role: Role | null;
  customRoleName?: string | null;
  pendingInviteProductionId?: string | null;
}

export interface MockProduction {
  id: string;
  name: string;
  username: string;
  photoUrl: string | null;
  ownerId: string;
  createdAt: string;
}

export interface MockMember {
  id: string;
  productionId: string;
  userId: string;
  status: MemberStatus;
  joinMethod: 'OWNER' | 'INVITE_LINK' | 'REQUEST' | 'INVITE';
  initiatedBy: 'WORKER' | 'MANAGER';
  createdAt: string;
  decidedAt: string | null;
}

export interface MockClient {
  id: string;
  productionId: string;
  name: string;
  totalAmount: number;
  archived: boolean;
  createdAt: string;
}

export interface MockAssignment {
  id: string;
  clientId: string;
  userId: string;
  unitLabel: string;
  totalUnits: number;
  completedUnits: number;
  unitPrice: number;
  deadlineType: DeadlineType;
  deadlineDate: string | null;
  intervalDays: number | null;
  startDate: string | null;
  lastCompletedAt: string | null;
  createdAt: string;
}

export interface MockPayment {
  id: string;
  type: 'CLIENT_INCOME' | 'WORKER_PAYOUT';
  amount: number;
  note: string | null;
  paidAt: string;
  clientId: string | null;
  assignmentId: string | null;
}

export interface MockWorkLog {
  id: string;
  assignmentId: string;
  userId: string;
  createdAt: string;
}

export interface MockCustomRole {
  id: string;
  userId: string;
  text: string;
  createdAt: string;
}

export interface MockDb {
  version: number;
  users: MockUser[];
  productions: MockProduction[];
  members: MockMember[];
  clients: MockClient[];
  assignments: MockAssignment[];
  payments: MockPayment[];
  workLogs: MockWorkLog[];
  customRoles: MockCustomRole[];
}

/** Demo login'lari — statik parol bilan (backend yo'q). */
export interface DemoAccount {
  login: string;
  password: string;
  userId: string;
  title: string;
  subtitle: string;
}

export const DEMO_ACCOUNTS: DemoAccount[] = [
  {
    login: 'menejer',
    password: '1234',
    userId: 'u_aziz',
    title: 'Menejer',
    subtitle: 'Aziz — Sunrise Studio',
  },
  {
    login: 'montajyor',
    password: '1234',
    userId: 'u_ivan',
    title: 'Montajyor',
    subtitle: 'Ivan — 2 ta agentlikda ishlaydi',
  },
  {
    login: 'dizayner',
    password: '1234',
    userId: 'u_malika',
    title: 'Dizayner',
    subtitle: 'Malika — taklif kutmoqda',
  },
  {
    login: 'yangi',
    password: '1234',
    userId: 'u_yangi',
    title: 'Yangi foydalanuvchi',
    subtitle: 'Rol tanlashdan boshlanadi',
  },
];

// ── Seed ──────────────────────────────────────────────────────

function iso(daysFromNow: number, hour = 12): string {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
}

export const DB_VERSION = 3;

export function createSeed(): MockDb {
  const users: MockUser[] = [
    {
      id: 'u_aziz',
      telegramId: '100001',
      firstName: 'Aziz',
      lastName: 'Karimov',
      username: 'aziz_pm',
      role: 'MANAGER',
      photoUrl: null,
    },
    {
      id: 'u_ivan',
      telegramId: '100002',
      firstName: 'Ivan',
      lastName: 'Petrov',
      username: 'ivan_edit',
      role: 'EDITOR',
      photoUrl: null,
    },
    {
      id: 'u_malika',
      telegramId: '100003',
      firstName: 'Malika',
      lastName: 'Yusupova',
      username: 'malika_d',
      role: 'DESIGNER',
      photoUrl: null,
    },
    {
      id: 'u_bek',
      telegramId: '100004',
      firstName: 'Bek',
      lastName: 'Tursunov',
      username: 'bek_cam',
      role: 'VIDEOGRAPHER',
      photoUrl: null,
    },
    {
      id: 'u_nodira',
      telegramId: '100005',
      firstName: 'Nodira',
      username: 'nodira_smm',
      role: 'OTHER',
      customRoleName: 'SMM menejer',
      photoUrl: null,
    },
    {
      id: 'u_sardor',
      telegramId: '100006',
      firstName: 'Sardor',
      username: 'sardor_v',
      role: 'VIDEOGRAPHER',
      photoUrl: null,
    },
    {
      id: 'u_kamola',
      telegramId: '100007',
      firstName: 'Kamola',
      username: 'kamola_des',
      role: 'DESIGNER',
      photoUrl: null,
    },
    {
      id: 'u_jamshid',
      telegramId: '100008',
      firstName: 'Jamshid',
      username: 'jamshid_pm',
      role: 'MANAGER',
      photoUrl: null,
    },
    {
      id: 'u_yangi',
      telegramId: '100009',
      firstName: 'Yangi',
      username: 'yangi_user',
      role: null,
      photoUrl: null,
    },
  ];

  const productions: MockProduction[] = [
    {
      id: 'p_sunrise',
      name: 'Sunrise Studio',
      username: 'sunrise_studio',
      photoUrl: null,
      ownerId: 'u_aziz',
      createdAt: iso(-90),
    },
    {
      id: 'p_vertigo',
      name: 'Vertigo Films',
      username: 'vertigo_films',
      photoUrl: null,
      ownerId: 'u_jamshid',
      createdAt: iso(-40),
    },
  ];

  const members: MockMember[] = [
    m('m1', 'p_sunrise', 'u_aziz', 'ACCEPTED', 'OWNER', 'WORKER', -90),
    m('m2', 'p_sunrise', 'u_ivan', 'ACCEPTED', 'INVITE_LINK', 'WORKER', -80),
    m('m3', 'p_sunrise', 'u_malika', 'ACCEPTED', 'INVITE_LINK', 'WORKER', -70),
    m('m4', 'p_sunrise', 'u_bek', 'ACCEPTED', 'REQUEST', 'WORKER', -60),
    m('m5', 'p_sunrise', 'u_nodira', 'ACCEPTED', 'INVITE', 'MANAGER', -30),
    // Ishchi o'zi ariza yuborgan — menejer qaror qiladi
    { ...m('m6', 'p_sunrise', 'u_sardor', 'PENDING', 'REQUEST', 'WORKER', -2), decidedAt: null },

    m('m7', 'p_vertigo', 'u_jamshid', 'ACCEPTED', 'OWNER', 'WORKER', -40),
    m('m8', 'p_vertigo', 'u_ivan', 'ACCEPTED', 'INVITE_LINK', 'WORKER', -20),
    // Menejer taklif yuborgan — ishchi qaror qiladi
    { ...m('m9', 'p_vertigo', 'u_malika', 'PENDING', 'INVITE', 'MANAGER', -1), decidedAt: null },
  ];

  const clients: MockClient[] = [
    { id: 'c_coffee', productionId: 'p_sunrise', name: 'Coffee House', totalAmount: 3000, archived: false, createdAt: iso(-45) },
    { id: 'c_gym', productionId: 'p_sunrise', name: 'FitZone Gym', totalAmount: 1800, archived: false, createdAt: iso(-25) },
    { id: 'c_barber', productionId: 'p_sunrise', name: 'Barber Loft', totalAmount: 1200, archived: false, createdAt: iso(-10) },
    { id: 'c_auto', productionId: 'p_vertigo', name: 'Auto Salon', totalAmount: 2400, archived: false, createdAt: iso(-18) },
  ];

  const assignments: MockAssignment[] = [
    {
      id: 'a_coffee_ivan',
      clientId: 'c_coffee',
      userId: 'u_ivan',
      unitLabel: 'video',
      totalUnits: 20,
      completedUnits: 15,
      unitPrice: 50,
      deadlineType: 'RECURRING',
      intervalDays: 2,
      startDate: iso(-5),
      deadlineDate: iso(-1), // muddati o'tgan
      lastCompletedAt: iso(-3),
      createdAt: iso(-45),
    },
    {
      id: 'a_coffee_malika',
      clientId: 'c_coffee',
      userId: 'u_malika',
      unitLabel: 'maket',
      totalUnits: 10,
      completedUnits: 4,
      unitPrice: 60,
      deadlineType: 'ONE_TIME',
      intervalDays: null,
      startDate: null,
      deadlineDate: iso(3),
      lastCompletedAt: iso(-6),
      createdAt: iso(-45),
    },
    {
      id: 'a_gym_bek',
      clientId: 'c_gym',
      userId: 'u_bek',
      unitLabel: 'suratga olish kuni',
      totalUnits: 6,
      completedUnits: 2,
      unitPrice: 120,
      deadlineType: 'ONE_TIME',
      intervalDays: null,
      startDate: null,
      deadlineDate: iso(0), // bugungi dedlayn
      lastCompletedAt: iso(-8),
      createdAt: iso(-25),
    },
    {
      id: 'a_gym_nodira',
      clientId: 'c_gym',
      userId: 'u_nodira',
      unitLabel: 'post',
      totalUnits: 30,
      completedUnits: 12,
      unitPrice: 15,
      deadlineType: 'RECURRING',
      intervalDays: 1,
      startDate: iso(-10),
      deadlineDate: iso(1),
      lastCompletedAt: iso(-1),
      createdAt: iso(-25),
    },
    {
      id: 'a_barber_ivan',
      clientId: 'c_barber',
      userId: 'u_ivan',
      unitLabel: 'reels',
      totalUnits: 12,
      completedUnits: 3,
      unitPrice: 35,
      deadlineType: 'RECURRING',
      intervalDays: 7,
      startDate: iso(-3),
      deadlineDate: iso(4),
      lastCompletedAt: iso(-2),
      createdAt: iso(-10),
    },
    {
      id: 'a_auto_ivan',
      clientId: 'c_auto',
      userId: 'u_ivan',
      unitLabel: 'video',
      totalUnits: 8,
      completedUnits: 6,
      unitPrice: 90,
      deadlineType: 'ONE_TIME',
      intervalDays: null,
      startDate: null,
      deadlineDate: iso(2),
      lastCompletedAt: iso(-1),
      createdAt: iso(-18),
    },
  ];

  const payments: MockPayment[] = [
    p('pay1', 'CLIENT_INCOME', 1500, 'c_coffee', null, 'Avans', -40),
    p('pay2', 'CLIENT_INCOME', 600, 'c_coffee', null, 'Ikkinchi to\'lov', -12),
    p('pay3', 'CLIENT_INCOME', 900, 'c_gym', null, 'Birinchi to\'lov', -20),
    p('pay4', 'CLIENT_INCOME', 400, 'c_barber', null, 'Avans', -8),
    p('pay5', 'CLIENT_INCOME', 1200, 'c_auto', null, 'Avans', -15),

    p('pay6', 'WORKER_PAYOUT', 500, null, 'a_coffee_ivan', null, -20),
    p('pay7', 'WORKER_PAYOUT', 200, null, 'a_coffee_malika', null, -14),
    p('pay8', 'WORKER_PAYOUT', 240, null, 'a_gym_bek', null, -9),
    p('pay9', 'WORKER_PAYOUT', 300, null, 'a_auto_ivan', null, -5),
  ];

  // Bajarilgan ishlar tarixi
  const workLogs: MockWorkLog[] = [];
  for (const a of assignments) {
    for (let i = 0; i < a.completedUnits; i++) {
      workLogs.push({
        id: `wl_${a.id}_${i}`,
        assignmentId: a.id,
        userId: a.userId,
        // Bir qismi shu oyda bajarilgan bo'lsin — "shu oyda N ish" ko'rsatkichi uchun
        createdAt: iso(-Math.floor((i / Math.max(1, a.completedUnits)) * 40)),
      });
    }
  }

  const customRoles: MockCustomRole[] = [
    { id: 'cr1', userId: 'u_nodira', text: 'SMM menejer', createdAt: iso(-30) },
  ];

  return {
    version: DB_VERSION,
    users,
    productions,
    members,
    clients,
    assignments,
    payments,
    workLogs,
    customRoles,
  };
}

function m(
  id: string,
  productionId: string,
  userId: string,
  status: MemberStatus,
  joinMethod: MockMember['joinMethod'],
  initiatedBy: MockMember['initiatedBy'],
  days: number,
): MockMember {
  return {
    id,
    productionId,
    userId,
    status,
    joinMethod,
    initiatedBy,
    createdAt: iso(days),
    decidedAt: iso(days),
  };
}

function p(
  id: string,
  type: MockPayment['type'],
  amount: number,
  clientId: string | null,
  assignmentId: string | null,
  note: string | null,
  days: number,
): MockPayment {
  return { id, type, amount, note, paidAt: iso(days), clientId, assignmentId };
}
