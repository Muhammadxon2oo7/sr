'use client';

import { ReactNode, useRef } from 'react';
import { haptic } from '@/lib/telegram';
import { AnimatePresence, motion, tabVariants } from './motion';

/**
 * Tab kontenti + chapga/o'ngga surish gesturasi.
 *
 * Nega `drag` emas, `pan`? Drag elementni barmoq bilan birga surardi va
 * ichkaridagi gorizontal skrollarni (filtr chiplari) ushlab qolardi.
 * Pan esa hech narsani surmaydi — faqat imo-ishorani o'lchaydi, tab esa
 * odatdagi siljish animatsiyasi bilan almashadi.
 *
 * `data-swipe-ignore` atributi bor element ustida boshlangan imo-ishora
 * e'tiborsiz qoldiriladi (sheet'lar, gorizontal lentalar).
 */
export function SwipeTabs<T extends string>({
  order,
  active,
  onChange,
  children,
}: {
  order: readonly T[];
  active: T;
  onChange: (next: T) => void;
  children: ReactNode;
}) {
  const index = order.indexOf(active);
  const lastIndex = useRef(index);

  // Yo'nalish: yangi tab o'ngdami yoki chapda
  const direction = index >= lastIndex.current ? 1 : -1;
  lastIndex.current = index;

  const ignore = useRef(false);

  function go(delta: number) {
    const next = order[index + delta];
    if (!next) return;
    haptic('light');
    onChange(next);
  }

  return (
    <motion.div
      onPanSessionStart={(event) => {
        const target = event.target as HTMLElement | null;
        ignore.current = Boolean(target?.closest?.('[data-swipe-ignore]'));
      }}
      onPanEnd={(_, info) => {
        if (ignore.current) return;
        // Vertikal skrollni swipe deb o'qimaymiz
        if (Math.abs(info.offset.y) > Math.abs(info.offset.x)) return;
        const power = info.offset.x + info.velocity.x * 0.15;
        if (power < -80) go(1);
        else if (power > 80) go(-1);
      }}
      className="overflow-x-hidden"
    >
      <AnimatePresence mode="wait" custom={direction} initial={false}>
        <motion.div
          key={active}
          custom={direction}
          variants={tabVariants}
          initial="enter"
          animate="center"
          exit="exit"
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}
