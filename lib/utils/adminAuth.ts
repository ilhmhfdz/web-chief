/**
 * Reads the authenticated user's payload injected by middleware.
 * Only available in API Route Handlers (server-side).
 *
 * Usage:
 *   const user = getUserFromHeaders(request.headers);
 */
export interface AuthPayload {
  userId: string;
  role: 'admin' | 'customer';
}

export function getUserFromHeaders(headers: Headers): AuthPayload | null {
  const raw = headers.get('x-user-payload');
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthPayload;
  } catch {
    return null;
  }
}
