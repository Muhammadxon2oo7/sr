'use client';

/**
 * Ikonka to'plami — bitta chizma tili:
 * 24px grid, 1.75 qalinlik, yumaloq uchlar, geometrik shakllar.
 * Emoji o'rniga shular ishlatiladi — ilova platformadan qat'i nazar
 * bir xil va professional ko'rinadi.
 */

type P = { size?: number; className?: string; strokeWidth?: number };

function Svg({
  size = 22,
  className,
  strokeWidth = 1.75,
  children,
}: P & { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

export const Icon = {
  home: (p: P) => (
    <Svg {...p}>
      <path d="M3.5 10.4 12 3.8l8.5 6.6" />
      <path d="M5.5 9.6V19a1.5 1.5 0 0 0 1.5 1.5h10a1.5 1.5 0 0 0 1.5-1.5V9.6" />
      <path d="M9.7 20.5v-5.3h4.6v5.3" />
    </Svg>
  ),
  team: (p: P) => (
    <Svg {...p}>
      <circle cx="9" cy="8.2" r="3.2" />
      <path d="M3.2 19.4c.5-3 3-5 5.8-5s5.3 2 5.8 5" />
      <path d="M16.2 5.4a3.2 3.2 0 0 1 0 6.1" />
      <path d="M17.4 14.8c2.1.5 3.6 2.2 4 4.6" />
    </Svg>
  ),
  clients: (p: P) => (
    <Svg {...p}>
      <rect x="2.8" y="7.2" width="18.4" height="13" rx="2.6" />
      <path d="M8.6 7.2V5.6A2 2 0 0 1 10.6 3.6h2.8a2 2 0 0 1 2 2v1.6" />
      <path d="M2.8 12.6c2.9 1.3 5.9 2 9.2 2s6.3-.7 9.2-2" />
    </Svg>
  ),
  user: (p: P) => (
    <Svg {...p}>
      <circle cx="12" cy="8" r="3.6" />
      <path d="M4.8 20.4c.8-3.6 3.6-5.8 7.2-5.8s6.4 2.2 7.2 5.8" />
    </Svg>
  ),
  plus: (p: P) => (
    <Svg {...p}>
      <path d="M12 5.5v13M5.5 12h13" />
    </Svg>
  ),
  chevron: (p: P) => (
    <Svg {...p}>
      <path d="M9.5 5.5 16 12l-6.5 6.5" />
    </Svg>
  ),
  clock: (p: P) => (
    <Svg {...p}>
      <circle cx="12" cy="12" r="8.6" />
      <path d="M12 7.4V12l3.1 2" />
    </Svg>
  ),
  bell: (p: P) => (
    <Svg {...p}>
      <path d="M6.3 10.2a5.7 5.7 0 0 1 11.4 0c0 4 1.3 5.4 1.9 6H4.4c.6-.6 1.9-2 1.9-6Z" />
      <path d="M10.2 19.4a2 2 0 0 0 3.6 0" />
    </Svg>
  ),
  check: (p: P) => (
    <Svg {...p}>
      <path d="M5 12.6 9.6 17 19 7.4" />
    </Svg>
  ),
  search: (p: P) => (
    <Svg {...p}>
      <circle cx="11" cy="11" r="6.6" />
      <path d="M15.9 15.9 20.5 20.5" />
    </Svg>
  ),
  info: (p: P) => (
    <Svg {...p}>
      <circle cx="12" cy="12" r="8.6" />
      <path d="M12 11v5.2M12 7.8h.01" />
    </Svg>
  ),
  calendar: (p: P) => (
    <Svg {...p}>
      <rect x="3.4" y="5.2" width="17.2" height="15.4" rx="2.6" />
      <path d="M3.4 10h17.2M8.4 3.4v3.4M15.6 3.4v3.4" />
    </Svg>
  ),
  spark: (p: P) => (
    <Svg {...p}>
      <path d="M12 3.2c.9 4.3 2.3 5.7 6.6 6.6-4.3.9-5.7 2.3-6.6 6.6-.9-4.3-2.3-5.7-6.6-6.6 4.3-.9 5.7-2.3 6.6-6.6Z" />
      <path d="M18.4 15.4c.4 1.9 1 2.5 2.9 2.9-1.9.4-2.5 1-2.9 2.9-.4-1.9-1-2.5-2.9-2.9 1.9-.4 2.5-1 2.9-2.9Z" />
    </Svg>
  ),
  close: (p: P) => (
    <Svg {...p}>
      <path d="M6.5 6.5 17.5 17.5M17.5 6.5 6.5 17.5" />
    </Svg>
  ),
  trend: (p: P) => (
    <Svg {...p}>
      <path d="M3.5 16.6 9 10.8l3.6 3.4 7.9-8.6" />
      <path d="M15.6 5.6h4.9v4.9" />
    </Svg>
  ),
  wallet: (p: P) => (
    <Svg {...p}>
      <rect x="3" y="6.2" width="18" height="13" rx="3" />
      <path d="M3 10.6h18" />
      <circle cx="16.6" cy="14.9" r="1.1" fill="currentColor" stroke="none" />
    </Svg>
  ),
  film: (p: P) => (
    <Svg {...p}>
      <rect x="3" y="4.6" width="18" height="14.8" rx="2.6" />
      <path d="M8 4.6v14.8M16 4.6v14.8M3 12h18M3 8.3h5M16 8.3h5M3 15.7h5M16 15.7h5" />
    </Svg>
  ),
  send: (p: P) => (
    <Svg {...p}>
      <path d="M20.6 3.9 3.6 10.4l6.6 2.6 2.6 6.6Z" />
      <path d="M10.2 13 20.6 3.9" />
    </Svg>
  ),
  warning: (p: P) => (
    <Svg {...p}>
      <path d="M12 4.2 21 19.6H3Z" />
      <path d="M12 10v4M12 16.9h.01" />
    </Svg>
  ),
  edit: (p: P) => (
    <Svg {...p}>
      <path d="M15.6 4.9 19.1 8.4 8.9 18.6 4.4 19.6l1-4.5Z" />
    </Svg>
  ),
  shield: (p: P) => (
    <Svg {...p}>
      <path d="M12 3.2 19.5 6v5.6c0 4-3 7.3-7.5 8.7-4.5-1.4-7.5-4.7-7.5-8.7V6Z" />
      <path d="M9.2 12.1 11.3 14l3.5-4" />
    </Svg>
  ),
  logout: (p: P) => (
    <Svg {...p}>
      <path d="M14.6 7.6V5.4a1.8 1.8 0 0 0-1.8-1.8H5.4a1.8 1.8 0 0 0-1.8 1.8v13.2a1.8 1.8 0 0 0 1.8 1.8h7.4a1.8 1.8 0 0 0 1.8-1.8v-2.2" />
      <path d="M9.4 12h11M17.2 8.6 20.6 12l-3.4 3.4" />
    </Svg>
  ),
};

export type IconName = keyof typeof Icon;
