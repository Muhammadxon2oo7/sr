'use client';

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth';
import { confirmDialog, haptic } from '@/lib/telegram';
import { Button, Card, Section } from '@/components/ui';
import { IconLogout, IconRefresh } from '@/components/ui/icons';

/**
 * Demo rejimdagi boshqaruv: akkauntni almashtirish va ma'lumotni boshlang'ich holatga qaytarish.
 * Haqiqiy backend bilan ishlaganda bu blok ko'rinmaydi.
 */
export function DemoControls() {
  const { demo, logout } = useAuth();
  const qc = useQueryClient();
  const [resetting, setResetting] = useState(false);

  if (!demo) return null;

  return (
    <Section title="Demo rejim">
      <Card className="space-y-3">
        <p className="text-[13px] text-fg-muted">
          Bu demo versiya — barcha o&apos;zgarishlar faqat shu brauzerda saqlanadi. Server yo&apos;q.
        </p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="flex-1"
            icon={<IconRefresh size={16} />}
            loading={resetting}
            onClick={async () => {
              if (!(await confirmDialog('Demo ma\'lumotlar boshlang\'ich holatga qaytarilsinmi?')))
                return;
              setResetting(true);
              const { resetDb } = await import('@/lib/mock/store');
              resetDb();
              haptic('success');
              await qc.invalidateQueries();
              setResetting(false);
              window.location.reload();
            }}
          >
            Ma&apos;lumotni tiklash
          </Button>
          <Button
            variant="danger"
            className="flex-1"
            icon={<IconLogout size={16} />}
            onClick={() => {
              haptic('light');
              logout();
            }}
          >
            Chiqish
          </Button>
        </div>
      </Card>
    </Section>
  );
}
