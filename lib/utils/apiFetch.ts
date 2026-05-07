// ============================================================
// API Utility — Type-safe fetch wrapper for internal API routes
// ============================================================

type FetchOptions = RequestInit & {
  /** Skip throwing on non-OK responses; returns null instead */
  nullable?: boolean;
};

/**
 * A thin wrapper around `fetch` that:
 * - Parses JSON automatically
 * - Throws a typed error on non-2xx responses
 * - Accepts generic type parameter for type-safe responses
 */
export async function apiFetch<T>(
  path: string,
  options: FetchOptions = {}
): Promise<T> {
  const { nullable, ...fetchOptions } = options;

  const res = await fetch(path, {
    headers: { 'Content-Type': 'application/json' },
    ...fetchOptions,
  });

  if (!res.ok) {
    if (nullable) return null as T;
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Request failed: ${res.status}`);
  }

  return res.json() as Promise<T>;
}
