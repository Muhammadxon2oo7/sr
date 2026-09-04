'use client';

import type { ProductionDto } from '@/lib/types';
import { haptic } from '@/lib/telegram';
import { Avatar, Icon } from '@/components/ui';
import { motion, softSpring } from '@/components/ui/motion';

/**
 * Agentlik hisobining yuqori paneli.
 *
 * Menejerlik ekranlari — foydalanuvchining shaxsiy hisobi emas, alohida
 * "biznes akkaunt". Shu panel doim ko'rinib turadi, shuning uchun odam
 * qayerda ekanini adashtirmaydi va bir bosishda o'z hisobiga qaytadi.
 */
export function AccountBar({
  production,
  isOwner,
  onExit,
}: {
  production: ProductionDto;
  isOwner: boolean;
  onExit: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={softSpring}
      className="ember sticky top-0 z-30 flex items-center gap-2.5 px-4 py-2 text-white shadow-glow"
    >
      <Avatar name={production.name} photoUrl={production.photoUrl} size={26} />
      <div className="min-w-0 flex-1">
        <div className="truncate text-[13.5px] font-bold leading-tight tracking-[-0.01em]">
          {production.name}
        </div>
        <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/70">
          {isOwner ? 'biznes hisobi' : 'menejer hisobi'}
        </div>
      </div>
      <button
        onClick={() => {
          haptic('light');
          onExit();
        }}
        className="glass-on-ember flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-bold text-white ring-1 ring-white/25 active:opacity-75"
      >
        {Icon.logout({ size: 13, strokeWidth: 2.3 })}
        Chiqish
      </button>
    </motion.div>
  );
}
