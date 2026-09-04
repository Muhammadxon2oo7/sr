'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { money, formatFullDate } from '@/lib/format';
import { haptic } from '@/lib/telegram';
import type { ClientDto, ExpensesResponse } from '@/lib/types';
import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorBanner,
  Field,
  Icon,
  Input,
  NumberInput,
  Row,
  Sheet,
  Skeleton,
  Stat,
  cx,
} from '@/components/ui';
import { AnimatedItem, AnimatedList, AnimatePresence } from '@/components/ui/motion';

/**
 * Harajatlar — menejerning sarflari: summa va qisqacha izoh.
 *
 * To'lovlardan ataylab ajratilgan bo'lim. To'lov har doim kimgadir
 * (klient yoki ishchi) bog'langan, harajat esa shunchaki chiqim:
 * benzin, ijara, texnika. Moliyada foydadan chiqariladi — aks holda
 * foyda haqiqatdan katta ko'rinardi.
 */
export function ExpensesSheet({
  productionId,
  open,
  onClose,
}: {
  productionId: string;
  open: boolean;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const [amount, setAmount] = useState<number | undefined>(undefined);
  const [note, setNote] = useState('');
  const [clientId, setClientId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['expenses', productionId],
    queryFn: () => api.get<ExpensesResponse>(`/productions/${productionId}/expenses`),
    enabled: open,
  });

  // Sarf aniq bir klient uchun bo'lishi mumkin (o'sha suratga olishga
  // transport) yoki jamoaning umumiy chiqimi (ijara, texnika).
  const { data: clients } = useQuery({
    queryKey: ['clients', productionId],
    queryFn: () => api.get<ClientDto[]>(`/productions/${productionId}/clients`),
    enabled: open,
  });
  const activeClients = (clients ?? []).filter((c) => !c.archived);

  function invalidate() {
    void qc.invalidateQueries({ queryKey: ['expenses', productionId] });
    void qc.invalidateQueries({ queryKey: ['finance', productionId] });
    void qc.invalidateQueries({ queryKey: ['dashboard', productionId] });
  }

  const add = useMutation({
    mutationFn: () =>
      api.post(`/productions/${productionId}/expenses`, {
        amount,
        note: note.trim(),
        clientId,
      }),
    onSuccess: () => {
      haptic('success');
      setAmount(undefined);
      setNote('');
      setClientId(null);
      setError(null);
      invalidate();
    },
    onError: (err) => {
      haptic('error');
      setError((err as Error).message);
    },
  });

  const remove = useMutation({
    mutationFn: (id: string) => api.del(`/expenses/${id}`),
    onSuccess: () => {
      haptic('success');
      invalidate();
    },
    onError: (err) => setError((err as Error).message),
  });

  const canAdd = (amount ?? 0) > 0 && note.trim().length > 0;

  return (
    <Sheet open={open} onClose={onClose} title="Harajatlar">
      <div className="space-y-4">
        <AnimatePresence>{error && <ErrorBanner message={error} />}</AnimatePresence>

        {data && (
          <div className="grid grid-cols-2 gap-2">
            <Stat icon="wallet" label="Shu oyda" value={data.month} format={money} tone="warn" />
            <Stat icon="clock" label="Jami" value={data.total} format={money} />
          </div>
        )}

        {/* ── Yangi harajat ─────────────────────────────────── */}
        <Card className="space-y-3">
          <div className="eyebrow">Yangi harajat</div>
          <div className="flex gap-2">
            <div className="min-w-0 flex-1">
              <Field label="Summa">
                <NumberInput
                  value={amount}
                  onValueChange={setAmount}
                  decimal
                  placeholder="0"
                  inputMode="decimal"
                />
              </Field>
            </div>
          </div>
          <Field label="Nimaga" hint="Qisqacha — keyin o'zingiz eslay olishingiz uchun">
            <Input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Masalan: kameraga karta"
              maxLength={200}
            />
          </Field>

          {activeClients.length > 0 && (
            <Field
              label="Kim uchun"
              hint="Aniq klient uchun sarflangan bo'lsa tanlang"
            >
              <div className="flex flex-wrap gap-1.5">
                <Chip active={clientId === null} onClick={() => setClientId(null)}>
                  Jamoa (umumiy)
                </Chip>
                {activeClients.map((c) => (
                  <Chip
                    key={c.id}
                    active={clientId === c.id}
                    onClick={() => setClientId(clientId === c.id ? null : c.id)}
                  >
                    {c.name}
                  </Chip>
                ))}
              </div>
            </Field>
          )}
          <Button
            size="lg"
            icon="plus"
            disabled={!canAdd}
            loading={add.isPending}
            onClick={() => {
              setError(null);
              add.mutate();
            }}
          >
            Qo&apos;shish
          </Button>
        </Card>

        {/* ── Ro'yxat ───────────────────────────────────────── */}
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-16" />
            <Skeleton className="h-16" />
          </div>
        ) : !data || data.items.length === 0 ? (
          <EmptyState
            icon="wallet"
            title="Harajat yo'q"
            description="Sarflagan pulingizni shu yerda yozib boring — foyda hisobidan avtomatik chiqariladi."
          />
        ) : (
          <AnimatedList className="space-y-2">
            {data.items.map((e) => (
              <AnimatedItem key={e.id} className="mb-2">
                <Card>
                  <Row
                    left={
                      <div className="min-w-0">
                        <div className="truncate text-[15px] font-bold tracking-[-0.02em]">
                          {e.note}
                        </div>
                        <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
                          <span className="truncate text-[12px] text-muted">
                            {formatFullDate(e.spentAt)}
                            {e.author && ` · ${e.author.name}`}
                          </span>
                          <Badge tone={e.clientName ? 'brand' : 'neutral'}>
                            {e.clientName ?? 'umumiy'}
                          </Badge>
                        </div>
                      </div>
                    }
                    right={
                      <div className="flex items-center gap-2.5">
                        <span className="nums font-extrabold text-danger">−{money(e.amount)}</span>
                        {e.canEdit && (
                          <button
                            aria-label="O'chirish"
                            onClick={() => {
                              setError(null);
                              remove.mutate(e.id);
                            }}
                            className="shrink-0 text-faint active:opacity-60"
                          >
                            {Icon.close({ size: 17 })}
                          </button>
                        )}
                      </div>
                    }
                  />
                </Card>
              </AnimatedItem>
            ))}
          </AnimatedList>
        )}
      </div>
    </Sheet>
  );
}

/** Kichik tanlov tugmasi — klient biriktirish uchun. */
function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cx(
        'max-w-full truncate rounded-full px-3 py-1.5 text-[12.5px] font-semibold transition-colors',
        active ? 'ember text-white' : 'hairline bg-surface text-muted active:bg-sunk',
      )}
    >
      {children}
    </button>
  );
}
