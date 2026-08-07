'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { haptic, openLink } from '@/lib/telegram';
import type { UserSearchResult } from '@/lib/types';
import { Button, ErrorBanner, Input, Sheet } from '@/components/ui';
import { AnimatePresence } from '@/components/ui/motion';

/**
 * Jamoaga qo'shish: @username bo'yicha taklif yuborish yoki
 * referal havolani to'g'ridan-to'g'ri Telegram chatiga ulashish.
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
  const qc = useQueryClient();
  const [username, setUsername] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState<string | null>(null);

  const { data: linkData } = useQuery({
    queryKey: ['invite-link', productionId],
    enabled: open,
    queryFn: () => api.get<{ link: string }>(`/productions/${productionId}/invite-link`),
  });
  const link = linkData?.link ?? '';

  const invite = useMutation({
    mutationFn: async () => {
      const q = username.trim().replace(/^@/, '');
      if (q.length < 2) throw new Error('Username kamida 2 belgi bo\'lsin.');

      const found = await api.get<UserSearchResult[]>(
        `/productions/${productionId}/user-search?q=${encodeURIComponent(q)}`,
      );
      const user =
        found.find((u) => u.username?.toLowerCase() === q.toLowerCase()) ??
        (found.length === 1 ? found[0] : undefined);

      if (!user) {
        throw new Error(
          'Bunday foydalanuvchi topilmadi. U hali botga kirmagan bo\'lishi mumkin — havolani yuboring.',
        );
      }
      if (user.isMember) throw new Error(`${user.name} allaqachon jamoada.`);
      if (user.invitePending) throw new Error(`${user.name}ga taklif allaqachon yuborilgan.`);

      await api.post(`/productions/${productionId}/invite`, { userId: user.userId });
      return user;
    },
    onSuccess: (user) => {
      haptic('success');
      setError(null);
      setSentTo(user.name);
      setUsername('');
      void qc.invalidateQueries({ queryKey: ['team', productionId] });
    },
    onError: (err) => {
      haptic('error');
      setSentTo(null);
      setError((err as Error).message);
    },
  });

  return (
    <Sheet open={open} onClose={onClose} title="Jamoaga qo'shish">
      <div className="space-y-4">
        <div className="flex items-center gap-2 rounded-xl bg-tg-secondary px-3.5 py-1.5">
          <input
            value={username}
            onChange={(e) => {
              setUsername(e.target.value);
              setSentTo(null);
            }}
            onKeyDown={(e) => e.key === 'Enter' && invite.mutate()}
            placeholder="@username"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            className="min-w-0 flex-1 bg-transparent py-2 text-[16px] outline-none placeholder:text-tg-hint"
          />
          <button
            type="button"
            aria-label="Taklif yuborish"
            disabled={invite.isPending}
            onClick={() => invite.mutate()}
            className="shrink-0 px-2 text-[22px] leading-none text-tg-link active:opacity-60 disabled:opacity-40"
          >
            ✓
          </button>
        </div>

        <AnimatePresence>{error && <ErrorBanner message={error} />}</AnimatePresence>
        {sentTo && (
          <div className="text-[14px] text-ok">{sentTo}ga taklif yuborildi ✓</div>
        )}

        <div className="text-[14px] text-tg-hint">Yoki</div>

        <Button
          size="lg"
          variant="secondary"
          disabled={!link}
          onClick={() =>
            openLink(
              `https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(
                'Jamoamga qo\'shiling',
              )}`,
            )
          }
        >
          Link yuborish
        </Button>
      </div>
    </Sheet>
  );
}
