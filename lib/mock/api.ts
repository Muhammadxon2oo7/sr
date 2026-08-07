'use client';

import type { AssignmentDto, ClientDto, PaymentDto } from '@/lib/types';
import type { MockAssignment, MockClient, MockProduction, MockUser } from './data';
import {
  MockError,
  ROLE_GROUPS,
  currentUser,
  db,
  deadlineStatus,
  displayName,
  nextRecurring,
  nowIso,
  owedFor,
  paidFor,
  plannedFor,
  receivedFor,
  roleLabel,
  roleName,
  round2,
  save,
  startOfMonth,
  uid,
} from './store';

/**
 * Backendsiz demo rejim: har bir API chaqiruvi localStorage ustida bajariladi.
 * Javob shakllari haqiqiy backend bilan bir xil, shuning uchun UI kodi o'zgarmaydi.
 */

// ── DTO quruvchilar ───────────────────────────────────────────

function userById(id: string): MockUser {
  const u = db().users.find((x) => x.id === id);
  if (!u) throw new MockError('Foydalanuvchi topilmadi.', 404);
  return u;
}

function productionById(id: string): MockProduction {
  const p = db().productions.find((x) => x.id === id);
  if (!p) throw new MockError('Agentlik topilmadi.', 404);
  return p;
}

function clientById(id: string): MockClient {
  const c = db().clients.find((x) => x.id === id);
  if (!c) throw new MockError('Klient topilmadi.', 404);
  return c;
}

function assignmentById(id: string): MockAssignment {
  const a = db().assignments.find((x) => x.id === id);
  if (!a) throw new MockError('Ish topilmadi.', 404);
  return a;
}

function assertOwner(productionId: string): MockProduction {
  const p = productionById(productionId);
  if (p.ownerId !== currentUser().id) {
    throw new MockError('Bu amal faqat agentlik menejeri uchun.', 403);
  }
  return p;
}

function toUserDto(u: MockUser) {
  return {
    id: u.id,
    telegramId: u.telegramId,
    name: displayName(u),
    username: u.username ?? null,
    photoUrl: u.photoUrl ?? null,
    role: u.role,
    customRoleName: u.customRoleName ?? null,
    roleLabel: roleLabel(u.role, u.customRoleName),
    roleName: roleName(u.role, u.customRoleName),
    isManager: u.role === 'MANAGER',
    hasPendingInvite: Boolean(u.pendingInviteProductionId),
  };
}

function toProductionDto(p: MockProduction) {
  return {
    id: p.id,
    name: p.name,
    username: p.username,
    photoUrl: p.photoUrl,
    ownerId: p.ownerId,
    inviteLink: `https://t.me/prodakshn_demo_bot?start=prod_${p.id}`,
    createdAt: p.createdAt,
  };
}

function toPaymentDto(p: {
  id: string;
  type: 'CLIENT_INCOME' | 'WORKER_PAYOUT';
  amount: number;
  note: string | null;
  paidAt: string;
}): PaymentDto {
  return { id: p.id, type: p.type, amount: p.amount, note: p.note, paidAt: p.paidAt };
}

function toAssignmentDto(a: MockAssignment, clientName: string): AssignmentDto {
  const worker = userById(a.userId);
  const paidAmount = paidFor(a.id);
  const owedAmount = owedFor(a);
  const { status, daysLeft } = deadlineStatus(a.deadlineDate);

  return {
    id: a.id,
    clientId: a.clientId,
    clientName,
    worker: {
      id: worker.id,
      name: displayName(worker),
      username: worker.username ?? null,
      photoUrl: worker.photoUrl ?? null,
      roleLabel: roleLabel(worker.role, worker.customRoleName),
      roleName: roleName(worker.role, worker.customRoleName),
    },
    unitLabel: a.unitLabel,
    totalUnits: a.totalUnits,
    completedUnits: a.completedUnits,
    progressPercent: a.totalUnits > 0 ? Math.round((a.completedUnits / a.totalUnits) * 100) : 0,
    isFinished: a.completedUnits >= a.totalUnits,
    unitPrice: a.unitPrice,
    owedAmount,
    plannedAmount: plannedFor(a),
    paidAmount,
    debt: Math.max(0, round2(owedAmount - paidAmount)),
    isFullyPaid: paidAmount >= owedAmount,
    deadlineType: a.deadlineType,
    deadlineDate: a.deadlineDate,
    intervalDays: a.intervalDays,
    startDate: a.startDate,
    deadlineStatus: status,
    daysLeft,
    lastCompletedAt: a.lastCompletedAt,
    payouts: db()
      .payments.filter((p) => p.type === 'WORKER_PAYOUT' && p.assignmentId === a.id)
      .sort((x, y) => y.paidAt.localeCompare(x.paidAt))
      .map(toPaymentDto),
  };
}

function toClientDto(c: MockClient): ClientDto {
  const assignments = db()
    .assignments.filter((a) => a.clientId === c.id)
    .map((a) => toAssignmentDto(a, c.name));

  const receivedAmount = receivedFor(c.id);
  const paidToTeam = round2(assignments.reduce((s, a) => s + a.paidAmount, 0));
  const owedToTeam = round2(assignments.reduce((s, a) => s + a.owedAmount, 0));
  const plannedToTeam = round2(assignments.reduce((s, a) => s + a.plannedAmount, 0));

  const deadlines = assignments
    .map((a) => a.deadlineDate)
    .filter((d): d is string => Boolean(d))
    .sort();
  const nextDeadline = deadlines[0] ?? null;

  const totalUnits = assignments.reduce((s, a) => s + a.totalUnits, 0);
  const completedUnits = assignments.reduce((s, a) => s + a.completedUnits, 0);

  return {
    id: c.id,
    productionId: c.productionId,
    name: c.name,
    totalAmount: c.totalAmount,
    receivedAmount,
    remainingFromClient: Math.max(0, round2(c.totalAmount - receivedAmount)),
    paidToTeam,
    owedToTeam,
    plannedToTeam,
    debtToTeam: Math.max(0, round2(owedToTeam - paidToTeam)),
    margin: round2(receivedAmount - owedToTeam),
    archived: c.archived,
    createdAt: c.createdAt,
    totalUnits,
    completedUnits,
    progressPercent: totalUnits > 0 ? Math.round((completedUnits / totalUnits) * 100) : 0,
    nextDeadline,
    deadlineStatus: deadlineStatus(nextDeadline).status,
    assignments,
    incomePayments: db()
      .payments.filter((p) => p.type === 'CLIENT_INCOME' && p.clientId === c.id)
      .sort((x, y) => y.paidAt.localeCompare(x.paidAt))
      .map(toPaymentDto),
  };
}

