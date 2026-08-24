import type { Metadata, Viewport } from 'next';
import Script from 'next/script';
import { Manrope, Space_Grotesk } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';

/*
  Shrift juftligi logoning xarakteridan kelib chiqqan:

  Space Grotesk — burchakli, biroz "kesilgan" harflar, tor apertura.
  Logodagi qirqilgan "P" bilan bir tildan gapiradi. Faqat sarlavha va
  yirik raqamlarda — shunda u xarakter beradi, lekin charchatmaydi.

  Manrope — geometrik, ochiq va yumaloq; mayda o'lchamda ham tiniq.
  Barcha matn, tugma va ro'yxatlar shunda — o'qish qulayligi birinchi.
*/
const manrope = Manrope({
  subsets: ['latin', 'cyrillic'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-manrope',
  display: 'swap',
});

const grotesk = Space_Grotesk({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--font-grotesk',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Prodakshn — Studio OS',
  description: 'Prodakshn-studiyalar uchun klient, jamoa va moliya boshqaruvi',
  appleWebApp: { capable: true, statusBarStyle: 'black-translucent', title: 'Prodakshn' },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f7f4f1' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0908' },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="uz" className={`${manrope.variable} ${grotesk.variable}`}>
      <head>
        <Script src="https://telegram.org/js/telegram-web-app.js" strategy="beforeInteractive" />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
