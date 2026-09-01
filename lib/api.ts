'use client';

/**
 * API mijozi.
 *
 * Manzil build paytida `NEXT_PUBLIC_API_URL` dan olinadi. Lokal ishlab
 * chiqishda `.env.local` da boshqa manzil ko'rsatish mumkin.
 */
const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080/api';

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
  const token = getToken();

  let res: Response;
  try {
    res = await fetch(`${BASE}${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(init?.headers ?? {}),
      },
    });
  } catch {
    // Tarmoq uzilgan yoki server javob bermayapti — foydalanuvchiga
    // texnik xato emas, tushunarli sabab ko'rsatiladi.
    throw new ApiError('Serverga ulanib bo\'lmadi. Internetni tekshiring.', 0);
  }

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
    const token = getToken();
    const form = new FormData();
    form.append('file', file);

    const res = await fetch(`${BASE}/uploads`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      body: form,
    });
    if (!res.ok) {
      let message = 'Rasm yuklanmadi';
      try {
        const body = await res.json();
        message = body?.message ?? message;
      } catch {
        /* javob JSON emas */
      }
      throw new ApiError(message, res.status);
    }

    const data = (await res.json()) as { url: string };
    return { url: assetUrl(data.url) ?? data.url };
  },
};

/** Nisbiy `/static/...` manzillarni to'liq URL'ga aylantiradi. */
export function assetUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  if (url.startsWith('http') || url.startsWith('data:')) return url;
  return `${BASE.replace(/\/api$/, '')}${url}`;
}
