// Centralized validation utilities

export const PRODUCT_NAME_REGEX = /^[A-Za-z0-9_-]+$/;

export function validateProductName(name: string): string | null {
  const trimmed = (name ?? '').trim();
  if (!trimmed) return 'Product name is required';
  if (/\s/.test(trimmed)) return 'No spaces allowed. Use underscore, hyphen, or camelCase.';
  if (!PRODUCT_NAME_REGEX.test(trimmed)) return 'Only letters, numbers, underscore (_) and hyphen (-) allowed.';
  if (trimmed.length < 2 || trimmed.length > 60) return 'Length must be 2–60 characters.';
  return null;
}

export function normalizeSlug(input: string): string {
  return (input || '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^A-Za-z0-9_-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$|_/g, (m) => (m === '_' ? '_' : ''))
    .toLowerCase();
}