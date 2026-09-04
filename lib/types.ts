export type Role = 'MANAGER' | 'VIDEOGRAPHER' | 'EDITOR' | 'DESIGNER' | 'OTHER';
export type MemberStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED';
export type DeadlineType = 'ONE_TIME' | 'RECURRING';
export type DeadlineStatus = 'none' | 'upcoming' | 'today' | 'overdue';

export interface UserDto {
  id: string;
  telegramId: string;
  name: string;
  username: string | null;
  photoUrl: string | null;
  role: Role | null;
  customRoleName: string | null;
  roleLabel: string;
  roleName: string;
  isManager: boolean;
  hasPendingInvite: boolean;
  /** Admin panelini ko'rish huquqi */
  isAdmin: boolean;
  isBlocked: boolean;
}

export interface ProductionDto {
  id: string;
  name: string;
  username: string;
  photoUrl: string | null;
  ownerId: string;
  inviteLink: string;
  createdAt: string;
}

/** Rolni o'zgartirish mumkinmi va nega yo'q. */
export interface RoleChange {
  canChange: boolean;
  reason: string;
  /** Menejer uchun: avval prodakshnni o'chirish kerak */
  mustDeleteProduction: boolean;
}

/**
 * Foydalanuvchi boshqaradigan agentlik.
 *
 * Rol prodakshn ichida belgilanadi, shuning uchun bitta odam bir joyda
 * menejer, boshqasida montajyor bo'lishi mumkin. Bu ro'yxat menejerlik
 * kontekstlarini beradi; bittadan ko'p bo'lsa ilova tanlash so'raydi.
 */
export interface ManagedProduction {
  production: ProductionDto;
  isOwner: boolean;
  clientsCount: number;
}

export interface Membership {
  id: string;
  status: MemberStatus;
  joinMethod: string;
  production: { id: string; name: string; username: string; photoUrl: string | null };
  /** Shu prodakshndagi rol — global kasbdan mustaqil */
  role: Role;
  roleLabel: string;
  isManager: boolean;
}

export interface MeResponse {
  user: UserDto;
  ownedProductions: ProductionDto[];
  memberships: Membership[];
  pendingInvite: { id: string; name: string; username: string } | null;
  roleChange: RoleChange;
  /** Menejerlik qiladigan agentliklar (o'ziniki + ko'tarilganlari) */
  managed: ManagedProduction[];
  /** Oddiy ishchi sifatidagi a'zoliklar soni */
  worksIn: number;
}

/** Hisobni o'chirishdan oldin nima bo'lishini ko'rsatish. */
export interface AccountDeletionPreview {
  canDelete: boolean;
  reason: string;
  /** O'chirilgandan keyin ham menejerda qoladigan ish yozuvlari */
  keptAssignments: number;
  leavingTeams: number;
  unpaidAssignments: number;
}

/** Prodakshnni o'chirishdan oldin nima yo'qolishi. */
export interface ProductionDeletionPreview {
  name: string;
  members: number;
  clients: number;
  assignments: number;
  payments: number;
}

export interface PendingRequest {
  id: string;
  userId: string;
  name: string;
  username: string | null;
  photoUrl: string | null;
  roleLabel: string;
  roleName: string;
  createdAt: string;
}

export interface DeadlineRow {
  assignmentId: string;
  clientId: string;
  clientName: string;
  workerId: string;
  workerName: string;
  workerRole: string;
  deadlineDate: string;
  deadlineStatus: DeadlineStatus;
  daysLeft: number | null;
  completedUnits: number;
  totalUnits: number;
  unitLabel: string;
}

export interface DashboardResponse {
  production: ProductionDto;
  stats: {
    activeClients: number;
    teamMembers: number;
    receivedFromClients: number;
    paidToTeam: number;
    owedToTeam: number;
    teamFullyPaid: boolean;
    debtToTeam: number;
    profit: number;
    monthlyRevenue: number;
    monthlyPayouts: number;
    monthlyProfit: number;
  };
  deadlines: DeadlineRow[];
  pendingRequests: PendingRequest[];
}

/** Jamoa sahifasida ishchi ostida ko'rinadigan klient qatori */
export interface TeamMemberClientRow {
  assignmentId: string;
  clientId: string;
  clientName: string;
  unitLabel: string;
  totalUnits: number;
  completedUnits: number;
  unitPrice: number;
  owedAmount: number;
  paidAmount: number;
  debt: number;
  deadlineDate: string | null;
  deadlineStatus: DeadlineStatus;
}

