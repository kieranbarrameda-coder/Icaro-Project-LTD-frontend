/**
 * Decodes the payload of a JWT without verifying its signature.
 * Only use this for reading non-sensitive display claims (email, name,
 * role) client-side — never trust it for authorization decisions.
 * The backend must still enforce permissions on every request.
 */
export function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const [, payload] = token.split('.');
    if (!payload) return null;
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
    const json = atob(padded);
    return JSON.parse(json);
  } catch {
    return null;
  }
}
