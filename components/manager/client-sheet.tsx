'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { confirmDialog, haptic } from '@/lib/telegram';
import { money } from '@/lib/format';
import type { ClientDto, TeamOption } from '@/lib/types';
import {
  Button,
  Card,
  ErrorBanner,
  Field,
  Input,
  LogoMark,
  NumberInput,
  Sheet,
  Skeleton,
  cx,
} from '@/components/ui';
import { AddWorkerSheet } from './add-worker-sheet';
import { useAuth } from '@/lib/auth';

/** Klient kartasi: asosiy moliyaviy ko'rsatkichlar (TZ 5.4.2). */
export function ClientSheet({
  clientId,
  productionId,
  onClose,
}: {
  clientId: string | null;
  productionId: string;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const [incomeOpen, setIncomeOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [addWorkerOpen, setAddWorkerOpen] = useState(false);
  const { me } = useAuth();

  const { data: client, isLoading } = useQuery({
    queryKey: ['client', clientId],
    queryFn: () => api.get<ClientDto>(`/clients/${clientId}`),
    enabled: Boolean(clientId),
  });

  function invalidate() {
    void qc.invalidateQueries({ queryKey: ['client', clientId] });
    void qc.invalidateQueries({ queryKey: ['clients', productionId] });
    void qc.invalidateQueries({ queryKey: ['dashboard', productionId] });
    void qc.invalidateQueries({ queryKey: ['team', productionId] });
    void qc.invalidateQueries({ queryKey: ['finance', productionId] });
  }

  const remove = useMutation({
    mutationFn: () => api.del(`/clients/${clientId}`),
    onSuccess: () => {
      haptic('success');
      invalidate();
      onClose();
    },
    onError: (err) => setError((err as Error).message),
  });

  /**
   * Klientni kimga biriktirish mumkinligi.
   *
   * Faqat ega uchun so'raladi: menejer klientni boshqa menejerga
   * o'tkaza olmaydi (o'ziniki bo'lmagan klientni umuman ko'rmaydi ham).
   */
  const isOwner = Boolean(
    me?.managed.find((m) => m.production.id === productionId)?.isOwner,
  );
  const { data: managers } = useQuery({
    queryKey: ['managers', productionId],
    queryFn: () => api.get<TeamOption[]>(`/productions/${productionId}/managers`),
    enabled: Boolean(clientId) && isOwner,
  });

  const assignManager = useMutation({
    mutationFn: (managerId: string | null) =>
      api.put(`/clients/${clientId}/manager`, { managerId }),
    onSuccess: () => {
      haptic('success');
      invalidate();
    },
    onError: (err) => setError((err as Error).message),
  });

  // Chiqim = jamoa ishlab topgan (berilishi kerak bo'lgan) summa
  const expense = client?.owedToTeam ?? 0;
  const profit = (client?.totalAmount ?? 0) - expense;

  return (
    <>
      <Sheet open={Boolean(clientId)} onClose={onClose} title={client?.name ?? 'Klient'}>
        {isLoading || !client ? (
          <div className="space-y-3">
            <Skeleton className="h-24" />
            <Skeleton className="h-32" />
          </div>
        ) : (
          <div className="space-y-5">
            {error && <ErrorBanner message={error} />}

            {/* Kalit ko'rsatkich — sof foyda */}
            <Card tone="ember" className="!p-4">
              <LogoMark
                size={140}
                rounded={false}
                className="pointer-events-none absolute -right-7 -top-6 text-white/[0.07]"
              />
              <div className="relative">
                <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-white/70">
                  Foyda
                </div>
                <div className="nums mt-1 text-[32px] font-extrabold leading-none text-white">
                  {money(profit)}
                </div>
                <div className="mt-3.5">
                  <div className="mb-1.5 flex items-baseline justify-between text-[11.5px] font-semibold text-white/70">
                    <span>Klientdan tushgan</span>
                    <span className="nums text-white">
                      {money(client.receivedAmount)} / {money(client.totalAmount)}
                    </span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-black/25">
                    <div
                      className="h-full rounded-full bg-white"
                      style={{
                        width: `${Math.min(
                          100,
                          client.totalAmount > 0
                            ? (client.receivedAmount / client.totalAmount) * 100
                            : 0,
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </Card>

            <div className="hairline divide-y divide-line overflow-hidden rounded-[20px] bg-surface">
              <MoneyRow label="Kelishilgan summa" value={money(client.totalAmount)} />
              <MoneyRow label="Klientdan tushgan" value={money(client.receivedAmount)} tone="ok" />
              <MoneyRow label="To'lanmagan" value={money(client.remainingFromClient)} />
              <MoneyRow label="Jamoa chiqimi" value={money(expense)} />
            </div>

            <Button size="lg" icon="wallet" onClick={() => setIncomeOpen(true)}>
              Klientdan to&apos;lov qayd etish
            </Button>

            {/* ── Mas'ul menejer ──────────────────────────── */}
            {isOwner && managers && managers.length > 1 && (
              <Card tone="flat" className="space-y-2.5">
                <div className="eyebrow">Mas&apos;ul menejer</div>
                <p className="text-[12.5px] leading-relaxed text-muted">
                  Biriktirilgan menejer shu klient bo&apos;yicha jamoaga ish
                  taqsimlay oladi va uning moliyasini ko&apos;radi.
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {managers.map((mgr) => {
                    const active = client.managerId === mgr.userId;
                    return (
                      <button
                        key={mgr.userId}
                        disabled={assignManager.isPending}
                        onClick={() => assignManager.mutate(active ? null : mgr.userId)}
                        className={cx(
                          'rounded-full px-3 py-1.5 text-[12.5px] font-semibold transition-colors',
                          active
                            ? 'ember text-white'
                            : 'hairline bg-surface text-muted active:bg-sunk',
                        )}
                      >
                        {mgr.name}
                      </button>
                    );
                  })}
                </div>
              </Card>
            )}

            <div className="flex gap-2">
              <Button
                className="flex-1"
                variant="secondary"
                icon="plus"
                size="sm"
                onClick={() => setAddWorkerOpen(true)}
              >
                Ishchi
              </Button>
              <Button
                className="flex-1"
                variant="secondary"
                icon="edit"
                size="sm"
                onClick={() => setEditOpen(true)}
              >
                Tahrirlash
              </Button>
              <Button
                className="flex-1"
                variant="danger"
                icon="close"
                size="sm"
                onClick={async () => {
                  if (
                    !(await confirmDialog(
                      `"${client.name}" o'chirilsinmi? Barcha ma'lumotlar yo'qoladi.`,
                    ))
                  )
                    return;
                  remove.mutate();
                }}
              >
                O&apos;chirish
              </Button>
            </div>
          </div>
        )}
      </Sheet>

      <IncomeSheet
        clientId={clientId}
        remaining={client?.remainingFromClient ?? 0}
        open={incomeOpen}
        onClose={() => setIncomeOpen(false)}
        onDone={() => {
          setIncomeOpen(false);
          invalidate();
        }}
      />

      {client && (
        <AddWorkerSheet
          client={client}
          productionId={productionId}
          open={addWorkerOpen}
          onClose={() => setAddWorkerOpen(false)}
        />
      )}

      {client && (
        <EditClientSheet
          client={client}
          open={editOpen}
          onClose={() => setEditOpen(false)}
          onDone={() => {
            setEditOpen(false);
            invalidate();
          }}
        />
      )}
    </>
  );
}

