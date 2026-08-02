'use client';

import {
  AnimatePresence,
  MotionConfig,
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  type Transition,
  type Variants,
} from 'motion/react';
import { ReactNode, useEffect } from 'react';

// ── Umumiy harakat tili ───────────────────────────────────────
// Bitta "spring" tili — barcha elementlar bir xil fizika bo'yicha harakatlanadi,
// shunda ilova yaxlit va tabiiy his qilinadi (iOS'ga yaqin).

export const spring: Transition = { type: 'spring', stiffness: 420, damping: 34, mass: 0.9 };
export const softSpring: Transition = { type: 'spring', stiffness: 260, damping: 30 };
export const quick: Transition = { duration: 0.18, ease: [0.32, 0.72, 0, 1] };

export { AnimatePresence, MotionConfig, motion };

/** Ro'yxat konteyneri — bolalar navbat bilan chiqadi. */
export const listVariants: Variants = {
  hidden: { opacity: 1 },
  show: { opacity: 1, transition: { staggerChildren: 0.045, delayChildren: 0.02 } },
};

/** Ro'yxat elementi — pastdan yumshoq ko'tarilib chiqadi. */
export const itemVariants: Variants = {
  hidden: { opacity: 0, y: 12, scale: 0.985 },
  show: { opacity: 1, y: 0, scale: 1, transition: spring },
  exit: { opacity: 0, scale: 0.97, transition: quick },
};

/** Tab almashinuvi — yo'nalishga qarab siljish. */
export const tabVariants: Variants = {
  enter: (dir: number) => ({ opacity: 0, x: dir > 0 ? 24 : -24 }),
  center: { opacity: 1, x: 0, transition: { ...spring, opacity: { duration: 0.15 } } },
  exit: (dir: number) => ({
    opacity: 0,
    x: dir > 0 ? -24 : 24,
    transition: { duration: 0.14, ease: 'easeIn' as const },
  }),
};

/** Master (wizard) qadamlari — gorizontal siljish. */
export const stepVariants: Variants = {
  enter: (dir: number) => ({ opacity: 0, x: dir > 0 ? 40 : -40 }),
  center: { opacity: 1, x: 0, transition: spring },
  exit: (dir: number) => ({
    opacity: 0,
    x: dir > 0 ? -40 : 40,
    transition: { duration: 0.15, ease: 'easeIn' as const },
  }),
};

/** Ro'yxatni o'rab, staggered animatsiya beradi. */
export function AnimatedList({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      variants={listVariants}
      initial="hidden"
      animate="show"
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function AnimatedItem({
  children,
  className,
  layoutId,
}: {
  children: ReactNode;
  className?: string;
  layoutId?: string;
}) {
  return (
    <motion.div variants={itemVariants} layoutId={layoutId} className={className}>
      {children}
    </motion.div>
  );
}

/**
 * Raqamlarni "sanab" ko'rsatish — pul o'zgarganda diqqatni tortadi
 * va yangilanish sodir bo'lganini bildiradi.
 */
export function AnimatedNumber({
  value,
  format,
  className,
}: {
  value: number;
  format: (n: number) => string;
  className?: string;
}) {
  const motionValue = useMotionValue(value);
  const animated = useSpring(motionValue, { stiffness: 140, damping: 22, mass: 0.6 });
  const text = useTransform(animated, (latest) => format(latest));

  useEffect(() => {
    motionValue.set(value);
  }, [motionValue, value]);

  return <motion.span className={className}>{text}</motion.span>;
}

/** Bosilganda "cho'kadigan" sirt — tap javobini seziladigan qiladi. */
export const tapProps = {
  whileTap: { scale: 0.975 },
  transition: spring,
};
