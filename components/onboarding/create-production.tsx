'use client';

import { useRef, useState } from 'react';
import { api, assetUrl } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { haptic } from '@/lib/telegram';
import type { ProductionDto } from '@/lib/types';
import { Avatar, Button, ErrorBanner, Field, Input, cx } from '@/components/ui';
import { AnimatePresence, motion, spring, stepVariants } from '@/components/ui/motion';

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
    <div className="mx-auto min-h-dvh max-w-lg px-4 pb-28 pt-8">
      <div className="mb-6 flex gap-1.5">
        {[0, 1].map((i) => (
          <div key={i} className="h-1 flex-1 overflow-hidden rounded-full bg-tg-separator">
            <motion.div
              className="h-full rounded-full bg-tg-button"
              initial={false}
              animate={{ scaleX: i <= step ? 1 : 0 }}
              style={{ originX: 0 }}
              transition={spring}
            />
          </div>
        ))}
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
          <h1 className="text-[26px] font-bold leading-tight">Agentligingiz nomi</h1>
          <p className="mt-2 text-[15px] text-tg-hint">Jamoangiz va klientlar ko&apos;radigan nom.</p>
          <div className="mt-6">
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
          <h1 className="text-[26px] font-bold leading-tight">Agentlik logosi</h1>
          <p className="mt-2 text-[15px] text-tg-hint">Ixtiyoriy — keyinroq ham qo&apos;shsa bo&apos;ladi.</p>

          <motion.div
            className="mt-8 flex flex-col items-center gap-4"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={spring}
          >
            {photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={assetUrl(photoUrl)!}
                alt=""
                className="h-28 w-28 rounded-3xl object-cover"
              />
            ) : (
              <Avatar name={name || 'P'} size={112} />
            )}

            <label className="cursor-pointer rounded-xl bg-tg-secondary px-4 py-2.5 text-[15px] font-medium active:opacity-70">
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

          <div className="mt-8 rounded-2xl bg-tg-section p-4">
            <div className="text-[13px] font-semibold uppercase tracking-wide text-tg-hint">
              Tekshiring
            </div>
            <div className="mt-2 text-[17px] font-semibold">{name}</div>
            <div className="text-[13px] text-tg-hint">
              Ishchilar sizni shu nom bo&apos;yicha qidirib topadi.
            </div>
          </div>
        </>
      )}

        </motion.div>
      </AnimatePresence>

      <AnimatePresence>
        {error && <div className="mt-4"><ErrorBanner message={error} /></div>}
      </AnimatePresence>

      {demo && (
        <button
          onClick={logout}
          className="mt-6 w-full text-center text-[13px] text-tg-hint active:opacity-60"
        >
          Boshqa akkaunt bilan kirish
        </button>
      )}

      <div className="fixed inset-x-0 bottom-0 border-t border-tg-separator bg-tg-bg/90 backdrop-blur-xl p-4 pb-[calc(env(safe-area-inset-bottom)+16px)]">
        <div className="mx-auto flex max-w-lg gap-2">
          {step > 0 && (
            <Button variant="secondary" size="lg" onClick={() => goStep((step - 1) as Step)}>
              Orqaga
            </Button>
          )}
          {step < 1 ? (
            <Button
              size="lg"
              disabled={name.trim().length < 2}
              onClick={() => goStep(1)}
            >
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
