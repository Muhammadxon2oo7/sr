'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { haptic, openLink } from '@/lib/telegram';
import type { UserSearchResult } from '@/lib/types';
import { Button, ErrorBanner, Icon, Sheet, scrollIntoViewOnFocus } from '@/components/ui';
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
        <div className="hairline flex items-center gap-2 rounded-2xl bg-surface px-4 py-1.5 focus-within:border-brand/60">
          <span className="shrink-0 text-faint">{Icon.search({ size: 17 })}</span>
          <input
            value={username}
            onChange={(e) => {
              setUsername(e.target.value);
              setSentTo(null);
            }}
            onKeyDown={(e) => e.key === 'Enter' && invite.mutate()}
            onFocus={(e) => scrollIntoViewOnFocus(e.currentTarget)}
            placeholder="@username"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            className="min-w-0 flex-1 bg-transparent py-2.5 text-[16px] outline-none placeholder:text-faint"
          />
          <button
            type="button"
            aria-label="Taklif yuborish"
            disabled={invite.isPending}
            onClick={() => invite.mutate()}
            className="ember flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white active:opacity-70 disabled:opacity-40"
          >
            {Icon.send({ size: 15 })}
          </button>
        </div>

        <AnimatePresence>{error && <ErrorBanner message={error} />}</AnimatePresence>
        {sentTo && (
          <div className="flex items-center gap-1.5 rounded-2xl bg-ok/10 px-3.5 py-2.5 text-[13.5px] font-semibold text-ok">
            {Icon.check({ size: 15 })} {sentTo}ga taklif yuborildi
          </div>
        )}

        <div className="flex items-center gap-3">
          <span className="h-px flex-1 bg-line" />
          <span className="eyebrow">yoki</span>
          <span className="h-px flex-1 bg-line" />
        </div>

        <Button
          size="lg"
          variant="secondary"
          icon="send"
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
