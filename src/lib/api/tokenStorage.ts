/**
 * Access-token storage for the custom Icaro API.
 *
 * Security note: browsers have no place to put a token that JS can read
 * but that XSS can't also read. localStorage is the pragmatic choice for
 * a plain REST API like this one (no server-set cookies involved). If
 * you ever control the API too, the stronger pattern is to have the
 * server set an httpOnly, Secure, SameSite=strict cookie instead — that
 * keeps the token out of reach of any injected script entirely. Until
 * then, this module at least centralizes access so it's easy to swap
 * the storage strategy later without touching call sites.
 */

const TOKEN_KEY = 'icaro_access_token';

export function getAccessToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    // localStorage can throw in private-browsing/blocked-storage contexts
    return null;
  }
}

export function setAccessToken(token: string): void {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch {
    // ignore — worst case the user has to log in again next request
  }
}

export function clearAccessToken(): void {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {
    // ignore
  }
}

export function hasAccessToken(): boolean {
  return getAccessToken() !== null;
}
