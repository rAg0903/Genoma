import { clearAuthSession, getAuthToken, notifyAuthChanged } from './auth-session';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

interface RequestOptions {
  method?: HttpMethod;
  body?: unknown;
  token?: string;
  headers?: Record<string, string>;
}

const handleSessionExpired = () => {
  if (typeof window === 'undefined') return;
  clearAuthSession();
  notifyAuthChanged();
  if (!window.location.pathname.startsWith('/login')) {
    window.location.assign('/login');
  }
};

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, token, headers = {} } = options;

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    cache: 'no-store',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const text = await response.text();
    let message = text;
    try {
      const parsed = JSON.parse(text);
      message = parsed?.error || parsed?.message || text;
    } catch {
      // resposta não-JSON; mantém o texto original
    }

    // Sessão expirada ou token inválido: terminar sessão e voltar ao login.
    if (response.status === 401) {
      handleSessionExpired();
      throw new Error('A sua sessão expirou. Inicie sessão novamente.');
    }

    if (response.status === 429) {
      const retryAfter = response.headers.get('retry-after');
      const waitHint = retryAfter ? ` Aguarde cerca de ${retryAfter}s.` : '';
      throw new Error(`Demasiados pedidos ao servidor.${waitHint} Reinicie o backend em desenvolvimento ou tente mais tarde.`);
    }

    throw new Error(message || `API request failed with status ${response.status}`);
  }

  // Some endpoints may return empty payloads.
  if (response.status === 204) {
    return null as T;
  }

  return response.json() as Promise<T>;
}

export async function apiUpload<T>(
  path: string,
  formData: FormData,
  options: { token?: string } = {},
): Promise<T> {
  const { token } = options;
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: formData,
  });

  if (!response.ok) {
    const text = await response.text();
    let message = text;
    try {
      const parsed = JSON.parse(text);
      message = parsed?.error || parsed?.message || text;
    } catch {
      // resposta não-JSON
    }

    if (response.status === 401) {
      handleSessionExpired();
      throw new Error('A sua sessão expirou. Inicie sessão novamente.');
    }

    throw new Error(message || `Upload failed with status ${response.status}`);
  }

  if (response.status === 204) {
    return null as T;
  }

  return response.json() as Promise<T>;
}

export async function downloadAnexoFile(anexoId: string, filename: string, token?: string) {
  const authToken = token ?? getAuthToken();
  const response = await fetch(`${API_BASE_URL}/anexos/files/${anexoId}`, {
    headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
  });

  if (!response.ok) {
    throw new Error('Não foi possível transferir o ficheiro.');
  }

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename || 'anexo';
  anchor.click();
  URL.revokeObjectURL(url);
}

export { API_BASE_URL };