function MoneyRow({
  label,
  value,
  tone = 'default',
}: {
  label: string;
  value: string;
  tone?: 'default' | 'ok' | 'danger';
}) {
  return (
    <div className="flex items-center justify-between gap-3 px-4 py-3">
      <span className="text-[13.5px] font-medium text-muted">{label}</span>
      <span
        className={cx(
          'nums shrink-0 text-[16px] font-extrabold',
          tone === 'ok' && 'text-ok',
          tone === 'danger' && 'text-danger',
        )}
      >
        {value}
      </span>
    </div>
  );
}

// ── Klientdan tushum ──────────────────────────────────────────

function IncomeSheet({
  clientId,
  remaining,
  open,
  onClose,
  onDone,
}: {
  clientId: string | null;
  remaining: number;
  open: boolean;
  onClose: () => void;
  onDone: () => void;
}) {
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);

  const save = useMutation({
    mutationFn: () =>
      api.post(`/clients/${clientId}/payments`, {
        amount: Number(amount),
        note: note.trim() || undefined,
      }),
    onSuccess: () => {
      haptic('success');
      setAmount('');
      setNote('');
      setError(null);
      onDone();
    },
    onError: (err) => {
      haptic('error');
      setError((err as Error).message);
    },
  });

  return (
    <Sheet open={open} onClose={onClose} title="Klientdan tushgan pul">
      <div className="space-y-4">
        <Field label="Summa ($)" hint={`Kelishuv bo'yicha qolgan: ${money(remaining)}`}>
          <NumberInput
            decimal
            value={amount === '' ? undefined : Number(amount)}
            onValueChange={(v) => setAmount(v === undefined ? '' : String(v))}
            placeholder="0"
            autoFocus
          />
        </Field>
        <Field label="Izoh (ixtiyoriy)">
          <Input value={note} onChange={(e) => setNote(e.target.value)} maxLength={200} />
        </Field>

        {error && <ErrorBanner message={error} />}

        <Button
          size="lg"
          loading={save.isPending}
          disabled={!amount || Number(amount) <= 0}
          onClick={() => save.mutate()}
        >
          Saqlash
        </Button>
      </div>
    </Sheet>
  );
}

// ── Klientni tahrirlash ───────────────────────────────────────

function EditClientSheet({
  client,
  open,
  onClose,
  onDone,
}: {
  client: ClientDto;
  open: boolean;
  onClose: () => void;
  onDone: () => void;
}) {
  const [name, setName] = useState(client.name);
  const [total, setTotal] = useState(String(client.totalAmount));
  const [error, setError] = useState<string | null>(null);

  const save = useMutation({
    mutationFn: () =>
      api.patch(`/clients/${client.id}`, { name: name.trim(), totalAmount: Number(total) }),
    onSuccess: () => {
      haptic('success');
      onDone();
    },
    onError: (err) => setError((err as Error).message),
  });

  return (
    <Sheet open={open} onClose={onClose} title="Klientni tahrirlash">
      <div className="space-y-4">
        <Field label="Nomi">
          <Input value={name} onChange={(e) => setName(e.target.value)} maxLength={80} />
        </Field>
        <Field label="Umumiy summa ($)">
          <NumberInput
            decimal
            value={total === '' ? undefined : Number(total)}
            onValueChange={(v) => setTotal(v === undefined ? '' : String(v))}
          />
        </Field>
        {error && <ErrorBanner message={error} />}
        <Button size="lg" loading={save.isPending} onClick={() => save.mutate()}>
          Saqlash
        </Button>
      </div>
    </Sheet>
  );
}
