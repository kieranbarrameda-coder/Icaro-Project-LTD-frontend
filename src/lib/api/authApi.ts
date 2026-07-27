import { API_BASE_URL } from './config';
import { setAccessToken, clearAccessToken } from './tokenStorage';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  [key: string]: unknown; // tolerate extra fields (refresh_token, user, etc.)
}

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

/**
 * POST /auth/login — logs in against the custom API and persists the
 * returned access_token via tokenStorage for use by apiFetch later.
 */
export async function login({ email, password }: LoginCredentials): Promise<LoginResponse> {
  const res = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  let data: unknown = null;
  try {
    data = await res.json();
  } catch {
    // no/invalid JSON body
  }

  if (!res.ok) {
    const message =
      (data && typeof data === 'object' && 'message' in data
        ? String((data as { message: unknown }).message)
        : null) ?? `Login failed (${res.status})`;
    throw new ApiError(message, res.status);
  }

  const parsed = data as LoginResponse;
  if (!parsed?.access_token) {
    throw new ApiError('Login response did not include an access_token', res.status);
  }

  setAccessToken(parsed.access_token);
  return parsed;
}

export function logout(): void {
  clearAccessToken();
}