function pendingRequests(productionId: string) {
  return db()
    .members.filter(
      (m) => m.productionId === productionId && m.status === 'PENDING' && m.initiatedBy === 'WORKER',
    )
    .map((m) => {
      const u = userById(m.userId);
      return {
        id: m.id,
        userId: u.id,
        name: displayName(u),
        username: u.username ?? null,
        photoUrl: u.photoUrl ?? null,
        roleLabel: roleLabel(u.role, u.customRoleName),
        roleName: roleName(u.role, u.customRoleName),
        createdAt: m.createdAt,
      };
    });
}

function contextFor(u: MockUser) {
  const owned = db().productions.filter((p) => p.ownerId === u.id);
  const ownedIds = new Set(owned.map((p) => p.id));
  const memberships = db()
    .members.filter((m) => m.userId === u.id && !ownedIds.has(m.productionId))
    .map((m) => {
      const p = productionById(m.productionId);
      return {
        id: m.id,
        status: m.status,
        joinMethod: m.joinMethod,
        production: { id: p.id, name: p.name, username: p.username, photoUrl: p.photoUrl },
      };
    });

  const invite = u.pendingInviteProductionId
    ? db().productions.find((p) => p.id === u.pendingInviteProductionId)
    : null;

  return {
    ownedProductions: owned.map(toProductionDto),
    memberships,
    pendingInvite: invite ? { id: invite.id, name: invite.name, username: invite.username } : null,
  };
}

// ── Ishchi tomoni ─────────────────────────────────────────────

function workerRow(a: MockAssignment) {
  const paidAmount = paidFor(a.id);
  const owedAmount = owedFor(a);
  const { status, daysLeft } = deadlineStatus(a.deadlineDate);
  return {
    assignmentId: a.id,
    clientId: a.clientId,
    clientName: clientById(a.clientId).name,
    unitLabel: a.unitLabel,
    totalUnits: a.totalUnits,
    completedUnits: a.completedUnits,
    progressPercent: a.totalUnits > 0 ? Math.round((a.completedUnits / a.totalUnits) * 100) : 0,
    unitPrice: a.unitPrice,
    owedAmount,
    plannedAmount: plannedFor(a),
    paidAmount,
    debt: Math.max(0, round2(owedAmount - paidAmount)),
    deadlineType: a.deadlineType,
    deadlineDate: a.deadlineDate,
    intervalDays: a.intervalDays,
    startDate: a.startDate,
    deadlineStatus: status,
    daysLeft,
    isFinished: a.completedUnits >= a.totalUnits,
  };
}

function workerDashboard(u: MockUser) {
  const memberships = db().members.filter((m) => m.userId === u.id && m.status === 'ACCEPTED');
  const mine = db()
    .assignments.filter((a) => a.userId === u.id)
    .sort((x, y) => (x.deadlineDate ?? '9').localeCompare(y.deadlineDate ?? '9'));

  const groups = new Map<
    string,
    {
      production: { id: string; name: string; username: string; photoUrl: string | null };
      clients: ReturnType<typeof workerRow>[];
      totals: { owedAmount: number; paidAmount: number; debt: number };
    }
  >();

  for (const m of memberships) {
    const p = productionById(m.productionId);
    groups.set(p.id, {
      production: { id: p.id, name: p.name, username: p.username, photoUrl: p.photoUrl },
      clients: [],
      totals: { owedAmount: 0, paidAmount: 0, debt: 0 },
    });
  }

  for (const a of mine) {
    const c = clientById(a.clientId);
    if (!groups.has(c.productionId)) {
      const p = productionById(c.productionId);
      groups.set(p.id, {
        production: { id: p.id, name: p.name, username: p.username, photoUrl: p.photoUrl },
        clients: [],
        totals: { owedAmount: 0, paidAmount: 0, debt: 0 },
      });
    }
    const bucket = groups.get(c.productionId)!;
    const row = workerRow(a);
    bucket.clients.push(row);
    bucket.totals.owedAmount = round2(bucket.totals.owedAmount + row.owedAmount);
    bucket.totals.paidAmount = round2(bucket.totals.paidAmount + row.paidAmount);
    bucket.totals.debt = round2(bucket.totals.debt + row.debt);
  }

  const list = [...groups.values()];
  return {
    user: toUserDto(u),
    singleProduction: list.length === 1,
    groups: list,
    totals: {
      owedAmount: round2(list.reduce((s, g) => s + g.totals.owedAmount, 0)),
      paidAmount: round2(list.reduce((s, g) => s + g.totals.paidAmount, 0)),
      debt: round2(list.reduce((s, g) => s + g.totals.debt, 0)),
    },
    pendingRequests: db()
      .members.filter((m) => m.userId === u.id && m.status === 'PENDING' && m.initiatedBy === 'WORKER')
      .map((m) => {
        const p = productionById(m.productionId);
        return {
          id: m.id,
          productionName: p.name,
          productionUsername: p.username,
          createdAt: m.createdAt,
        };
      }),
  };
}

// ── Assignment kiritish (wizard/tahrirlash) ───────────────────

interface AssignmentInputLike {
  userId: string;
  unitLabel?: string;
  totalUnits: number;
  unitPrice: number;
  deadlineType: 'ONE_TIME' | 'RECURRING';
  deadlineDate?: string;
  intervalDays?: number;
  startDate?: string;
}

