'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { haptic } from '@/lib/telegram';
import type { ProductionSearchResult } from '@/lib/types';
import { Avatar, Button, Card, EmptyState, ErrorBanner, Input, Row } from '@/components/ui';

/** Ishchi havolasiz kirganda: @username orqali qidiruv + ariza (TZ 4.3). */
export function FindProduction({ onDone }: { onDone?: () => void }) {
  const { refresh } = useAuth();
  const [q, setQ] = useState('');
  const [results, setResults] = useState<ProductionSearchResult[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState<string[]>([]);

  async function search() {
    const term = q.trim();
    if (!term) return;
    setSearching(true);
    setError(null);
    try {
      setResults(await api.get<ProductionSearchResult[]>(`/productions/search?q=${encodeURIComponent(term)}`));
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSearching(false);
    }
  }

  async function apply(id: string) {
    setError(null);
    try {
      await api.post(`/productions/${id}/join-request`);
      haptic('success');
      setSentTo((prev) => [...prev, id]);
      await refresh();
      onDone?.();
    } catch (err) {
      haptic('error');
      setError((err as Error).message);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && void search()}
          placeholder="Agentlik nomi yoki @username"
        />
        <Button onClick={search} loading={searching}>
          Qidirish
        </Button>
      </div>

      {error && <ErrorBanner message={error} />}

      {results && results.length === 0 && (
        <EmptyState icon="🔍" title="Hech narsa topilmadi" description="@username'ni tekshirib qayta urinib ko'ring." />
      )}

      <div className="space-y-2">
        {results?.map((p) => (
          <Card key={p.id}>
            <Row
              left={
                <div className="flex items-center gap-3">
                  <Avatar name={p.name} photoUrl={p.photoUrl} />
                  <div className="min-w-0">
                    <div className="truncate text-[16px] font-semibold">{p.name}</div>
                    <div className="truncate text-[13px] text-tg-hint">
                      @{p.username} · {p.membersCount} a&apos;zo
                    </div>
                  </div>
                </div>
              }
              right={
                sentTo.includes(p.id) ? (
                  <span className="text-[13px] text-ok">Yuborildi ✓</span>
                ) : (
                  <Button size="sm" onClick={() => apply(p.id)}>
                    Ariza
                  </Button>
                )
              }
            />
          </Card>
        ))}
      </div>
    </div>
  );
}
