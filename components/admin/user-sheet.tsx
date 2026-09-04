'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { formatFullDate } from '@/lib/format';
import { haptic } from '@/lib/telegram';
import type { AdminUser } from '@/lib/types';
import {
  Avatar,
  Button,
  Card,
  ErrorBanner,
  Field,
  Icon,
  Input,
  Row,
  Sheet,
  Skeleton,
  cx,
} from '@/components/ui';
import { AnimatePresence } from '@/components/ui/motion';
import { StatusBadge } from './user-row';

/**
 * Foydalanuvchi kartasi: to'liq ma'lumot va moderatsiya amallari.
 *
 * Bloklash qaytariladi — ma'lumot va jamoadagi o'rni saqlanadi.
 * O'chirish esa yo'q: menejer bo'lsa prodakshni ham o'chadi.
 */
export function AdminUserSheet({
  userId,
  onClose,
}: {
  userId: string | null;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const [blockOpen, setBlockOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [confirmName, setConfirmName] = useState('');
  const [deleteOpen, setDeleteOpen] = useState(false);

  const { data: user, isLoading } = useQuery({
    queryKey: ['admin-user', userId],
    queryFn: () => api.get<AdminUser>(`/admin/users/${userId}`),
    enabled: Boolean(userId),
  });

  function invalidate() {
    void qc.invalidateQueries({ queryKey: ['admin-user', userId] });
    void qc.invalidateQueries({ queryKey: ['admin-users'] });
    void qc.invalidateQueries({ queryKey: ['admin-stats'] });
    void qc.invalidateQueries({ queryKey: ['admin-premium'] });
  }

  const block = useMutation({
    mutationFn: () => api.post(`/admin/users/${userId}/block`, { reason: reason.trim() }),
    onSuccess: () => {
      haptic('success');
      setBlockOpen(false);
      setReason('');
      invalidate();
    },
    onError: (err) => {
      haptic('error');
      setError((err as Error).message);
    },
  });

  const unblock = useMutation({
    mutationFn: () => api.post(`/admin/users/${userId}/unblock`),
    onSuccess: () => {
      haptic('success');
      invalidate();
    },
    onError: (err) => setError((err as Error).message),
  });

  const remove = useMutation({
    mutationFn: () => api.del(`/admin/users/${userId}`),
    onSuccess: () => {
      haptic('success');
      setDeleteOpen(false);
      setConfirmName('');
      invalidate();
      onClose();
    },
    onError: (err) => {
      haptic('error');
      setError((err as Error).message);
    },
  });

  return (
    <Sheet open={Boolean(userId)} onClose={onClose} title={user?.name ?? 'Foydalanuvchi'}>
      {isLoading || !user ? (
        <div className="space-y-3">
          <Skeleton className="h-24" />
          <Skeleton className="h-32" />
        </div>
      ) : (
        <div className="space-y-4">
          <AnimatePresence>{error && <ErrorBanner message={error} />}</AnimatePresence>

          {/* ── Shaxs ─────────────────────────────────────── */}
          <Card className="flex items-center gap-3.5">
            <Avatar name={user.name} photoUrl={user.photoUrl} size={56} />
            <div className="min-w-0 flex-1">
              <div className="display truncate text-[18px] font-extrabold">{user.name}</div>
              <div className="mt-0.5 truncate text-[12.5px] text-muted">
                {user.username ? `@${user.username}` : 'username yo‘q'} · ID {user.telegramId}
              </div>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                <StatusBadge user={user} />
              </div>
            </div>
          </Card>

          {user.status === 'blocked' && user.blockedReason && (
            <Card tone="flat">
              <div className="eyebrow">Bloklash sababi</div>
              <div className="mt-1 text-[13.5px]">{user.blockedReason}</div>
              {user.blockedAt && (
                <div className="mt-1 text-[11.5px] text-faint">
                  {formatFullDate(user.blockedAt)}
                </div>
              )}
            </Card>
          )}

          {/* ── Ma'lumotlar ───────────────────────────────── */}
          <Card className="divide-y divide-line !p-0">
            <InfoRow label="Kasbi" value={user.roleLabel} />
            {user.productionName && <InfoRow label="Prodakshni" value={user.productionName} />}
            <InfoRow label="Jamoalar" value={String(user.memberships)} />
            <InfoRow label="Biriktirilgan ishlar" value={String(user.assignments)} />
            <InfoRow label="Bajarilgan" value={String(user.completedUnits)} />
            <InfoRow label="Ro'yxatdan o'tgan" value={formatFullDate(user.createdAt)} />
          </Card>

          {user.premiumInterest && (
            <Card tone="flat" className="flex items-center gap-3">
              <span className="text-brand">{Icon.spark({ size: 18 })}</span>
              <div className="text-[13px]">
                <b>Premiumga qiziqqan</b> — {user.premiumTaps} marta bosgan
              </div>
            </Card>
          )}

          {/* ── Amallar ───────────────────────────────────── */}
          {user.isAdmin ? (
            <Card tone="flat">
              <div className="text-[13px] text-muted">
                Bu admin hisobi — uni bloklab yoki o&apos;chirib bo&apos;lmaydi.
              </div>
            </Card>
          ) : user.status === 'deleted' ? (
            <Card tone="flat">
              <div className="text-[13px] text-muted">
                Hisob o&apos;chirilgan. Ish tarixi menejerlarda saqlanib qolgan.
              </div>
            </Card>
          ) : (
            <div className="space-y-2">
              {user.status === 'blocked' ? (
                <Button
                  size="lg"
                  variant="success"
                  icon="check"
                  loading={unblock.isPending}
                  onClick={() => {
                    setError(null);
                    unblock.mutate();
                  }}
                >
                  Blokdan chiqarish
                </Button>
              ) : (
                <Button
                  size="lg"
                  variant="secondary"
                  icon="warning"
                  onClick={() => setBlockOpen((v) => !v)}
                >
                  Bloklash
                </Button>
              )}

              <AnimatePresence>
                {blockOpen && user.status !== 'blocked' && (
                  <div className="space-y-2 pt-1">
                    <Field label="Sabab" hint="Foydalanuvchiga xabar qilib yuboriladi">
                      <Input
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder="Masalan: qoidabuzarlik"
                        maxLength={200}
                      />
                    </Field>
                    <Button
                      size="lg"
                      variant="danger"
                      icon="warning"
                      loading={block.isPending}
                      onClick={() => {
                        setError(null);
                        block.mutate();
                      }}
                    >
                      Bloklashni tasdiqlash
                    </Button>
                  </div>
                )}
              </AnimatePresence>

              <div className="h-px bg-line" />

              {!deleteOpen ? (
                <Button
                  size="lg"
                  variant="danger"
                  icon="logout"
                  onClick={() => setDeleteOpen(true)}
                >
                  Hisobni o&apos;chirish
                </Button>
              ) : (
                <div className="space-y-2.5">
                  <Card tone="flat" className="space-y-2">
                    <div className="flex items-start gap-2.5">
                      <span className="mt-0.5 shrink-0 text-danger">
                        {Icon.warning({ size: 15 })}
                      </span>
                      <span className="text-[13px] leading-relaxed text-muted">
                        Hisob o&apos;chiriladi va foydalanuvchi tizimga kira olmaydi.
                        {user.ownedProductions > 0 && (
                          <>
                            {' '}
                            <b className="text-danger">
                              Uning {user.ownedProductions} ta prodakshni ham o&apos;chadi
                            </b>{' '}
                            — jamoa tarqaydi, klientlar va to&apos;lovlar yo&apos;qoladi.
                          </>
                        )}
                      </span>
                    </div>
                  </Card>

                  <Field label="Tasdiqlash" hint={`Tasdiqlash uchun "${user.name}" deb yozing`}>
                    <Input
                      value={confirmName}
                      onChange={(e) => setConfirmName(e.target.value)}
                      placeholder={user.name}
                    />
                  </Field>

                  <div className="flex gap-2">
                    <Button
                      className="flex-1"
                      variant="secondary"
                      onClick={() => {
                        setDeleteOpen(false);
                        setConfirmName('');
                      }}
                    >
                      Bekor qilish
                    </Button>
                    <Button
                      className="flex-1"
                      variant="danger"
                      disabled={confirmName.trim() !== user.name}
                      loading={remove.isPending}
                      onClick={() => {
                        setError(null);
                        remove.mutate();
                      }}
                    >
                      O&apos;chirish
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </Sheet>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <Row
      className="px-4 py-2.5"
      left={<span className="text-[13px] text-muted">{label}</span>}
      right={<span className="nums text-[14px] font-bold">{value}</span>}
    />
  );
}