function validateInputs(
  productionId: string,
  inputs: AssignmentInputLike[],
  requireDeadline: boolean,
) {
  if (!inputs.length) throw new MockError('Kamida bitta ishchi tanlang.');
  const ids = inputs.map((a) => a.userId);
  if (new Set(ids).size !== ids.length) throw new MockError('Bitta ishchi ikki marta tanlangan.');

  for (const id of ids) {
    const member = db().members.find(
      (m) => m.productionId === productionId && m.userId === id && m.status === 'ACCEPTED',
    );
    if (!member) throw new MockError('Tanlangan ishchi bu agentlik jamoasida yo\'q.');
  }

  for (const a of inputs) {
    if (!Number.isFinite(a.totalUnits) || a.totalUnits < 1) {
      throw new MockError('Ish soni kamida 1 bo\'lsin.');
    }
    if (!Number.isFinite(a.unitPrice) || a.unitPrice < 0) {
      throw new MockError('Narx manfiy bo\'la olmaydi.');
    }
    if (requireDeadline && a.deadlineType === 'ONE_TIME' && !a.deadlineDate) {
      throw new MockError('"Keyingi ish" uchun dedlayn sanasini kiriting.');
    }
    if (a.deadlineType === 'RECURRING') {
      if (!a.intervalDays) throw new MockError('"Har N kunda" uchun intervalni kiriting.');
      if (!a.startDate) throw new MockError('"Har N kunda" uchun birinchi dedlayn sanasini tanlang.');
    }
  }
}

// ── Router ────────────────────────────────────────────────────

type Method = 'GET' | 'POST' | 'PATCH' | 'DELETE';

export async function mockRequest<T>(method: Method, rawPath: string, body?: unknown): Promise<T> {
  // Kichik kechikish — yuklanish holatlari haqiqiy his qilinsin
  await new Promise((r) => setTimeout(r, 90));

  const [path, query] = rawPath.split('?');
  const q = new URLSearchParams(query ?? '');
  const seg = path.split('/').filter(Boolean);
  const b = (body ?? {}) as Record<string, never>;

  const result = route(method, seg, q, b);
  save();
  return result as T;
}

