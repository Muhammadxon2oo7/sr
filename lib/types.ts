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

export interface MeResponse {
  user: UserDto;
  ownedProductions: ProductionDto[];
  memberships: {
    id: string;
    status: MemberStatus;
    joinMethod: string;
    production: { id: string; name: string; username: string; photoUrl: string | null };
  }[];
  pendingInvite: { id: string; name: string; username: string } | null;
  roleChange: RoleChange;
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
