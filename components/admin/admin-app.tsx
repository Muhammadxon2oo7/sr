'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { haptic } from '@/lib/telegram';
import type { AdminStats, AdminUsersResponse, PremiumLeadsResponse } from '@/lib/types';
import {
  Badge,
  Card,
  Chip,
  EmptyState,
  Icon,
  LoadingScreen,
  LogoMark,
  Section,
  Stat,
  cx,
} from '@/components/ui';
import { AnimatedItem, AnimatedList, motion, softSpring } from '@/components/ui/motion';
import { AdminUserRow } from './user-row';
import { AdminUserSheet } from './user-sheet';

type View = 'stats' | 'users' | 'premium';

/**
 * Admin paneli.
 *
 * Faqat sozlamada ko'rsatilgan adminlarga ko'rinadi. Server ruxsatsiz
 * so'rovga 404 qaytaradi — panel borligi ham oshkor bo'lmaydi.
 */
export function AdminApp() {
  const [view, setView] = useState<View>('stats');
  const [openUserId, setOpenUserId] = useState<string | null>(null);

  return (
    <div className="space-y-5 px-4 pb-6 pt-3">
      <motion.div
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={softSpring}
        className="flex items-center gap-2.5"
      >
        <LogoMark size={30} />
        <div className="min-w-0 flex-1">
          <div className="eyebrow">Prodly</div>
          <div className="display truncate text-[17px] font-bold">Admin paneli</div>
        </div>
      </motion.div>

      <div data-swipe-ignore className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 pt-1">
        <Chip active={view === 'stats'} onClick={() => setView('stats')} layoutId="admin-view">
          Umumiy
        </Chip>
        <Chip active={view === 'users'} onClick={() => setView('users')} layoutId="admin-view">
          Foydalanuvchilar
        </Chip>
        <Chip active={view === 'premium'} onClick={() => setView('premium')} layoutId="admin-view">
          Premium
        </Chip>
      </div>

      {view === 'stats' && <StatsView />}
      {view === 'users' && <UsersView onOpen={setOpenUserId} />}
      {view === 'premium' && <PremiumView onOpen={setOpenUserId} />}

      <AdminUserSheet userId={openUserId} onClose={() => setOpenUserId(null)} />
    </div>
  );
}

// ── Umumiy raqamlar ──────────────────────────────────────────

function StatsView() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: () => api.get<AdminStats>('/admin/stats'),
  });

  if (isLoading || !data) return <LoadingScreen />;
  const u = data.users;

  return (
    <div className="space-y-5">
      {/* Premium — bu yerdagi eng qimmatli raqam */}
      <Card tone="ember" className="!p-4">
        <div className="ember-scrim pointer-events-none absolute inset-0" />
        <div className="relative">
          <div className="text-[10.5px] font-bold uppercase tracking-[0.13em] text-white/75">
            Premiumga tayyor
          </div>
          <div className="nums mt-1 text-[38px] font-extrabold leading-none text-white">
            {data.premium.leads}
          </div>
          <div className="mt-1 text-[12.5px] text-white/75">
            {data.premium.taps} marta bosilgan · bitta odam bir marta hisoblanadi
          </div>
        </div>
      </Card>

      <Section title="Foydalanuvchilar">
        <div className="grid grid-cols-2 gap-2.5">
          <Stat icon="team" label="Jami" value={u.total} />
          <Stat icon="check" label="Faol" value={u.active} tone="ok" />
          <Stat icon="warning" label="Bloklangan" value={u.blocked} tone={u.blocked > 0 ? 'danger' : 'default'} />
          <Stat icon="logout" label="O'chirilgan" value={u.deleted} />
        </div>
      </Section>

      <Section title="Kasblar bo'yicha">
        <Card className="space-y-2.5">
          <RoleBar label="Prodakshn-menejer" count={u.byRole.MANAGER ?? 0} total={u.total} />
          <RoleBar label="Videograf" count={u.byRole.VIDEOGRAPHER ?? 0} total={u.total} />
          <RoleBar label="Montajyor" count={u.byRole.EDITOR ?? 0} total={u.total} />
          <RoleBar label="Dizayner" count={u.byRole.DESIGNER ?? 0} total={u.total} />
          <RoleBar label="Boshqa" count={u.byRole.OTHER ?? 0} total={u.total} />
          <RoleBar label="Rol tanlamagan" count={u.withoutRole} total={u.total} muted />
        </Card>
      </Section>

      <Section title="Platforma">
        <div className="grid grid-cols-2 gap-2.5">
          <Stat icon="clients" label="Prodakshnlar" value={data.productions} />
          <Stat icon="film" label="Klientlar" value={data.clients} />
          <Stat icon="edit" label="Ish yozuvlari" value={data.assignments} />
          <Stat icon="spark" label="7 kunda yangi" value={u.new7Days} tone="brand" />
        </div>
      </Section>
    </div>
  );
}

