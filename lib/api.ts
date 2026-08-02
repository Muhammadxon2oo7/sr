'use client';

const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000/api';

/**
 * Demo rejim: backend yo'q, hamma narsa brauzerdagi localStorage'da ishlaydi.
 * Vercel'ga statik joylashtirish uchun `.env.production` da yoqilgan.
 */
export const DEMO = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';

let authToken: string | null = null;

export function setToken(token: string | null) {
  authToken = token;
  if (typeof window !== 'undefined') {
    if (token) sessionStorage.setItem('pb_token', token);
    else sessionStorage.removeItem('pb_token');
  }
}

export function getToken(): string | null {
  if (authToken) return authToken;
  if (typeof window !== 'undefined') authToken = sessionStorage.getItem('pb_token');
  return authToken;
}

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  if (DEMO) {
    const { mockRequest } = await import('./mock/api');
    const { MockError } = await import('./mock/store');
    try {
      return await mockRequest<T>(
        (init?.method as 'GET' | 'POST' | 'PATCH' | 'DELETE') ?? 'GET',
        path,
        init?.body ? JSON.parse(init.body as string) : undefined,
      );
    } catch (err) {
      if (err instanceof MockError) throw new ApiError(err.message, err.status);
      throw err;
    }
  }

  const token = getToken();
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers ?? {}),
    },
  });

  if (!res.ok) {
    let message = `Xatolik (${res.status})`;
    try {
      const body = await res.json();
      const raw = body?.message ?? body?.error;
      message = Array.isArray(raw) ? raw.join(', ') : (raw ?? message);
    } catch {
      /* javob JSON emas */
    }
    throw new ApiError(message, res.status);
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export const api = {
  get: <T,>(path: string) => request<T>(path),
  post: <T,>(path: string, body?: unknown) =>
    request<T>(path, { method: 'POST', body: body === undefined ? undefined : JSON.stringify(body) }),
  patch: <T,>(path: string, body?: unknown) =>
    request<T>(path, { method: 'PATCH', body: JSON.stringify(body ?? {}) }),
  del: <T,>(path: string) => request<T>(path, { method: 'DELETE' }),

  async upload(file: File): Promise<{ url: string }> {
    // Demo rejimda rasm data-URL sifatida localStorage'ga tushadi
    if (DEMO) {
      const url = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(new ApiError("Rasm o'qilmadi", 400));
        reader.readAsDataURL(file);
      });
      return { url };
    }

    const token = getToken();
    const form = new FormData();
    form.append('file', file);
    const res = await fetch(`${BASE}/uploads`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      body: form,
    });
    if (!res.ok) throw new ApiError('Rasm yuklanmadi', res.status);
    const data = (await res.json()) as { url: string };
    return { url: data.url.startsWith('http') ? data.url : `${BASE.replace(/\/api$/, '')}${data.url}` };
  },
};

/** Nisbiy `/static/...` manzillarni to'liq URL'ga aylantiradi. */
export function assetUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  if (url.startsWith('http') || url.startsWith('data:')) return url;
  return `${BASE.replace(/\/api$/, '')}${url}`;
}
