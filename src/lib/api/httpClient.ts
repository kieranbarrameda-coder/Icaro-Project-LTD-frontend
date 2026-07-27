import { API_BASE_URL } from './config';
import { getAccessToken, clearAccessToken } from './tokenStorage';
import { ApiError } from './authApi';

interface ApiFetchOptions extends Omit<RequestInit, 'body'> {
  body?: unknown; // pass a plain object/array and it's JSON-stringified for you
}

/**
 * fetch wrapper for authenticated calls to the custom Icaro API.
 * Attaches the stored access_token as a Bearer header automatically.
 * On a 401 it clears the stored token (it's no longer valid) so the
 * app can redirect back to login.
 */
export async function apiFetch<T = unknown>(
  path: string,
  options: ApiFetchOptions = {},
): Promise<T> {
  const token = getAccessToken();
  const { body, headers, ...rest } = options;

  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...rest,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (res.status === 401) {
    clearAccessToken();
    throw new ApiError('Session expired — please log in again', 401);
  }

  let data: unknown = null;
  try {
    data = await res.json();
  } catch {
    // some endpoints may return no body (e.g. 204)
  }

  if (!res.ok) {
    const message =
      (data && typeof data === 'object' && data !== null && 'message' in data
        ? String((data as { message: unknown }).message)
        : null) ?? `Request failed (${res.status})`;
    throw new ApiError(message, res.status);
  }

  return data as T;
}
