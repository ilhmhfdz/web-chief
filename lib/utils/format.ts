// ============================================================
// Format Utilities — Pure functions, no side effects
// ============================================================

/**
 * Formats a number as Indonesian Rupiah currency.
 * @example formatPrice(150000) → "Rp 150.000"
 */
export function formatPrice(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Truncates a string to the given max length, appending "..." if truncated.
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength).trimEnd()}...`;
}

/**
 * Converts a product name to a URL-friendly slug.
 */
export function toSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

/**
 * Builds a query string from an object, filtering out undefined/null/empty values.
 * @example buildQueryString({ page: 1, category: 'pomade' }) → "?page=1&category=pomade"
 */
export function buildQueryString(params: Record<string, string | number | undefined | null>): string {
  const entries = Object.entries(params).filter(
    ([, value]) => value !== undefined && value !== null && value !== '' && value !== 'all'
  );
  if (entries.length === 0) return '';
  const search = new URLSearchParams(
    entries.map(([key, val]) => [key, String(val)])
  );
  return `?${search.toString()}`;
}
