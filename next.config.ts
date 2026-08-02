import type { NextConfig } from 'next';

const config: NextConfig = {
  reactStrictMode: true,
  // Telegram WebView ichida ishlaydi — rasm optimizatsiyasi shart emas.
  images: { unoptimized: true },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          // Mini-app Telegram iframe ichida ochiladi.
          { key: 'X-Frame-Options', value: 'ALLOWALL' },
          {
            key: 'Content-Security-Policy',
            value: "frame-ancestors 'self' https://web.telegram.org https://*.telegram.org;",
          },
        ],
      },
    ];
  },
};

export default config;