function RoleBar({
  label,
  count,
  total,
  muted,
}: {
  label: string;
  count: number;
  total: number;
  muted?: boolean;
}) {
  const percent = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between gap-2">
        <span className={cx('text-[13px] font-semibold', muted ? 'text-faint' : 'text-ink')}>
          {label}
        </span>
        <span className="nums text-[13px] font-bold">
          {count}
          <span className="ml-1 text-[11px] font-medium text-faint">{percent}%</span>
        </span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-sunk">
        <div
          className={cx('h-full rounded-full', muted ? 'bg-line-strong' : 'ember')}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

// ── Foydalanuvchilar ─────────────────────────────────────────

const FILTERS = [
  { key: '', label: 'Hammasi' },
  { key: 'active', label: 'Faol' },
  { key: 'premium', label: 'Premium' },
  { key: 'blocked', label: 'Bloklangan' },
  { key: 'deleted', label: "O'chirilgan" },
  { key: 'no_role', label: 'Rolsiz' },
] as const;

function UsersView({ onOpen }: { onOpen: (id: string) => void }) {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', query, status],
    queryFn: () =>
      api.get<AdminUsersResponse>(
        `/admin/users?q=${encodeURIComponent(query)}&status=${status}&limit=100`,
      ),
  });

  return (
    <div className="space-y-3">
      <div className="hairline flex items-center gap-2 rounded-2xl bg-surface px-4 py-1.5 focus-within:border-brand/60">
        <span className="shrink-0 text-faint">{Icon.search({ size: 17 })}</span>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ism, @username yoki Telegram ID"
          autoCapitalize="none"
          autoCorrect="off"
          className="min-w-0 flex-1 bg-transparent py-2.5 text-[16px] outline-none placeholder:text-faint"
        />
        {query && (
          <button
            onClick={() => setQuery('')}
            aria-label="Tozalash"
            className="shrink-0 text-faint active:opacity-60"
          >
            {Icon.close({ size: 15 })}
          </button>
        )}
      </div>

      <div data-swipe-ignore className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
        {FILTERS.map((f) => (
          <Chip
            key={f.key}
            active={status === f.key}
            onClick={() => {
              haptic('light');
              setStatus(f.key);
            }}
            layoutId="admin-filter"
          >
            {f.label}
          </Chip>
        ))}
      </div>

      {isLoading ? (
        <LoadingScreen />
      ) : !data || data.users.length === 0 ? (
        <EmptyState icon="search" title="Hech kim topilmadi" />
      ) : (
        <>
          <div className="px-1 text-[12px] text-faint">
            {data.total} ta foydalanuvchi
            {data.total > data.users.length ? ` · ${data.users.length} tasi ko'rsatildi` : ''}
          </div>
          <AnimatedList className="space-y-2">
            {data.users.map((u) => (
              <AnimatedItem key={u.id} className="mb-2">
                <AdminUserRow user={u} onClick={() => onOpen(u.id)} />
              </AnimatedItem>
            ))}
          </AnimatedList>
        </>
      )}
    </div>
  );
}

// ── Premium ──────────────────────────────────────────────────

function PremiumView({ onOpen }: { onOpen: (id: string) => void }) {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-premium'],
    queryFn: () => api.get<PremiumLeadsResponse>('/admin/premium?limit=200'),
  });

  if (isLoading || !data) return <LoadingScreen />;

  if (data.leads.length === 0) {
    return (
      <EmptyState
        icon="spark"
        title="Hali hech kim qiziqish bildirmagan"
        description="Foydalanuvchi profilda “Premiumga obuna” tugmasini bosganda shu yerda paydo bo'ladi."
      />
    );
  }

  const managers = data.leads.filter((l) => l.isManager).length;

  return (
    <div className="space-y-3">
      <Card tone="flat" className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] bg-brand/12 text-brand">
          {Icon.spark({ size: 19 })}
        </div>
        <div className="min-w-0">
          <div className="nums text-[17px] font-extrabold">{data.total} kishi</div>
          <div className="text-[12px] text-muted">
            {managers} menejer · {data.total - managers} ishchi
          </div>
        </div>
      </Card>

      <AnimatedList className="space-y-2">
        {data.leads.map((lead) => (
          <AnimatedItem key={lead.user.id} className="mb-2">
            <Card onClick={() => onOpen(lead.user.id)}>
              <div className="flex items-start gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="truncate text-[15px] font-bold tracking-[-0.02em]">
                      {lead.user.name}
                    </span>
                    {lead.isManager && <Badge tone="brand">menejer</Badge>}
                  </div>
                  <div className="mt-0.5 truncate text-[12px] text-muted">
                    {lead.user.username ? `@${lead.user.username} · ` : ''}
                    {lead.user.roleLabel}
                    {lead.productionName ? ` · ${lead.productionName}` : ''}
                  </div>
                  {lead.isManager && lead.teamSize > 0 && (
                    <div className="mt-1 text-[11.5px] text-faint">
                      Jamoasida {lead.teamSize} kishi
                    </div>
                  )}
                </div>
                <div className="shrink-0 text-right">
                  <div className="nums text-[15px] font-extrabold text-brand">{lead.taps}×</div>
                  <div className="text-[10.5px] text-faint">bosgan</div>
                </div>
              </div>
            </Card>
          </AnimatedItem>
        ))}
      </AnimatedList>
    </div>
  );
}
