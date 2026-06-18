/** Normalize AI usage text to a standard ingredient usage value */
export function normalizeIngredientUsage(raw: unknown): string {
  const s = String(raw ?? 'not indicated').trim().toLowerCase();
  if (!s || s === 'not indicated' || s === 'unknown' || s === 'n/a') return 'not indicated';
  if (s.includes('marin') && s.includes('cook')) return 'both';
  if (s.includes('marin')) return 'marination';
  if (s.includes('sauce') || s.includes('dip') || s.includes('glaze')) return 'sauce';
  if (s.includes('garnish')) return 'garnish';
  if (s.includes('cook') || s.includes('main') || s.includes('roast') || s.includes('fry')) {
    return 'cooking';
  }
  return 'not indicated';
}
