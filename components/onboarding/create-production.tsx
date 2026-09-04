'use client';

import { useRef, useState } from 'react';
import { api, assetUrl } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { haptic } from '@/lib/telegram';
import type { ProductionDto } from '@/lib/types';
import {
  Avatar,
  Button,
  EmberWatermark,
  ErrorBanner,
  Field,
  Icon,
  Input,
  LogoMark,
} from '@/components/ui';
import { AnimatePresence, motion, softSpring, spring, stepVariants } from '@/components/ui/motion';
import { RoleChangeSheet } from '@/components/account/role-change-sheet';
import { AccountDeleteSheet } from '@/components/account/danger-zone';

type Step = 0 | 1;

/**
 * Prodakshn yaratish — qadamli master (TZ 4.1).
 *
 * `embedded` — panel ichida (Sheet) ochilganda: to'liq ekran chetlari,
 * pastdagi qotirilgan panel va "boshqa rolga o'tish" chiqish yo'llari
 * kerak emas, chunki foydalanuvchi bu yerga o'z ixtiyori bilan kelgan
 * va panelni yopib chiqib keta oladi.
 */
export function CreateProduction({
  embedded = false,
  onDone,
}: {
  embedded?: boolean;
  onDone?: () => void;
} = {}) {
  const { refresh, me } = useAuth();
  const [step, setStep] = useState<Step>(0);
  const [roleOpen, setRoleOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
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
      onDone?.();
    } catch (err) {
      haptic('error');
      setError((err as Error).message);
      setStep(0);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className={
        embedded ? 'pb-2' : 'mx-auto min-h-dvh max-w-lg px-4 pb-32 pt-8'
      }
    >
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
              <h1 className="display text-[26px] font-bold leading-tight">Agentligingiz nomi</h1>
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
              <h1 className="display text-[26px] font-bold leading-tight">Agentlik logosi</h1>
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
              <div className="ember relative mt-8 overflow-hidden rounded-[20px] p-4 text-white shadow-glow">
                <EmberWatermark size={116} position="-right-6 -top-8" />
                <div className="ember-scrim pointer-events-none absolute inset-0" />
                <div className="relative">
                  <div className="text-[10.5px] font-bold uppercase tracking-[0.13em] text-white/75">
                    Tekshiring
                  </div>
                  <div className="display mt-1.5 text-[19px] font-extrabold">{name}</div>
                  <div className="mt-1 text-[12.5px] text-white/75">
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

      {/*
        Chiqish yo'li. Menejer prodakshnini o'chirgach shu ekranga
        tushadi va profilga o'ta olmaydi — rolni o'zgartirish uchun
        yagona yo'l shu yerda bo'lishi kerak, aks holda "yarat →
        o'chir → yarat" tsikliga qamalib qoladi.
      */}
      {!embedded && me?.roleChange.canChange && (
        <div className="mt-8 flex flex-col items-center gap-3">
          <button
            onClick={() => setRoleOpen(true)}
            className="text-[13px] font-semibold text-brand active:opacity-60"
          >
            Menejer emasmisiz? Boshqa rolga o&apos;tish
          </button>
          <button
            onClick={() => setDeleteOpen(true)}
            className="text-[12.5px] font-medium text-faint active:opacity-60"
          >
            Hisobni o&apos;chirish
          </button>
        </div>
      )}

      <RoleChangeSheet open={roleOpen} onClose={() => setRoleOpen(false)} />
      <AccountDeleteSheet open={deleteOpen} onClose={() => setDeleteOpen(false)} />

      <div
        className={
          embedded
            ? 'mt-6'
            : 'fixed inset-x-0 bottom-0 glass border-t border-line p-4 pb-[calc(env(safe-area-inset-bottom)+16px)]'
        }
      >
        <div className={embedded ? 'flex gap-2' : 'mx-auto flex max-w-lg gap-2'}>
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
