'use client';

import type { ReactNode } from 'react';
import { haptic } from '@/lib/telegram';
import { cx } from './index';
import { AnimatePresence, motion, spring } from './motion';

export interface TabDef<T extends string> {
  key: T;
  label: string;
  icon: ReactNode;
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
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-bg/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl">
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
              className={cx(
                'relative flex flex-1 flex-col items-center gap-1 py-2.5 transition-colors',
                isActive ? 'text-fg' : 'text-fg-subtle',
              )}
            >
              {/* Faol tab tepasidagi chiziq bir tabdan ikkinchisiga sirg'aladi */}
              {isActive && (
                <motion.span
                  layoutId="tab-indicator"
                  transition={spring}
                  className="absolute -top-px left-1/2 h-0.5 w-8 -translate-x-1/2 rounded-full bg-fg"
                />
              )}

              <motion.span animate={{ scale: isActive ? 1.04 : 1 }} transition={spring}>
                {t.icon}
              </motion.span>

              <span className="text-[10px] font-medium leading-none">{t.label}</span>

              <AnimatePresence>
                {t.badge ? (
                  <motion.span
                    key="badge"
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    transition={spring}
                    className="absolute right-[24%] top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-fg px-1 text-[10px] font-semibold leading-none text-bg"
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
