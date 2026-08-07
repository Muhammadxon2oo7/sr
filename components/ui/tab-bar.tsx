'use client';

import { haptic } from '@/lib/telegram';
import { cx } from './index';
import { AnimatePresence, motion, spring } from './motion';

export interface TabDef<T extends string> {
  key: T;
  label: string;
  icon: string;
  badge?: number;
}

export function TabBar<T extends string>({
  tabs,
  active,
  onChange,
}: {
  tabs: TabDef<T>[];
  active: T;
  onChange: (key: T) => void;
}) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-tg-separator bg-tg-bg/85 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl">
      <div className="mx-auto flex max-w-lg">
        {tabs.map((t) => {
          const isActive = active === t.key;
          return (
            <button
              key={t.key}
              onClick={() => {
                haptic('light');
                onChange(t.key);
              }}
              className="relative flex flex-1 flex-col items-center gap-0.5 py-2"
            >
              {/* Faol tab ostidagi indikator bir tabdan ikkinchisiga sirg'aladi */}
              {isActive && (
                <motion.span
                  layoutId="tab-pill"
                  transition={spring}
                  className="absolute inset-x-3 inset-y-1 -z-10 rounded-2xl bg-tg-button/10"
                />
              )}

              <motion.span
                className="text-[20px] leading-none"
                animate={{ scale: isActive ? 1.12 : 1, y: isActive ? -1 : 0 }}
                transition={spring}
              >
                {t.icon}
              </motion.span>

              <span
                className={cx(
                  'text-[10px] font-medium transition-colors',
                  isActive ? 'text-tg-button' : 'text-tg-hint',
                )}
              >
                {t.label}
              </span>

              <AnimatePresence>
                {t.badge ? (
                  <motion.span
                    key="badge"
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    transition={spring}
                    className="absolute right-[22%] top-1 min-w-4 rounded-full bg-danger px-1 text-[10px] font-bold leading-4 text-white"
                  >
                    {t.badge}
                  </motion.span>
                ) : null}
              </AnimatePresence>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
