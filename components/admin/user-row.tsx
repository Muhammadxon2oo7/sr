'use client';

import type { AdminUser } from '@/lib/types';
import { Avatar, Badge, Card, Icon, cx } from '@/components/ui';

/** Admin ro'yxatidagi bitta foydalanuvchi. */
export function AdminUserRow({ user, onClick }: { user: AdminUser; onClick: () => void }) {
  const dimmed = user.status === 'deleted';

  return (
    <Card onClick={onClick} className={cx(dimmed && 'opacity-60')}>
      <div className="flex items-start gap-3">
        <Avatar name={user.name} photoUrl={user.photoUrl} size={42} />

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="truncate text-[15px] font-bold tracking-[-0.02em]">{user.name}</span>
            <StatusBadge user={user} />
          </div>

          <div className="mt-0.5 truncate text-[12px] text-muted">
            {user.username ? `@${user.username} · ` : ''}
            {user.roleLabel}
            {user.productionName ? ` · ${user.productionName}` : ''}
          </div>

          {/* Faoliyat — bir qatorda, faqat nolga teng bo'lmaganlari */}
          <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-[11.5px] text-faint">
            {user.memberships > 0 && <span>{user.memberships} jamoa</span>}
            {user.assignments > 0 && <span>{user.assignments} ish</span>}
            {user.completedUnits > 0 && <span>{user.completedUnits} bajarilgan</span>}
            {user.premiumInterest && (
              <span className="inline-flex items-center gap-0.5 font-semibold text-brand">
                {Icon.spark({ size: 11 })} premium
              </span>
            )}
          </div>
        </div>

        <span className="mt-2 shrink-0 text-faint">{Icon.chevron({ size: 15 })}</span>
      </div>
    </Card>
  );
}

export function StatusBadge({ user }: { user: AdminUser }) {
  if (user.isAdmin) return <Badge tone="brand" icon="spark">admin</Badge>;

  switch (user.status) {
    case 'blocked':
      return <Badge tone="danger" icon="warning">bloklangan</Badge>;
    case 'deleted':
      return <Badge tone="neutral">o&apos;chirilgan</Badge>;
    case 'no_role':
      return <Badge tone="warn">rol tanlamagan</Badge>;
    default:
      return null;
  }
}
