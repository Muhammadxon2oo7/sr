'use client';

import { haptic } from '@/lib/telegram';
import { cx } from './cx';
import { Icon, type IconName } from './icons';
import { AnimatePresence, motion, spring } from './motion';

export interface TabDef<T extends string> {
  key: T;
  label: string;
  icon: IconName;
  badge?: number;
}

/**
 * Pastki navigatsiya — ekran qirrasiga yopishmagan, "suzuvchi dock".
 * Faol tab ostida ember kapsulasi sirg'aladi va ikonka ustidan
 * kichik cho'g' nuqtasi yonadi — brend imzosi shu yerda takrorlanadi.
 */
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
    <nav className="fixed inset-x-0 bottom-0 z-30 px-4 pb-[calc(env(safe-area-inset-bottom)+10px)] pt-2">
      {/* Kontent dock ostidan yumshoq "erib" o'tadi */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-32 bg-gradient-to-t from-canvas via-canvas/85 to-transparent" />

      <div className="glass mx-auto flex max-w-[400px] items-center gap-1 rounded-[26px] border border-line-strong p-1.5 shadow-lift">
        {tabs.map((t) => {
          const isActive = active === t.key;
          return (
            <button
              key={t.key}
              onClick={() => {
                haptic('light');
                onChange(t.key);
              }}
              aria-current={isActive ? 'page' : undefined}
              className="relative flex flex-1 flex-col items-center gap-1 rounded-[20px] py-2"
            >
              {isActive && (
                <motion.span
                  layoutId="tab-pill"
                  transition={spring}
                  className="ember absolute inset-0 -z-10 rounded-[20px] shadow-glow"
                />
              )}

              <motion.span
                className={cx(
                  'relative transition-colors',
                  isActive ? 'text-white' : 'text-muted',
                )}
                animate={{ scale: isActive ? 1.06 : 1, y: isActive ? -0.5 : 0 }}
                transition={spring}
              >
                {Icon[t.icon]({ size: 21, strokeWidth: isActive ? 2.1 : 1.75 })}
              </motion.span>

              <span
                className={cx(
                  'text-[10px] font-bold tracking-[0.01em] transition-colors',
                  isActive ? 'text-white' : 'text-faint',
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
                    className={cx(
                      'absolute right-[18%] top-0.5 min-w-[17px] rounded-full px-1 text-[10px] font-extrabold leading-[17px]',
                      isActive ? 'bg-white text-brand-deep' : 'bg-danger text-white',
                    )}
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
