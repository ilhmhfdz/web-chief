import { cookies } from 'next/headers';
import type { NextRequest } from 'next/server';

/**
 * Centralized token extractor.
 *
 * Standardizes how the JWT token is retrieved from cookies,
 * eliminating manual string-split parsing that is error-prone
 * when cookie values contain '=' (e.g. base64 data).
 *
 * Usage in Route Handlers (App Router):
 *   const token = getTokenFromCookies(); // uses next/headers
 *
 * Usage in Middleware or handlers that receive NextRequest:
 *   const token = getTokenFromRequest(req);
 */

/**
 * Reads the token from the Next.js cookie store (server-side, App Router).
 * Use this inside Route Handlers that do NOT receive a NextRequest argument.
 */
export function getTokenFromCookies(): string | undefined {
  return cookies().get('token')?.value;
}

/**
 * Reads the token from a NextRequest object.
 * Use this inside Route Handlers that receive `req: NextRequest` from the signature.
 */
export function getTokenFromRequest(req: NextRequest): string | undefined {
  return req.cookies.get('token')?.value;
}