export interface TeamMemberRow {
  memberId: string;
  userId: string;
  name: string;
  username: string | null;
  photoUrl: string | null;
  role: Role | null;
  roleLabel: string;
  roleName: string;
  joinMethod: string;
  /** Shu prodakshnda menejerlik huquqi bormi */
  isManager: boolean;
  /** Menejer sifatida nechta klientga mas'ul */
  managedClients: number;
  clients: TeamMemberClientRow[];
  clientsCount: number;
  completedUnits: number;
  totalUnits: number;
  completedThisMonth: number;
  owedAmount: number;
  paidAmount: number;
  debt: number;
  nextDeadline: string | null;
  deadlineStatus: DeadlineStatus;
}

export interface TeamResponse {
  production: ProductionDto;
  groups: { key: string; label: string; members: TeamMemberRow[] }[];
  pendingRequests: PendingRequest[];
}

export interface PaymentDto {
  id: string;
  type: 'CLIENT_INCOME' | 'WORKER_PAYOUT';
  amount: number;
  note: string | null;
  paidAt: string;
}

export interface AssignmentDto {
  id: string;
  clientId: string;
  clientName: string;
  worker: {
    id: string;
    name: string;
    username: string | null;
    photoUrl: string | null;
    roleLabel: string;
    roleName: string;
    /** Hisob o'chirilgan — tarix qoladi, yangi ish biriktirib bo'lmaydi */
    isDeleted: boolean;
  };
  unitLabel: string;
  totalUnits: number;
  completedUnits: number;
  progressPercent: number;
  isFinished: boolean;
  unitPrice: number;
  owedAmount: number;
  plannedAmount: number;
  paidAmount: number;
  debt: number;
  isFullyPaid: boolean;
  deadlineType: DeadlineType;
  deadlineDate: string | null;
  intervalDays: number | null;
  startDate: string | null;
  deadlineStatus: DeadlineStatus;
  daysLeft: number | null;
  lastCompletedAt: string | null;
  payouts: PaymentDto[];
}

export interface ClientDto {
  id: string;
  productionId: string;
  name: string;
  totalAmount: number;
  receivedAmount: number;
  remainingFromClient: number;
  paidToTeam: number;
  owedToTeam: number;
  plannedToTeam: number;
  debtToTeam: number;
  margin: number;
  /** Klientga mas'ul menejer (null — faqat ega ko'radi) */
  managerId: string | null;
  archived: boolean;
  createdAt: string;
  totalUnits: number;
  completedUnits: number;
  progressPercent: number;
  nextDeadline: string | null;
  deadlineStatus: DeadlineStatus;
  assignments: AssignmentDto[];
  incomePayments: PaymentDto[];
}

export interface TeamOption {
  userId: string;
  name: string;
  username: string | null;
  photoUrl: string | null;
  roleLabel: string;
  roleName: string;
  /** Klientni faqat menejerga biriktirish mumkin */
  isManager: boolean;
}

/** Prodakshn harajati: summa + qisqacha izoh. */
export interface Expense {
  id: string;
  amount: number;
  note: string;
  spentAt: string;
  author: { id: string; name: string; username: string | null; photoUrl: string | null } | null;
  /** Ega hammasini, menejer faqat o'zinikini o'chira oladi */
  canEdit: boolean;
}

export interface ExpensesResponse {
  items: Expense[];
  total: number;
  month: number;
}

export interface FinanceResponse {
  production: ProductionDto;
  totals: {
    agreedWithClients: number;
    receivedFromClients: number;
    outstandingFromClients: number;
    owedToTeam: number;
    plannedToTeam: number;
    paidToTeam: number;
    debtToTeam: number;
    /** Harajatlar foydadan chiqarilgan */
    expenses: number;
    profit: number;
    expectedProfit: number;
  };
  thisMonth: { revenue: number; payouts: number; profit: number };
  byClient: {
    clientId: string;
    name: string;
    totalAmount: number;
    receivedAmount: number;
    paidToTeam: number;
    margin: number;
    archived: boolean;
  }[];
  byWorker: {
    userId: string;
    name: string;
    roleName: string;
    photoUrl: string | null;
    isDeleted: boolean;
    owedAmount: number;
    paidAmount: number;
    debt: number;
    clientsCount: number;
  }[];
}

