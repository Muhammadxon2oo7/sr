'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { haptic } from '@/lib/telegram';
import { Card, EmberWatermark, Icon } from '@/components/ui';
import { AnimatePresence, motion, spring } from '@/components/ui/motion';

/**
 * Premium bloki.
 *
 * Tugma bosilganda qiziqish serverda qayd etiladi — adminlar nechta
 * odam to'lashga tayyorligini ko'radi. Bitta foydalanuvchi bir marta
 * hisoblanadi, shuning uchun takror bosish raqamni shishirmaydi.
 */
export function PremiumCard({ subtitle }: { subtitle: string }) {
  const [done, setDone] = useState(false);

  const record = useMutation({
    mutationFn: () => api.post<{ first: boolean }>('/me/premium-interest'),
    onSuccess: () => {
      haptic('success');
      setDone(true);
    },
    // Tarmoq xatosi bo'lsa ham foydalanuvchiga tashvish bermaymiz:
    // bu marketing signali, biznes amali emas.
    onError: () => setDone(true),
  });

  return (
    <Card tone="ember">
      <EmberWatermark size={116} position="-bottom-9 -right-6" />
      <div className="ember-scrim pointer-events-none absolute inset-0" />

      <div className="relative flex items-center gap-3">
        <div className="glass-on-ember flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] text-white">
          {Icon.spark({ size: 19 })}
        </div>
        <div className="min-w-0 flex-1">
          <div className="display text-[15px] font-extrabold text-white">Prodly Premium</div>
          <div className="truncate text-[12px] text-white/75">{subtitle}</div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {done ? (
          <motion.div
            key="done"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={spring}
            className="relative mt-3 flex items-center justify-center gap-2 rounded-[15px] bg-white/20 py-2.5 text-[14px] font-bold text-white backdrop-blur-sm"
          >
            {Icon.check({ size: 16, strokeWidth: 2.4 })}
            Qiziqishingiz qabul qilindi
          </motion.div>
        ) : (
          <motion.button
            key="cta"
            exit={{ opacity: 0 }}
            whileTap={{ scale: 0.97 }}
            transition={spring}
            disabled={record.isPending}
            onClick={() => record.mutate()}
            className="relative mt-3 w-full rounded-[15px] bg-white py-2.5 text-[15px] font-extrabold text-brand-deep active:opacity-85 disabled:opacity-70"
          >
            Obuna bo&apos;lish
          </motion.button>
        )}
      </AnimatePresence>

      {done && (
        <p className="relative mt-2 text-center text-[11.5px] leading-relaxed text-white/70">
          Premium tayyor bo&apos;lganda birinchilardan bo&apos;lib xabar beramiz.
        </p>
      )}
    </Card>
  );
}
