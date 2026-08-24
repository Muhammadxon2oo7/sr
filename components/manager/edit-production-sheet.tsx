'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { api, assetUrl } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { haptic } from '@/lib/telegram';
import type { ProductionDto } from '@/lib/types';
import { Avatar, Button, ErrorBanner, Field, Input, Sheet } from '@/components/ui';
import { AnimatePresence } from '@/components/ui/motion';

/** Agentlik nomi va logosini tahrirlash. */
export function EditProductionSheet({
  production,
  open,
  onClose,
}: {
  production: ProductionDto;
  open: boolean;
  onClose: () => void;
}) {
  const { refresh } = useAuth();
  const [name, setName] = useState(production.name);
  const [photoUrl, setPhotoUrl] = useState<string | null>(production.photoUrl);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = useMutation({
    mutationFn: () =>
      api.patch<ProductionDto>(`/productions/${production.id}`, {
        name: name.trim(),
        photoUrl: photoUrl ?? '',
      }),
    onSuccess: async () => {
      haptic('success');
      setError(null);
      await refresh();
      onClose();
    },
    onError: (err) => {
      haptic('error');
      setError((err as Error).message);
    },
  });

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

  return (
    <Sheet open={open} onClose={onClose} title="Agentlikni tahrirlash">
      <div className="space-y-4">
        <div className="flex flex-col items-center gap-3">
          {photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={assetUrl(photoUrl)!} alt="" className="h-24 w-24 rounded-[30px] object-cover" />
          ) : (
            <Avatar name={name || production.name} size={96} />
          )}

          <div className="flex gap-2">
            <label className="hairline cursor-pointer rounded-2xl bg-surface px-4 py-2.5 text-[14px] font-semibold active:bg-sunk">
              {uploading ? 'Yuklanmoqda…' : photoUrl ? 'Almashtirish' : 'Rasm tanlash'}
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
            {photoUrl && (
              <button
                className="rounded-2xl bg-danger/10 px-4 py-2.5 text-[14px] font-semibold text-danger active:opacity-70"
                onClick={() => setPhotoUrl(null)}
              >
                O&apos;chirish
              </button>
            )}
          </div>
        </div>

        <Field label="Agentlik nomi">
          <Input value={name} onChange={(e) => setName(e.target.value)} maxLength={64} />
        </Field>

        <Field label="@username" hint="Nomdan avtomatik hosil qilingan, o'zgartirib bo'lmaydi.">
          <Input value={`@${production.username}`} disabled readOnly />
        </Field>

        <AnimatePresence>{error && <ErrorBanner message={error} />}</AnimatePresence>

        <Button
          size="lg"
          disabled={name.trim().length < 2}
          loading={save.isPending}
          onClick={() => save.mutate()}
        >
          Saqlash
        </Button>
      </div>
    </Sheet>
  );
}
