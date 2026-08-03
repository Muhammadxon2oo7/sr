'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { copyText, haptic, shareToTelegram } from '@/lib/telegram';
import type { UserSearchResult } from '@/lib/types';
import {
  Avatar,
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorBanner,
  Input,
  Row,
  Sheet,
  cx,
} from '@/components/ui';
import { AnimatePresence, AnimatedItem, AnimatedList } from '@/components/ui/motion';
import { IconCopy, IconSearch, IconSend } from '@/components/ui/icons';

type Mode = 'search' | 'link';

/**
 * Jamoaga qo'shishning ikki yo'li (buyurtmachi talabi):
 *  1. Foydalanuvchini qidirib taklif yuborish → ishchi qabul qilsa qo'shiladi.
 *  2. Referal havola → havola orqali kirgan ishchi to'g'ridan-to'g'ri qo'shiladi.
 */
export function InviteSheet({
  productionId,
  open,
  onClose,
}: {
  productionId: string;
  open: boolean;
  onClose: () => void;
}) {
  const [mode, setMode] = useState<Mode>('search');

  return (
    <Sheet open={open} onClose={onClose} title="Jamoaga qo'shish">
      <div className="space-y-4">
        <div className="flex gap-2 rounded-xl bg-muted p-1">
          {(
            [
              { key: 'search', label: 'Qidirib taklif' },
              { key: 'link', label: 'Referal havola' },
            ] as { key: Mode; label: string }[]
          ).map((t) => (
            <button
              key={t.key}
              onClick={() => setMode(t.key)}
              className={cx(
                'flex-1 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors',
                mode === t.key ? 'bg-surface text-fg shadow-sm' : 'text-fg-muted',
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        {mode === 'search' ? (
          <UserSearch productionId={productionId} />
        ) : (
          <ReferralLink productionId={productionId} />
        )}
      </div>
    </Sheet>
  );
}

// ── 1. Foydalanuvchini qidirib taklif yuborish ────────────────

function UserSearch({ productionId }: { productionId: string }) {
  const qc = useQueryClient();
  const [q, setQ] = useState('');
  const [submitted, setSubmitted] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [invited, setInvited] = useState<string[]>([]);

  const { data, isFetching } = useQuery({
    queryKey: ['user-search', productionId, submitted],
    enabled: submitted.trim().length >= 2,
    queryFn: () =>
      api.get<UserSearchResult[]>(
        `/productions/${productionId}/user-search?q=${encodeURIComponent(submitted)}`,
      ),
  });

  const invite = useMutation({
    mutationFn: (userId: string) => api.post(`/productions/${productionId}/invite`, { userId }),
    onSuccess: (_r, userId) => {
      haptic('success');
      setError(null);
      setInvited((prev) => [...prev, userId]);
      void qc.invalidateQueries({ queryKey: ['team', productionId] });
    },
    onError: (err) => {
      haptic('error');
      setError((err as Error).message);
    },
  });

  return (
    <div className="space-y-3">
      <p className="text-[14px] text-fg-muted">
        Ishchini ismi yoki @username bo&apos;yicha toping. Taklif yuborilgach, u qabul qilsa
        jamoangizga qo&apos;shiladi.
      </p>

      <div className="flex gap-2">
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && setSubmitted(q)}
          placeholder="Ism yoki @username"
          autoFocus
        />
        <Button onClick={() => setSubmitted(q)} loading={isFetching}>
          Qidirish
        </Button>
      </div>

      <AnimatePresence>{error && <ErrorBanner message={error} />}</AnimatePresence>

      {submitted.trim().length >= 2 && data?.length === 0 && (
        <EmptyState
          icon={<IconSearch size={22} />}
          title="Topilmadi"
          description="Bu foydalanuvchi hali botga kirmagan bo'lishi mumkin. Referal havolani yuboring."
        />
      )}

      <AnimatedList className="space-y-2">
        {data?.map((u) => {
          const sent = invited.includes(u.userId) || u.invitePending;
          return (
            <AnimatedItem key={u.userId} className="mb-2">
              <Card>
                <Row
                  left={
                    <div className="flex items-center gap-3">
                      <Avatar name={u.name} photoUrl={u.photoUrl} />
                      <div className="min-w-0">
                        <div className="truncate text-[15px] font-semibold">{u.name}</div>
                        <div className="truncate text-[12px] text-fg-muted">
                          {u.roleLabel}
                          {u.username ? ` · @${u.username}` : ''}
                        </div>
                      </div>
                    </div>
                  }
                  right={
                    u.isMember ? (
                      <Badge tone="ok">Jamoada</Badge>
                    ) : sent ? (
                      <span className="text-[13px] text-fg-muted">Yuborildi</span>
                    ) : (
                      <Button
                        size="sm"
                        disabled={invite.isPending}
                        onClick={() => invite.mutate(u.userId)}
                      >
                        Taklif
                      </Button>
                    )
                  }
                />
              </Card>
            </AnimatedItem>
          );
        })}
      </AnimatedList>
    </div>
  );
}

// ── 2. Referal havola ─────────────────────────────────────────

function ReferralLink({ productionId }: { productionId: string }) {
  const [copied, setCopied] = useState(false);

  const { data } = useQuery({
    queryKey: ['invite-link', productionId],
    queryFn: () => api.get<{ link: string }>(`/productions/${productionId}/invite-link`),
  });

  const link = data?.link ?? '';

  return (
    <div className="space-y-4">
      <p className="text-[14px] text-fg-muted">
        Havolani Telegram kontaktingizga yuboring. Havola orqali kirgan ishchi rolini
        tanlagach <b>to&apos;g&apos;ridan-to&apos;g&apos;ri</b> jamoangizga qo&apos;shiladi —
        tasdiqlash talab qilinmaydi.
      </p>

      {/* Asosiy amal: Telegram chat tanlash oynasini ochadi */}
      <Button
        size="lg"
        disabled={!link}
        icon={<IconSend size={17} />}
        onClick={() => {
          haptic('light');
          shareToTelegram(link, 'Jamoamga qo\'shiling');
        }}
      >
        Kontaktga yuborish
      </Button>

      <div className="flex items-center gap-2">
        <div className="h-px flex-1 bg-border" />
        <span className="text-[12px] text-fg-muted">yoki havolani nusxalang</span>
        <div className="h-px flex-1 bg-border" />
      </div>

      <div className="break-all rounded-xl bg-muted px-3.5 py-3 font-mono text-[12px]">
        {link || 'Yuklanmoqda…'}
      </div>

      <Button
        variant="secondary"
        className="w-full"
        disabled={!link}
        onClick={async () => {
          const ok = await copyText(link);
          haptic(ok ? 'success' : 'error');
          setCopied(ok);
          setTimeout(() => setCopied(false), 2000);
        }}
      >
        {copied ? 'Nusxalandi' : 'Nusxa olish'}
      </Button>
    </div>
  );
}
