/** Parse bullet-style ingredient lines from Facebook post captions */

export interface ParsedCaptionIngredient {
  extractedAmount: string;
  name: string;
  usage: 'cooking' | 'marination' | 'sauce' | 'garnish';
}

const SECTION_HEADERS: { pattern: RegExp; usage: ParsedCaptionIngredient['usage'] }[] = [
  { pattern: /^ingredients?\s*:?\s*$/i, usage: 'cooking' },
  { pattern: /^marinade\s*:?\s*$/i, usage: 'marination' },
  { pattern: /^sauce\s*:?\s*$/i, usage: 'sauce' },
  { pattern: /^glaze\s*:?\s*$/i, usage: 'sauce' },
  { pattern: /^garnish\s*:?\s*$/i, usage: 'garnish' },
];

/** e.g. "3 pcs", "2 tbsp", "4-6 pcs", "0.5 tsp" */
const AMOUNT_PREFIX =
  /^(\d+(?:\.\d+)?(?:\s*-\s*\d+(?:\.\d+)?)?\s*(?:pcs?|pc|tbsp|tsp|cup|cups|g|kg|oz|lb|lbs?|ml|l|cloves?|pieces?|slices?)?)\s+(.+)$/i;

function stripBulletPrefix(line: string): string {
  return line.replace(/^[\s•*\-–—]+/, '').trim();
}

function parseIngredientLine(line: string, usage: ParsedCaptionIngredient['usage']): ParsedCaptionIngredient | null {
  const cleaned = stripBulletPrefix(line).trim();
  if (!cleaned || cleaned.length < 2) return null;

  const amountMatch = cleaned.match(AMOUNT_PREFIX);
  if (amountMatch) {
    return {
      extractedAmount: amountMatch[1].trim(),
      name: amountMatch[2].trim(),
      usage,
    };
  }

  return {
    extractedAmount: 'not indicated',
    name: cleaned,
    usage,
  };
}

function detectSectionHeader(line: string): ParsedCaptionIngredient['usage'] | null {
  const trimmed = line.trim();
  for (const { pattern, usage } of SECTION_HEADERS) {
    if (pattern.test(trimmed)) return usage;
  }
  return null;
}

/** True when caption contains a structured ingredient list (bullets + section or 3+ lines) */
export function captionHasIngredientList(caption: string): boolean {
  const lines = caption.split(/\n+/).map((l) => l.trim()).filter(Boolean);
  let bulletCount = 0;
  let hasSection = false;

  for (const line of lines) {
    if (detectSectionHeader(line)) hasSection = true;
    if (/^[\s•*\-–—]/.test(line) || AMOUNT_PREFIX.test(stripBulletPrefix(line))) {
      bulletCount++;
    }
  }

  return bulletCount >= 3 && (hasSection || bulletCount >= 4);
}

/** Parse Ingredients / Sauce / Marinade sections from a Facebook caption */
export function parseCaptionIngredients(caption: string): ParsedCaptionIngredient[] {
  const lines = caption.split(/\n+/).map((l) => l.trim()).filter(Boolean);
  let currentUsage: ParsedCaptionIngredient['usage'] = 'cooking';
  const results: ParsedCaptionIngredient[] = [];

  for (const line of lines) {
    const section = detectSectionHeader(line);
    if (section) {
      currentUsage = section;
      continue;
    }

    if (!/^[\s•*\-–—]/.test(line) && !AMOUNT_PREFIX.test(stripBulletPrefix(line))) {
      continue;
    }

    const parsed = parseIngredientLine(line, currentUsage);
    if (parsed) results.push(parsed);
  }

  return results;
}