export interface WorkerClientRow {
  assignmentId: string;
  clientId: string;
  clientName: string;
  unitLabel: string;
  totalUnits: number;
  completedUnits: number;
  progressPercent: number;
  unitPrice: number;
  /** Ishlangan pul = narx × bitgan ishlar */
  owedAmount: number;
  plannedAmount: number;
  paidAmount: number;
  debt: number;
  deadlineType: DeadlineType;
  deadlineDate: string | null;
  intervalDays: number | null;
  startDate: string | null;
  deadlineStatus: DeadlineStatus;
  daysLeft: number | null;
  isFinished: boolean;
}

export interface WorkerDashboard {
  user: UserDto;
  singleProduction: boolean;
  groups: {
    production: { id: string; name: string; username: string; photoUrl: string | null };
    clients: WorkerClientRow[];
    totals: { owedAmount: number; paidAmount: number; debt: number };
  }[];
  totals: { owedAmount: number; paidAmount: number; debt: number };
  pendingRequests: {
    id: string;
    productionName: string;
    productionUsername: string;
    createdAt: string;
  }[];
}

export interface WorkerAssignmentDetail extends WorkerClientRow {
  production: { id: string; name: string; username: string };
  payouts: PaymentDto[];
  canEditMoney: boolean;
}

export interface ProductionSearchResult {
  id: string;
  name: string;
  username: string;
  photoUrl: string | null;
  ownerName: string;
  membersCount: number;
}

export interface AssignmentInput {
  userId: string;
  unitLabel?: string;
  totalUnits: number;
  /** Har bir bajarilgan ish uchun narx */
  unitPrice: number;
  deadlineType: DeadlineType;
  deadlineDate?: string;
  intervalDays?: number;
  /** RECURRING uchun birinchi dedlayn sanasi */
  startDate?: string;
}

/** Menejer jamoaga qo'shish uchun qidirgan foydalanuvchi */
export interface UserSearchResult {
  userId: string;
  name: string;
  username: string | null;
  photoUrl: string | null;
  roleLabel: string;
  roleName: string;
  memberStatus: MemberStatus | null;
  invitePending: boolean;
  isMember: boolean;
}

/** Ishchiga kelgan taklif */
export interface IncomingInvite {
  id: string;
  createdAt: string;
  production: {
    id: string;
    name: string;
    username: string;
    photoUrl: string | null;
    ownerName: string;
    membersCount: number;
  };
}

// ─── Admin paneli ────────────────────────────────────────────

export type AdminUserStatus = 'active' | 'blocked' | 'deleted' | 'no_role';

export interface AdminUser {
  id: string;
  telegramId: string;
  name: string;
  username: string | null;
  photoUrl: string | null;
  role: Role | null;
  roleLabel: string;
  createdAt: string;
  updatedAt: string;

  status: AdminUserStatus;
  blockedReason: string | null;
  blockedAt: string | null;
  deletedAt: string | null;

  ownedProductions: number;
  productionName: string | null;
  memberships: number;
  assignments: number;
  completedUnits: number;

  // Pul ataylab yo'q: kim qancha ishlab topgani prodakshn ichidagi
  // maxfiy ma'lumot va platforma adminiga ko'rinmaydi.

  premiumInterest: boolean;
  premiumTaps: number;

  isAdmin: boolean;
}

export interface AdminUsersResponse {
  users: AdminUser[];
  total: number;
  limit: number;
  offset: number;
}

export interface AdminStats {
  users: {
    total: number;
    active: number;
    blocked: number;
    deleted: number;
    withoutRole: number;
    managers: number;
    workers: number;
    byRole: Record<string, number>;
    new7Days: number;
    new30Days: number;
  };
  productions: number;
  clients: number;
  assignments: number;
  premium: {
    /** Nechta odam qiziqish bildirgan — bitta odam bir marta */
    leads: number;
    /** Jami bosishlar — qiziqish darajasi */
    taps: number;
  };
}

export interface PremiumLead {
  user: AdminUser;
  taps: number;
  firstTap: string;
  lastTap: string;
  isManager: boolean;
  productionName: string | null;
  teamSize: number;
}

export interface PremiumLeadsResponse {
  leads: PremiumLead[];
  total: number;
}
