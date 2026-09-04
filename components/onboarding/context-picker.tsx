'use client';

import { useState } from 'react';
import type { ManagedProduction } from '@/lib/types';
import { useAuth } from '@/lib/auth';
import {
  Avatar,
  Badge,
  Button,
  Card,
  EmberWatermark,
  Icon,
  Sheet,
  Wordmark,
} from '@/components/ui';
import { AnimatedItem, AnimatedList, motion, softSpring } from '@/components/ui/motion';
import { CreateProduction } from './create-production';

/** Tanlangan kontekst shu kalitda saqlanadi. */
export const MANAGED_CONTEXT_KEY = 'prodly:context';

/** "O'z ishlarim" rejimi — prodakshn ID emas, alohida qiymat. */
export const WORKER_CONTEXT = 'worker';

/**
 * Kontekst tanlash.
 *
 * Foydalanuvchi bir nechta agentlikda menejer bo'lishi va shu bilan
 * birga boshqa joyda montajyor bo'lib ishlashi mumkin. Bitta ekranga
 * hammasini tiqishtirgandan ko'ra, u qaysi "shapka"da ishlayotganini
 * tanlagani tushunarli — Telegram akkaunt almashtirgani kabi.
 */
export function ContextPicker({
  managed,
  worksIn,
  onPick,
}: {
  managed: ManagedProduction[];
  worksIn: number;
  onPick: (context: string) => void;
}) {
  const { me } = useAuth();
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <div className="mx-auto min-h-dvh max-w-lg px-4 pb-10 pt-8">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={softSpring}>
        <Wordmark />
        <h1 className="display mt-5 text-[26px] font-extrabold leading-[1.15] tracking-[-0.03em]">
          Qayerda ishlaymiz?
        </h1>
        <p className="mt-1.5 text-[14px] leading-relaxed text-muted">
          {me?.user.name}, sizda bir nechta o&apos;rin bor. Keyin profildan
          istalgan payt almashtirasiz.
        </p>
      </motion.div>

      <AnimatedList className="mt-6 space-y-2.5">
        {managed.map((m) => (
          <AnimatedItem key={m.production.id} className="mb-2.5">
            <button
              onClick={() => onPick(m.production.id)}
              className="block w-full text-left active:opacity-85"
            >
              <Card tone="ember" className="!p-4">
                <EmberWatermark size={130} position="-right-8 -top-9" />
                <div className="ember-scrim pointer-events-none absolute inset-0" />
                <div className="relative flex items-center gap-3.5">
                  <span className="rounded-[19px] bg-white/20 p-[3px] ring-1 ring-white/30 backdrop-blur-md">
                    <Avatar name={m.production.name} photoUrl={m.production.photoUrl} size={48} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="display truncate text-[17px] font-extrabold text-white">
                      {m.production.name}
                    </div>
                    <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                      <Badge tone="onEmber" icon="spark">
                        {m.isOwner ? 'Egasi' : 'Menejer'}
                      </Badge>
                      <Badge tone="onEmber">{m.clientsCount} klient</Badge>
                    </div>
                  </div>
                  <span className="shrink-0 text-white/70">{Icon.chevron({ size: 20 })}</span>
                </div>
              </Card>
            </button>
          </AnimatedItem>
        ))}

        {worksIn > 0 && (
          <AnimatedItem className="mb-2.5">
            <button
              onClick={() => onPick(WORKER_CONTEXT)}
              className="block w-full text-left active:opacity-85"
            >
              <Card className="flex items-center gap-3.5">
                <span className="grid size-[52px] shrink-0 place-items-center rounded-[19px] bg-sunk text-brand">
                  {Icon.check({ size: 22, strokeWidth: 2.4 })}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[16px] font-bold tracking-[-0.02em]">
                    O&apos;z ishlarim
                  </div>
                  <div className="text-[12.5px] text-muted">
                    {worksIn} ta jamoada ishchi sifatida
                  </div>
                </div>
                <span className="shrink-0 text-faint">{Icon.chevron({ size: 20 })}</span>
              </Card>
            </button>
          </AnimatedItem>
        )}
      </AnimatedList>

      <div className="mt-4">
        <Button size="lg" variant="secondary" icon="plus" onClick={() => setCreateOpen(true)}>
          Yangi agentlik ochish
        </Button>
      </div>

      <Sheet open={createOpen} onClose={() => setCreateOpen(false)} title="Yangi agentlik">
        <CreateProduction embedded onDone={() => setCreateOpen(false)} />
      </Sheet>
    </div>
  );
}
