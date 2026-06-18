import type { ExtractedField } from '@/types/recipe';

/** Display value from an extracted field, or null if empty / not indicated */
export function formatMetaValue(field: ExtractedField | undefined): string | null {
  if (!field) return null;
  const value = (field.extracted || field.suggested || '').trim();
  if (!value || value.toLowerCase() === 'not indicated') return null;
  return value;
}
