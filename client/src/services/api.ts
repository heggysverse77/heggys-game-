const host = typeof window !== 'undefined' && window.location.hostname ? window.location.hostname : 'localhost';
const BASE_URL = import.meta.env.VITE_API_URL ?? `http://${host}:4000/api/v1`;

function getToken(): string | null {
  return localStorage.getItem('heggy_token');
}

interface ApiOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  body?: unknown;
  auth?: boolean;
}

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

export async function apiRequest<T>(
  path: string,
  { method = 'GET', body, auth = false }: ApiOptions = {}
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (auth) {
    const token = getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json();

  if (!res.ok) {
    throw new ApiError(res.status, data?.message ?? 'خطأ في الخادم');
  }

  return data as T;
}
