'use client';

import { useState } from 'react';
import type { ManagedProduction } from '@/lib/types';
import { useAuth } from '@/lib/auth';
import { haptic } from '@/lib/telegram';
import { Avatar, Badge, Card, EmberWatermark, Icon, Section, Sheet } from '@/components/ui';
import { AnimatedItem, AnimatedList, motion } from '@/components/ui/motion';
import { CreateProduction } from '@/components/onboarding/create-production';

/**
 * "Biznesim" — shaxsiy profildagi bo'lim.
 *
 * Foydalanuvchi avvalo o'z kasbi bilan ishlaydi. Agentlik ochish —
 * ixtiyoriy qadam; ochilgach u shu yerda karta bo'lib turadi va ustiga
 * bosilsa alohida akkauntga kirgandek bo'ladi (jamoa, klientlar,
 * moliya — hammasi o'sha agentlikniki).
 */
export function BusinessSection({
  managed,
  onEnter,
}: {
  managed: ManagedProduction[];
  onEnter: (productionId: string) => void;
}) {
  const { me } = useAuth();
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <Section
      title="Biznesim"
      action={
        managed.length > 0 ? (
          <button
            onClick={() => setCreateOpen(true)}
            className="text-[12.5px] font-bold text-brand active:opacity-60"
          >
            + Yangi
          </button>
        ) : undefined
      }
    >
      {managed.length === 0 ? (
        <button
          onClick={() => {
            haptic('light');
            setCreateOpen(true);
          }}
          className="block w-full text-left active:opacity-85"
        >
          <Card tone="flat" className="flex items-center gap-3.5">
            <span className="grid size-[46px] shrink-0 place-items-center rounded-[17px] bg-brand/10 text-brand">
              {Icon.plus({ size: 20, strokeWidth: 2.6 })}
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-[15px] font-bold tracking-[-0.02em]">
                Prodakshn yaratish
              </div>
              <div className="mt-0.5 text-[12.5px] leading-snug text-muted">
                O&apos;z agentligingizni oching — jamoa yig&apos;ing, klient
                oling, ishlarni taqsimlang.
              </div>
            </div>
            <span className="shrink-0 text-faint">{Icon.chevron({ size: 18 })}</span>
          </Card>
        </button>
      ) : (
        <AnimatedList className="space-y-2">
          {managed.map((m) => (
            <AnimatedItem key={m.production.id} className="mb-2">
              <motion.button
                whileTap={{ scale: 0.985 }}
                onClick={() => {
                  haptic('light');
                  onEnter(m.production.id);
                }}
                className="block w-full text-left"
              >
                <Card tone="ember" className="!p-3.5">
                  <EmberWatermark size={118} position="-right-7 -top-8" />
                  <div className="ember-scrim pointer-events-none absolute inset-0" />
                  <div className="relative flex items-center gap-3">
                    <span className="rounded-[17px] bg-white/20 p-[3px] ring-1 ring-white/30 backdrop-blur-md">
                      <Avatar
                        name={m.production.name}
                        photoUrl={m.production.photoUrl}
                        size={44}
                      />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="display truncate text-[16.5px] font-extrabold text-white">
                        {m.production.name}
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-1.5">
                        <Badge tone="onEmber" icon="spark">
                          {m.isOwner ? 'Egasi' : 'Menejer'}
                        </Badge>
                        <Badge tone="onEmber">{m.clientsCount} klient</Badge>
                      </div>
                    </div>
                    <span className="shrink-0 text-white/75">
                      {Icon.chevron({ size: 19 })}
                    </span>
                  </div>
                </Card>
              </motion.button>
            </AnimatedItem>
          ))}
        </AnimatedList>
      )}

      {managed.length > 0 && (
        <p className="mt-2 px-1 text-[12px] leading-relaxed text-faint">
          Kartaga bosilsa agentlik hisobiga o&apos;tasiz. U yerda jamoa,
          klientlar va moliya bo&apos;ladi; {me?.user.roleLabel ?? 'kasbingiz'}{' '}
          hisobingiz o&apos;z joyida qoladi.
        </p>
      )}

      <Sheet open={createOpen} onClose={() => setCreateOpen(false)} title="Yangi agentlik">
        <CreateProduction embedded onDone={() => setCreateOpen(false)} />
      </Sheet>
    </Section>
  );
}
