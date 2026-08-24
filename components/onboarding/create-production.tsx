'use client';

import { useRef, useState } from 'react';
import { api, assetUrl } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { haptic } from '@/lib/telegram';
import type { ProductionDto } from '@/lib/types';
import { Avatar, Button, ErrorBanner, Field, Icon, Input, LogoMark } from '@/components/ui';
import { AnimatePresence, motion, softSpring, spring, stepVariants } from '@/components/ui/motion';

type Step = 0 | 1;

/** Prodakshn yaratish — qadamli master (TZ 4.1). */
export function CreateProduction() {
  const { refresh, demo, logout } = useAuth();
  const [step, setStep] = useState<Step>(0);
  const dir = useRef(1);

  function goStep(next: Step) {
    dir.current = next > step ? 1 : -1;
    setStep(next);
  }
  const [name, setName] = useState('');
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onPhoto(file: File) {
    setUploading(true);
    setError(null);
    try {
      const { url } = await api.upload(file);
      setPhotoUrl(url);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setUploading(false);
    }
  }

  async function submit() {
    setSaving(true);
    setError(null);
    try {
      // @username agentlik nomidan avtomatik hosil qilinadi
      await api.post<ProductionDto>('/productions', {
        name: name.trim(),
        photoUrl: photoUrl ?? undefined,
      });
      haptic('success');
      await refresh();
    } catch (err) {
      haptic('error');
      setError((err as Error).message);
      setStep(0);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto min-h-dvh max-w-lg px-4 pb-32 pt-8">
      {/* Qadam indikatori */}
      <div className="mb-7 flex items-center gap-2.5">
        <LogoMark size={30} />
        <div className="flex flex-1 gap-1.5">
          {[0, 1].map((i) => (
            <div key={i} className="h-1.5 flex-1 overflow-hidden rounded-full bg-sunk">
              <motion.div
                className="ember h-full rounded-full"
                initial={false}
                animate={{ scaleX: i <= step ? 1 : 0 }}
                style={{ originX: 0 }}
                transition={spring}
              />
            </div>
          ))}
        </div>
        <span className="nums text-[12px] font-bold text-faint">{step + 1}/2</span>
      </div>

      <AnimatePresence mode="wait" custom={dir.current} initial={false}>
        <motion.div
          key={step}
          custom={dir.current}
          variants={stepVariants}
          initial="enter"
          animate="center"
          exit="exit"
        >
          {step === 0 && (
            <>
              <h1 className="text-[27px] font-extrabold leading-tight tracking-[-0.04em]">
                Agentligingiz nomi
              </h1>
              <p className="mt-2 text-[14.5px] leading-relaxed text-muted">
                Jamoangiz va klientlar ko&apos;radigan nom.
              </p>
              <div className="mt-7">
                <Field label="Nomi">
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Masalan: Sunrise Studio"
                    maxLength={64}
                    autoFocus
                  />
                </Field>
              </div>
            </>
          )}

          {step === 1 && (
            <>
              <h1 className="text-[27px] font-extrabold leading-tight tracking-[-0.04em]">
                Agentlik logosi
              </h1>
              <p className="mt-2 text-[14.5px] leading-relaxed text-muted">
                Ixtiyoriy — keyinroq ham qo&apos;shsa bo&apos;ladi.
              </p>

              <motion.div
                className="mt-9 flex flex-col items-center gap-4"
                initial={{ scale: 0.92, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={softSpring}
              >
                <div className="relative">
                  <div className="absolute -inset-3 rounded-[36px] bg-brand/12 blur-2xl" />
                  {photoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={assetUrl(photoUrl)!}
                      alt=""
                      className="relative h-28 w-28 rounded-[34px] object-cover"
                    />
                  ) : (
                    <span className="relative block">
                      <Avatar name={name || 'P'} size={112} />
                    </span>
                  )}
                </div>

                <label className="hairline inline-flex cursor-pointer items-center gap-2 rounded-2xl bg-surface px-4 py-2.5 text-[14.5px] font-semibold active:bg-sunk">
                  {Icon.plus({ size: 16 })}
                  {uploading ? 'Yuklanmoqda…' : photoUrl ? 'Rasmni almashtirish' : 'Rasm tanlash'}
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) void onPhoto(f);
                    }}
                  />
                </label>
              </motion.div>

              {/* Tekshiruv kartasi — brend ohangida */}
              <div className="ember relative mt-9 overflow-hidden rounded-[22px] p-4 text-white shadow-glow">
                <LogoMark
                  size={130}
                  rounded={false}
                  className="pointer-events-none absolute -bottom-7 -right-5 text-white/[0.08]"
                />
                <div className="relative">
                  <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-white/70">
                    Tekshiring
                  </div>
                  <div className="mt-1.5 text-[19px] font-extrabold tracking-[-0.03em]">{name}</div>
                  <div className="mt-1 text-[12.5px] text-white/70">
                    Ishchilar sizni shu nom bo&apos;yicha qidirib topadi.
                  </div>
                </div>
              </div>
            </>
          )}
        </motion.div>
      </AnimatePresence>

      <AnimatePresence>
        {error && (
          <div className="mt-4">
            <ErrorBanner message={error} />
          </div>
        )}
      </AnimatePresence>

      {demo && (
        <button
          onClick={logout}
          className="mt-6 w-full text-center text-[13px] font-medium text-faint active:opacity-60"
        >
          Boshqa akkaunt bilan kirish
        </button>
      )}

      <div className="fixed inset-x-0 bottom-0 glass border-t border-line p-4 pb-[calc(env(safe-area-inset-bottom)+16px)]">
        <div className="mx-auto flex max-w-lg gap-2">
          {step > 0 && (
            <Button variant="secondary" size="lg" onClick={() => goStep((step - 1) as Step)}>
              Orqaga
            </Button>
          )}
          {step < 1 ? (
            <Button size="lg" disabled={name.trim().length < 2} onClick={() => goStep(1)}>
              Keyingisi
            </Button>
          ) : (
            <Button size="lg" loading={saving} onClick={submit}>
              Agentlikni yaratish
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
