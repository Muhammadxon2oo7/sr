'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { confirmDialog, haptic } from '@/lib/telegram';
import { money } from '@/lib/format';
import type { ClientDto } from '@/lib/types';
import {
  Button,
  ErrorBanner,
  Field,
  Input,
  Sheet,
  Skeleton,
  cx,
} from '@/components/ui';
import { AddWorkerSheet } from './add-worker-sheet';

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

            <div className="space-y-3.5">
              <MoneyRow label="Kelishilgan summa" value={money(client.totalAmount)} />
              <MoneyRow label="Klientdan tushgan" value={money(client.receivedAmount)} />
              <MoneyRow label="To'lanmagan" value={money(client.remainingFromClient)} />
              <MoneyRow label="Chiqim" value={money(expense)} />
              <MoneyRow
                label="Foyda"
                value={money(profit)}
                tone={profit >= 0 ? 'ok' : 'danger'}
              />
            </div>

            <Button size="lg" variant="secondary" onClick={() => setIncomeOpen(true)}>
              Klientdan to&apos;lov qayd etish
            </Button>

            <div className="flex justify-between gap-3 pt-1 text-[13px]">
              <button
                className="text-tg-link active:opacity-60"
                onClick={() => setAddWorkerOpen(true)}
              >
                Ishchi biriktirish
              </button>
              <button className="text-tg-link active:opacity-60" onClick={() => setEditOpen(true)}>
                Tahrirlash
              </button>
              <button
                className="text-danger active:opacity-60"
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
              </button>
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
    <div className="flex items-center justify-between gap-3">
      <span className="text-[15px] text-tg-hint">{label}</span>
      <span
        className={cx(
          'shrink-0 text-[24px] font-bold tabular-nums',
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
          <Input
            type="number"
            inputMode="decimal"
            min={0}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
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
          <Input
            type="number"
            inputMode="decimal"
            min={0}
            value={total}
            onChange={(e) => setTotal(e.target.value)}
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