function route(
  method: Method,
  seg: string[],
  q: URLSearchParams,
  b: Record<string, never>,
): unknown {
  const [root, p1, p2, p3] = seg;

  // ── /me ──
  if (root === 'me') {
    const u = currentUser();

    if (!p1 && method === 'GET') return { user: toUserDto(u), ...contextFor(u) };
    if (p1 === 'profile' && method === 'GET') return toUserDto(u);
    if (p1 === 'dashboard' && method === 'GET') return workerDashboard(u);

    if (p1 === 'role' && method === 'POST') {
      if (u.role) throw new MockError('Rol allaqachon tanlangan va uni o\'zgartirib bo\'lmaydi.', 409);
      const role = b['role'] as unknown as string;
      const custom = ((b['customRoleName'] as unknown as string) ?? '').trim();
      if (role === 'OTHER' && !custom) throw new MockError('"Boshqa" uchun rol nomini kiriting.');

      u.role = role as MockUser['role'];
      u.customRoleName = role === 'OTHER' ? custom : null;
      if (role === 'OTHER') {
        db().customRoles.push({ id: uid('cr'), userId: u.id, text: custom, createdAt: nowIso() });
      }

      // Deep-link taklifi bo'lsa — darhol a'zolikka aylanadi
      if (u.pendingInviteProductionId && role !== 'MANAGER') {
        db().members.push({
          id: uid('m'),
          productionId: u.pendingInviteProductionId,
          userId: u.id,
          status: 'ACCEPTED',
          joinMethod: 'INVITE_LINK',
          initiatedBy: 'WORKER',
          createdAt: nowIso(),
          decidedAt: nowIso(),
        });
      }
      u.pendingInviteProductionId = null;
      return { user: toUserDto(u), ...contextFor(u) };
    }

    if (p1 === 'invites' && method === 'GET') {
      return db()
        .members.filter(
          (m) => m.userId === u.id && m.status === 'PENDING' && m.initiatedBy === 'MANAGER',
        )
        .map((m) => {
          const p = productionById(m.productionId);
          const owner = userById(p.ownerId);
          return {
            id: m.id,
            createdAt: m.createdAt,
            production: {
              id: p.id,
              name: p.name,
              username: p.username,
              photoUrl: p.photoUrl,
              ownerName: displayName(owner),
              membersCount: db().members.filter(
                (x) => x.productionId === p.id && x.status === 'ACCEPTED',
              ).length,
            },
          };
        });
    }

    if (p1 === 'assignments' && p2 && method === 'GET') {
      const a = assignmentById(p2);
      if (a.userId !== u.id) throw new MockError('Bu ish sizga tegishli emas.', 403);
      const c = clientById(a.clientId);
      const p = productionById(c.productionId);
      return {
        ...workerRow(a),
        production: { id: p.id, name: p.name, username: p.username },
        payouts: db()
          .payments.filter((x) => x.type === 'WORKER_PAYOUT' && x.assignmentId === a.id)
          .sort((x, y) => y.paidAt.localeCompare(x.paidAt))
          .map(toPaymentDto),
        canEditMoney: false,
      };
    }
  }

  // ── /productions ──
  if (root === 'productions') {
    if (!p1 && method === 'POST') {
      const u = currentUser();
      if (u.role !== 'MANAGER') throw new MockError('Agentlikni faqat menejer yarata oladi.', 403);
      const name = ((b['name'] as unknown as string) ?? '').trim();
      if (name.length < 2) throw new MockError('Agentlik nomi kamida 2 belgi bo\'lsin.');
      const base =
        name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 24) ||
        'studio';
      let username = /^[a-z]/.test(base) ? base : `s_${base}`;
      let i = 1;
      while (db().productions.some((p) => p.username === username)) {
        i += 1;
        username = `${base}_${i}`;
      }
      const p: MockProduction = {
        id: uid('p'),
        name,
        username,
        photoUrl: (b['photoUrl'] as unknown as string) ?? null,
        ownerId: u.id,
        createdAt: nowIso(),
      };
      db().productions.push(p);
      db().members.push({
        id: uid('m'),
        productionId: p.id,
        userId: u.id,
        status: 'ACCEPTED',
        joinMethod: 'OWNER',
        initiatedBy: 'WORKER',
        createdAt: nowIso(),
        decidedAt: nowIso(),
      });
      return toProductionDto(p);
    }

    if (p1 === 'search' && method === 'GET') {
      const term = (q.get('q') ?? '').replace(/^@/, '').trim().toLowerCase();
      if (!term) return [];
      return db()
        .productions.filter(
          (p) =>
            p.username.toLowerCase().includes(term) || p.name.toLowerCase().includes(term),
        )
        .map((p) => ({
          id: p.id,
          name: p.name,
          username: p.username,
          photoUrl: p.photoUrl,
          ownerName: displayName(userById(p.ownerId)),
          membersCount: db().members.filter((m) => m.productionId === p.id && m.status === 'ACCEPTED')
            .length,
        }));
    }

    if (p1 && method === 'PATCH' && !p2) {
      const p = assertOwner(p1);
      if (b['name'] !== undefined) p.name = ((b['name'] as unknown as string) ?? '').trim();
      if (b['photoUrl'] !== undefined) p.photoUrl = ((b['photoUrl'] as unknown as string) || null);
      return toProductionDto(p);
    }

    if (p1 && p2 === 'dashboard' && method === 'GET') {
      const p = assertOwner(p1);
      const clients = db()
        .clients.filter((c) => c.productionId === p.id && !c.archived)
        .map(toClientDto);

      const received = round2(clients.reduce((s, c) => s + c.receivedAmount, 0));
      const paid = round2(clients.reduce((s, c) => s + c.paidToTeam, 0));
      const owed = round2(clients.reduce((s, c) => s + c.owedToTeam, 0));
      const monthStart = startOfMonth();

      const monthlyRevenue = round2(
        db()
          .payments.filter(
            (x) =>
              x.type === 'CLIENT_INCOME' &&
              new Date(x.paidAt).getTime() >= monthStart &&
              clients.some((c) => c.id === x.clientId),
          )
          .reduce((s, x) => s + x.amount, 0),
      );
      const monthlyPayouts = round2(
        db()
          .payments.filter(
            (x) =>
              x.type === 'WORKER_PAYOUT' &&
              new Date(x.paidAt).getTime() >= monthStart &&
              clients.some((c) => c.assignments.some((a) => a.id === x.assignmentId)),
          )
          .reduce((s, x) => s + x.amount, 0),
      );

      const deadlines = clients
        .flatMap((c) => c.assignments)
        .filter((a) => a.deadlineDate && !a.isFinished)
        .sort((x, y) => x.deadlineDate!.localeCompare(y.deadlineDate!))
        .slice(0, 15)
        .map((a) => ({
          assignmentId: a.id,
          clientId: a.clientId,
          clientName: a.clientName,
          workerId: a.worker.id,
          workerName: a.worker.name,
          workerRole: a.worker.roleName,
          deadlineDate: a.deadlineDate!,
          deadlineStatus: a.deadlineStatus,
          daysLeft: a.daysLeft,
          completedUnits: a.completedUnits,
          totalUnits: a.totalUnits,
          unitLabel: a.unitLabel,
        }));

      return {
        production: toProductionDto(p),
        stats: {
          activeClients: clients.length,
          teamMembers: db().members.filter((m) => m.productionId === p.id && m.status === 'ACCEPTED')
            .length,
          receivedFromClients: received,
          paidToTeam: paid,
          owedToTeam: owed,
          teamFullyPaid: paid >= owed,
          debtToTeam: Math.max(0, round2(owed - paid)),
          profit: round2(received - owed),
          monthlyRevenue,
          monthlyPayouts,
          monthlyProfit: round2(monthlyRevenue - monthlyPayouts),
        },
        deadlines,
        pendingRequests: pendingRequests(p.id),
      };
    }

    if (p1 && p2 === 'team' && !p3 && method === 'GET') {
      const p = assertOwner(p1);
      const monthStart = startOfMonth();
      const rows = db()
        .members.filter(
          (m) => m.productionId === p.id && m.status === 'ACCEPTED' && m.userId !== p.ownerId,
        )
        .map((m) => {
          const u = userById(m.userId);
          const mine = db().assignments.filter(
            (a) => a.userId === u.id && clientById(a.clientId).productionId === p.id,
          );

          const clients = mine
            .map((a) => {
              const paid = paidFor(a.id);
              const owed = owedFor(a);
              return {
                assignmentId: a.id,
                clientId: a.clientId,
                clientName: clientById(a.clientId).name,
                unitLabel: a.unitLabel,
                totalUnits: a.totalUnits,
                completedUnits: a.completedUnits,
                unitPrice: a.unitPrice,
                owedAmount: owed,
                paidAmount: paid,
                debt: Math.max(0, round2(owed - paid)),
                deadlineDate: a.deadlineDate,
                deadlineStatus: deadlineStatus(a.deadlineDate).status,
              };
            })
            .sort((x, y) => (x.deadlineDate ?? '9').localeCompare(y.deadlineDate ?? '9'));

          const owedAmount = round2(clients.reduce((s, c) => s + c.owedAmount, 0));
          const paidAmount = round2(clients.reduce((s, c) => s + c.paidAmount, 0));
          const nextDeadline =
            clients.map((c) => c.deadlineDate).filter(Boolean).sort()[0] ?? null;

          return {
            memberId: m.id,
            userId: u.id,
            name: displayName(u),
            username: u.username ?? null,
            photoUrl: u.photoUrl ?? null,
            role: u.role,
            roleLabel: roleLabel(u.role, u.customRoleName),
            roleName: roleName(u.role, u.customRoleName),
            joinMethod: m.joinMethod,
            clients,
            clientsCount: clients.length,
            completedUnits: mine.reduce((s, a) => s + a.completedUnits, 0),
            totalUnits: mine.reduce((s, a) => s + a.totalUnits, 0),
            completedThisMonth: db().workLogs.filter(
              (w) => w.userId === u.id && new Date(w.createdAt).getTime() >= monthStart,
            ).length,
            owedAmount,
            paidAmount,
            debt: Math.max(0, round2(owedAmount - paidAmount)),
            nextDeadline,
            deadlineStatus: deadlineStatus(nextDeadline).status,
          };
        });

      const groups = new Map<string, { key: string; label: string; members: typeof rows }>();
      for (const row of rows) {
        const key = row.role ?? 'OTHER';
        if (!groups.has(key)) {
          groups.set(key, { key, label: ROLE_GROUPS[key] ?? 'Boshqa', members: [] });
        }
        groups.get(key)!.members.push(row);
      }

      return {
        production: toProductionDto(p),
        groups: [...groups.values()],
        pendingRequests: pendingRequests(p.id),
      };
    }

    if (p1 && p2 === 'team' && p3 === 'options' && method === 'GET') {
      const p = assertOwner(p1);
      return db()
        .members.filter(
          (m) => m.productionId === p.id && m.status === 'ACCEPTED' && m.userId !== p.ownerId,
        )
        .map((m) => {
          const u = userById(m.userId);
          return {
            userId: u.id,
            name: displayName(u),
            username: u.username ?? null,
            photoUrl: u.photoUrl ?? null,
            roleLabel: roleLabel(u.role, u.customRoleName),
            roleName: roleName(u.role, u.customRoleName),
          };
        });
    }

    if (p1 && p2 === 'user-search' && method === 'GET') {
      const p = assertOwner(p1);
      const term = (q.get('q') ?? '').replace(/^@/, '').trim().toLowerCase();
      if (term.length < 2) return [];
      return db()
        .users.filter(
          (u) =>
            u.role !== null &&
            u.role !== 'MANAGER' &&
            u.id !== p.ownerId &&
            (displayName(u).toLowerCase().includes(term) ||
              (u.username ?? '').toLowerCase().includes(term)),
        )
        .map((u) => {
          const mem = db().members.find((m) => m.productionId === p.id && m.userId === u.id);
          return {
            userId: u.id,
            name: displayName(u),
            username: u.username ?? null,
            photoUrl: u.photoUrl ?? null,
            roleLabel: roleLabel(u.role, u.customRoleName),
            roleName: roleName(u.role, u.customRoleName),
            memberStatus: mem?.status ?? null,
            invitePending: mem?.status === 'PENDING',
            isMember: mem?.status === 'ACCEPTED',
          };
        });
    }

    if (p1 && p2 === 'invite' && method === 'POST') {
      const p = assertOwner(p1);
      const userId = b['userId'] as unknown as string;
      const target = userById(userId);
      if (target.role === 'MANAGER') {
        throw new MockError('Menejerni jamoaga ishchi sifatida qo\'shib bo\'lmaydi.');
      }
      const existing = db().members.find((m) => m.productionId === p.id && m.userId === userId);
      if (existing?.status === 'ACCEPTED') {
        throw new MockError('Bu foydalanuvchi allaqachon jamoangizda.', 409);
      }
      if (existing?.status === 'PENDING') {
        throw new MockError(
          existing.initiatedBy === 'MANAGER'
            ? 'Taklif allaqachon yuborilgan, javob kutilmoqda.'
            : 'Bu foydalanuvchi sizga ariza yuborgan — uni qabul qiling.',
          409,
        );
      }
      if (existing) {
        existing.status = 'PENDING';
        existing.initiatedBy = 'MANAGER';
        existing.joinMethod = 'INVITE';
        existing.decidedAt = null;
        return { id: existing.id, status: existing.status };
      }
      const member = {
        id: uid('m'),
        productionId: p.id,
        userId,
        status: 'PENDING' as const,
        joinMethod: 'INVITE' as const,
        initiatedBy: 'MANAGER' as const,
        createdAt: nowIso(),
        decidedAt: null,
      };
      db().members.push(member);
      return { id: member.id, status: member.status };
    }

    if (p1 && p2 === 'invite-link' && method === 'GET') {
      const p = assertOwner(p1);
      return { link: toProductionDto(p).inviteLink };
    }

    if (p1 && p2 === 'requests' && method === 'GET') {
      assertOwner(p1);
      return pendingRequests(p1);
    }

    if (p1 && p2 === 'join-request' && method === 'POST') {
      const u = currentUser();
      if (!u.role) throw new MockError('Avval rolingizni tanlang.');
      if (u.role === 'MANAGER') {
        throw new MockError('Menejer boshqa agentlikka ishchi sifatida qo\'shila olmaydi.', 403);
      }
      const p = productionById(p1);
      if (p.ownerId === u.id) throw new MockError('Bu sizning agentligingiz.', 409);

      const existing = db().members.find((m) => m.productionId === p.id && m.userId === u.id);
      if (existing?.status === 'ACCEPTED') {
        throw new MockError('Siz allaqachon bu agentlik a\'zosisiz.', 409);
      }
      if (existing?.status === 'PENDING') {
        throw new MockError('Arizangiz allaqachon yuborilgan, javob kutilmoqda.', 409);
      }
      if (existing) {
        existing.status = 'PENDING';
        existing.initiatedBy = 'WORKER';
        existing.joinMethod = 'REQUEST';
        existing.decidedAt = null;
        return { id: existing.id, status: existing.status, productionName: p.name };
      }
      const member = {
        id: uid('m'),
        productionId: p.id,
        userId: u.id,
        status: 'PENDING' as const,
        joinMethod: 'REQUEST' as const,
        initiatedBy: 'WORKER' as const,
        createdAt: nowIso(),
        decidedAt: null,
      };
      db().members.push(member);
      return { id: member.id, status: member.status, productionName: p.name };
    }

    if (p1 && p2 === 'finance' && method === 'GET') {
      const p = assertOwner(p1);
      const clients = db().clients.filter((c) => c.productionId === p.id).map(toClientDto);
      const revenue = round2(clients.reduce((s, c) => s + c.receivedAmount, 0));
      const payouts = round2(clients.reduce((s, c) => s + c.paidToTeam, 0));
      const agreed = round2(clients.reduce((s, c) => s + c.totalAmount, 0));
      const owed = round2(clients.reduce((s, c) => s + c.owedToTeam, 0));
      const planned = round2(clients.reduce((s, c) => s + c.plannedToTeam, 0));
      const monthStart = startOfMonth();

      const byWorker = new Map<
        string,
        {
          userId: string;
          name: string;
          roleName: string;
          photoUrl: string | null;
          owedAmount: number;
          paidAmount: number;
          debt: number;
          clientsCount: number;
        }
      >();
      for (const c of clients) {
        for (const a of c.assignments) {
          const cur = byWorker.get(a.worker.id) ?? {
            userId: a.worker.id,
            name: a.worker.name,
            roleName: a.worker.roleName,
            photoUrl: a.worker.photoUrl,
            owedAmount: 0,
            paidAmount: 0,
            debt: 0,
            clientsCount: 0,
          };
          cur.owedAmount = round2(cur.owedAmount + a.owedAmount);
          cur.paidAmount = round2(cur.paidAmount + a.paidAmount);
          cur.debt = round2(cur.debt + a.debt);
          cur.clientsCount += 1;
          byWorker.set(a.worker.id, cur);
        }
      }

      const monthRevenue = round2(
        db()
          .payments.filter(
            (x) =>
              x.type === 'CLIENT_INCOME' &&
              new Date(x.paidAt).getTime() >= monthStart &&
              clients.some((c) => c.id === x.clientId),
          )
          .reduce((s, x) => s + x.amount, 0),
      );
      const monthPayouts = round2(
        db()
          .payments.filter(
            (x) =>
              x.type === 'WORKER_PAYOUT' &&
              new Date(x.paidAt).getTime() >= monthStart &&
              clients.some((c) => c.assignments.some((a) => a.id === x.assignmentId)),
          )
          .reduce((s, x) => s + x.amount, 0),
      );

      return {
        production: toProductionDto(p),
        totals: {
          agreedWithClients: agreed,
          receivedFromClients: revenue,
          outstandingFromClients: Math.max(0, round2(agreed - revenue)),
          owedToTeam: owed,
          plannedToTeam: planned,
          paidToTeam: payouts,
          debtToTeam: Math.max(0, round2(owed - payouts)),
          profit: round2(revenue - owed),
          expectedProfit: round2(agreed - planned),
        },
        thisMonth: {
          revenue: monthRevenue,
          payouts: monthPayouts,
          profit: round2(monthRevenue - monthPayouts),
        },
        byClient: clients.map((c) => ({
          clientId: c.id,
          name: c.name,
          totalAmount: c.totalAmount,
          receivedAmount: c.receivedAmount,
          paidToTeam: c.paidToTeam,
          margin: c.margin,
          archived: c.archived,
        })),
        byWorker: [...byWorker.values()],
      };
    }

    // Klientlar
    if (p1 && p2 === 'clients') {
      const p = assertOwner(p1);

      if (method === 'GET') {
        const workerId = q.get('workerId');
        return db()
          .clients.filter((c) => c.productionId === p.id)
          .filter(
            (c) =>
              !workerId ||
              db().assignments.some((a) => a.clientId === c.id && a.userId === workerId),
          )
          .sort((x, y) =>
            x.archived === y.archived
              ? y.createdAt.localeCompare(x.createdAt)
              : Number(x.archived) - Number(y.archived),
          )
          .map(toClientDto);
      }

      if (method === 'POST') {
        const inputs = (b['assignments'] as unknown as AssignmentInputLike[]) ?? [];
        validateInputs(p.id, inputs, true);

        const name = ((b['name'] as unknown as string) ?? '').trim();
        if (!name) throw new MockError('Klient nomini kiriting.');

        const client: MockClient = {
          id: uid('c'),
          productionId: p.id,
          name,
          totalAmount: Number(b['totalAmount'] ?? 0),
          archived: false,
          createdAt: nowIso(),
        };
        db().clients.push(client);

        for (const a of inputs) {
          const start = a.startDate ?? nowIso();
          db().assignments.push({
            id: uid('a'),
            clientId: client.id,
            userId: a.userId,
            unitLabel: a.unitLabel?.trim() || 'ish',
            totalUnits: a.totalUnits,
            completedUnits: 0,
            unitPrice: a.unitPrice,
            deadlineType: a.deadlineType,
            deadlineDate: a.deadlineType === 'ONE_TIME' ? a.deadlineDate! : start,
            intervalDays: a.deadlineType === 'RECURRING' ? a.intervalDays! : null,
            startDate: a.deadlineType === 'RECURRING' ? start : null,
            lastCompletedAt: null,
            createdAt: nowIso(),
          });
        }

        const received = Number(b['receivedAmount'] ?? 0);
        if (received > 0) {
          db().payments.push({
            id: uid('pay'),
            type: 'CLIENT_INCOME',
            amount: received,
            note: 'Klient yaratilganda kiritilgan',
            paidAt: nowIso(),
            clientId: client.id,
            assignmentId: null,
          });
        }

        return toClientDto(client);
      }
    }
  }

  // ── /clients ──
  if (root === 'clients' && p1) {
    const c = clientById(p1);
    assertOwner(c.productionId);

    if (!p2 && method === 'GET') return toClientDto(c);

    if (!p2 && method === 'DELETE') {
      const data = db();
      const ids = data.assignments.filter((a) => a.clientId === c.id).map((a) => a.id);
      data.assignments = data.assignments.filter((a) => a.clientId !== c.id);
      data.payments = data.payments.filter(
        (x) => x.clientId !== c.id && !(x.assignmentId && ids.includes(x.assignmentId)),
      );
      data.workLogs = data.workLogs.filter((w) => !ids.includes(w.assignmentId));
      data.clients = data.clients.filter((x) => x.id !== c.id);
      return { ok: true };
    }

    if (!p2 && method === 'PATCH') {
      if (b['name'] !== undefined) {
        const n = ((b['name'] as unknown as string) ?? '').trim();
        if (!n) throw new MockError('Klient nomini kiriting.');
        c.name = n;
      }
      if (b['totalAmount'] !== undefined) c.totalAmount = Number(b['totalAmount']);
      if (b['archived'] !== undefined) c.archived = Boolean(b['archived']);

      const inputs = b['assignments'] as unknown as AssignmentInputLike[] | undefined;
      if (inputs) {
        validateInputs(c.productionId, inputs, false);
        const data = db();
        const keep = new Set(inputs.map((a) => a.userId));
        const current = data.assignments.filter((a) => a.clientId === c.id);

        // Ro'yxatdan chiqarilganlarni o'chiramiz
        const removed = current.filter((a) => !keep.has(a.userId));
        const removedIds = removed.map((a) => a.id);
        data.assignments = data.assignments.filter((a) => !removedIds.includes(a.id));
        data.payments = data.payments.filter(
          (x) => !(x.assignmentId && removedIds.includes(x.assignmentId)),
        );
        data.workLogs = data.workLogs.filter((w) => !removedIds.includes(w.assignmentId));

        for (const input of inputs) {
          const existing = current.find((a) => a.userId === input.userId);
          const start = input.startDate ?? existing?.startDate ?? nowIso();

          if (existing && input.totalUnits < existing.completedUnits) {
            throw new MockError(
              `${existing.unitLabel}: jami son bajarilgan ishdan (${existing.completedUnits}) kam bo'la olmaydi.`,
            );
          }

          const deadlineDate =
            input.deadlineType === 'ONE_TIME'
              ? (input.deadlineDate ?? null)
              : nextRecurring(start, input.intervalDays!, new Date(existing?.lastCompletedAt ?? Date.now()));

          if (existing) {
            existing.unitLabel = input.unitLabel?.trim() || existing.unitLabel;
            existing.totalUnits = input.totalUnits;
            existing.unitPrice = input.unitPrice;
            existing.deadlineType = input.deadlineType;
            existing.deadlineDate = deadlineDate;
            existing.intervalDays = input.deadlineType === 'RECURRING' ? input.intervalDays! : null;
            existing.startDate = input.deadlineType === 'RECURRING' ? start : null;
          } else {
            data.assignments.push({
              id: uid('a'),
              clientId: c.id,
              userId: input.userId,
              unitLabel: input.unitLabel?.trim() || 'ish',
              totalUnits: input.totalUnits,
              completedUnits: 0,
              unitPrice: input.unitPrice,
              deadlineType: input.deadlineType,
              deadlineDate,
              intervalDays: input.deadlineType === 'RECURRING' ? input.intervalDays! : null,
              startDate: input.deadlineType === 'RECURRING' ? start : null,
              lastCompletedAt: null,
              createdAt: nowIso(),
            });
          }
        }
      }
      return toClientDto(c);
    }

    if (p2 === 'payments' && method === 'POST') {
      const amount = Number(b['amount'] ?? 0);
      if (amount <= 0) throw new MockError('Summa 0 dan katta bo\'lsin.');
      db().payments.push({
        id: uid('pay'),
        type: 'CLIENT_INCOME',
        amount,
        note: ((b['note'] as unknown as string) ?? null) || null,
        paidAt: nowIso(),
        clientId: c.id,
        assignmentId: null,
      });
      const received = receivedFor(c.id);
      return {
        ok: true,
        receivedAmount: received,
        remainingFromClient: Math.max(0, round2(c.totalAmount - received)),
      };
    }
  }

  // ── /assignments ──
  if (root === 'assignments' && p1) {
    const a = assignmentById(p1);
    const client = clientById(a.clientId);
    const production = productionById(client.productionId);
    const me = currentUser();
    const isManager = production.ownerId === me.id;
    const isWorker = a.userId === me.id;

    if (p2 === 'complete' && method === 'POST') {
      if (!isManager && !isWorker) throw new MockError('Ruxsat yo\'q.', 403);
      if (a.completedUnits >= a.totalUnits) {
        throw new MockError('Barcha ishlar allaqachon bajarilgan.');
      }
      a.completedUnits += 1;
      a.lastCompletedAt = nowIso();
      a.deadlineDate =
        a.deadlineType === 'RECURRING' && a.intervalDays
          ? nextRecurring(a.startDate ?? a.createdAt, a.intervalDays)
          : null;
      db().workLogs.push({
        id: uid('wl'),
        assignmentId: a.id,
        userId: a.userId,
        createdAt: nowIso(),
      });
      return toAssignmentDto(a, client.name);
    }

    if (p2 === 'undo' && method === 'POST') {
      if (!isManager) throw new MockError('Bu amalni faqat menejer bajara oladi.', 403);
      if (a.completedUnits <= 0) throw new MockError('Bajarilgan ish yo\'q.');
      a.completedUnits -= 1;
      const data = db();
      const logs = data.workLogs.filter((w) => w.assignmentId === a.id);
      const last = logs.sort((x, y) => y.createdAt.localeCompare(x.createdAt))[0];
      if (last) data.workLogs = data.workLogs.filter((w) => w.id !== last.id);
      return toAssignmentDto(a, client.name);
    }

    if (p2 === 'remind' && method === 'POST') {
      if (!isManager) throw new MockError('Bu amalni faqat menejer bajara oladi.', 403);
      return { sent: true };
    }

    if (p2 === 'payouts' && method === 'POST') {
      if (!isManager) throw new MockError('To\'lovni faqat menejer qayd eta oladi.', 403);
      const amount = Number(b['amount'] ?? 0);
      if (!Number.isFinite(amount) || amount <= 0) {
        throw new MockError('Summa 0 dan katta bo\'lsin.');
      }
      const owed = owedFor(a);
      const debt = round2(owed - paidFor(a.id));
      if (a.completedUnits === 0) {
        throw new MockError('Hali birorta ish bajarilmagan — to\'lov uchun asos yo\'q.');
      }
      if (amount > debt + 0.001) {
        throw new MockError(`To'lov qolgan qarzdan ko'p: qarz $${debt}, kiritilgan $${amount}.`);
      }
      db().payments.push({
        id: uid('pay'),
        type: 'WORKER_PAYOUT',
        amount,
        note: ((b['note'] as unknown as string) ?? null) || null,
        paidAt: nowIso(),
        clientId: null,
        assignmentId: a.id,
      });
      return toAssignmentDto(a, client.name);
    }

    if (!p2 && method === 'PATCH') {
      if (!isManager) throw new MockError('Bu amalni faqat menejer bajara oladi.', 403);

      const deadlineType = (b['deadlineType'] as unknown as typeof a.deadlineType) ?? a.deadlineType;
      const intervalDays = (b['intervalDays'] as unknown as number) ?? a.intervalDays;
      const startDate = (b['startDate'] as unknown as string) ?? a.startDate ?? nowIso();

      if (b['unitLabel'] !== undefined) {
        a.unitLabel = ((b['unitLabel'] as unknown as string) ?? '').trim() || 'ish';
      }
      if (b['unitPrice'] !== undefined) {
        const price = Number(b['unitPrice']);
        if (!Number.isFinite(price) || price < 0) {
          throw new MockError('Narx manfiy bo\'la olmaydi.');
        }
        a.unitPrice = price;
      }
      if (b['totalUnits'] !== undefined) {
        const t = Number(b['totalUnits']);
        if (!Number.isFinite(t) || t < 1) throw new MockError('Ish soni kamida 1 bo\'lsin.');
        if (t < a.completedUnits) {
          throw new MockError(
            `Jami son bajarilgan ishdan (${a.completedUnits}) kam bo'la olmaydi.`,
          );
        }
        a.totalUnits = t;
      }
      if (b['completedUnits'] !== undefined) a.completedUnits = Number(b['completedUnits']);

      if (deadlineType === 'RECURRING') {
        if (!intervalDays) throw new MockError('Interval kunini kiriting.');
        a.deadlineType = 'RECURRING';
        a.intervalDays = intervalDays;
        a.startDate = startDate;
        a.deadlineDate =
          new Date(startDate).getTime() > Date.now()
            ? startDate
            : nextRecurring(startDate, intervalDays, new Date(a.lastCompletedAt ?? Date.now()));
      } else {
        a.deadlineType = 'ONE_TIME';
        a.intervalDays = null;
        a.startDate = null;
        if (b['deadlineDate'] !== undefined) {
          a.deadlineDate = (b['deadlineDate'] as unknown as string) || null;
        }
      }
      return toAssignmentDto(a, client.name);
    }
  }

  // ── /payments/:id ──
  if (root === 'payments' && p1 && method === 'DELETE') {
    const data = db();
    const payment = data.payments.find((x) => x.id === p1);
    if (!payment) throw new MockError('To\'lov topilmadi.', 404);
    const productionId = payment.clientId
      ? clientById(payment.clientId).productionId
      : clientById(assignmentById(payment.assignmentId!).clientId).productionId;
    assertOwner(productionId);
    data.payments = data.payments.filter((x) => x.id !== p1);
    return { ok: true, amount: payment.amount };
  }

  // ── /members/:id ──
  if (root === 'members' && p1) {
    const data = db();
    const member = data.members.find((m) => m.id === p1);
    if (!member) throw new MockError('Ariza topilmadi.', 404);
    const production = productionById(member.productionId);
    const me = currentUser();

    if (p2 === 'invite' && (p3 === 'accept' || p3 === 'decline') && method === 'POST') {
      if (member.userId !== me.id) throw new MockError('Bu taklif sizga tegishli emas.', 403);
      if (member.initiatedBy !== 'MANAGER') {
        throw new MockError('Bu ariza sizniki — qarorni menejer qabul qiladi.');
      }
      if (member.status !== 'PENDING') {
        throw new MockError('Bu taklif bo\'yicha javob allaqachon berilgan.', 409);
      }
      member.status = p3 === 'accept' ? 'ACCEPTED' : 'REJECTED';
      member.decidedAt = nowIso();
      return { id: member.id, status: member.status };
    }

    if ((p2 === 'accept' || p2 === 'reject') && method === 'POST') {
      if (production.ownerId !== me.id) throw new MockError('Ruxsat yo\'q.', 403);
      if (member.status !== 'PENDING') {
        throw new MockError('Bu ariza bo\'yicha qaror allaqachon qabul qilingan.', 409);
      }
      if (member.initiatedBy !== 'WORKER') {
        throw new MockError('Bu taklifni siz yuborgansiz — javobni ishchi beradi.');
      }
      member.status = p2 === 'accept' ? 'ACCEPTED' : 'REJECTED';
      member.decidedAt = nowIso();
      return { id: member.id, status: member.status };
    }

    if (!p2 && method === 'DELETE') {
      if (production.ownerId !== me.id) throw new MockError('Ruxsat yo\'q.', 403);
      if (member.userId === production.ownerId) {
        throw new MockError('Agentlik egasini jamoadan chiqarib bo\'lmaydi.');
      }
      data.members = data.members.filter((m) => m.id !== p1);
      return { ok: true };
    }
  }

  throw new MockError(`Demo rejimda bu amal mavjud emas: ${method} /${seg.join('/')}`, 404);
}
