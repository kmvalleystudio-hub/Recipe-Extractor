/** Backend copy — keep in sync with src/utils/ingredientDedupe.ts */

const LEADING_AMOUNT_RE =
  /^(\d+(?:\.\d+)?(?:\s*\/\s*\d+)?)\s*([a-zA-Z(%]+(?:\(\s*s\s*\))?[^\s,]*)?\s*,?\s*/;

const TIME_UNIT_RE = /\b(?:hours?|hrs?|hr|minutes?|mins?|min|seconds?|secs?|sec)\b/i;
const VOLUME_UNIT_RE = /\b(?:tbsp|tsp|cup|cups|g|kg|lb|lbs?|oz|ml|l|clove|cloves|piece|pieces)\b/i;

/** True when text is only a duration (marinate/cook time), not a food quantity */
export function isTimeDurationPhrase(text: string): boolean {
  const t = stripNotIndicatedMarkers(text).trim();
  if (!t || !TIME_UNIT_RE.test(t)) return false;
  if (VOLUME_UNIT_RE.test(t)) return false;
  return /^(?:at least\s+)?\d+(?:\.\d+)?(?:\s*-\s*\d+(?:\.\d+)?)?\s*(?:hours?|hrs?|hr|minutes?|mins?|min|seconds?|secs?|sec)\b/i.test(
    t
  );
}

/** Strip marinate/cook durations wrongly prefixed to ingredient names ("1 hour soy sauce") */
export function stripLeadingTimeDuration(text: string): string {
  return text
    .replace(
      /^(?:at least\s+)?\d+(?:\.\d+)?(?:\s*-\s*\d+(?:\.\d+)?)?\s*(?:hours?|hrs?|hr|minutes?|mins?|min|seconds?|secs?|sec)\s+/i,
      ''
    )
    .trim();
}

/** Fix common speech-to-text food typos */
export function fixCommonIngredientTypos(text: string): string {
  return text
    .replace(/\bpapioka\b/gi, 'tapioca')
    .replace(/\bpaprioka\b/gi, 'tapioca')
    .replace(/\btapioka\b/gi, 'tapioca');
}

export function stripNotIndicatedMarkers(text: string): string {
  return text
    .replace(/\(\s*not indicated\s*\)/gi, '')
    .replace(/\[\s*not indicated\s*\]/gi, '')
    .replace(/\bnot indicated\b/gi, '')
    .replace(/\(\s*\)/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function normalizeMeasurePhrase(text: string): string {
  return stripNotIndicatedMarkers(text)
    .toLowerCase()
    .replace(/\bpounds?\b/g, 'lb')
    .replace(/\blbs?\b/g, 'lb')
    .replace(/\bounces?\b/g, 'oz')
    .replace(/\bgrams?\b/g, 'g')
    .replace(/\bkilograms?\b/g, 'kg')
    .replace(/\bclove\(s\)/g, 'cloves')
    .replace(/\bcloves?\b/g, 'clove')
    .replace(/\btablespoons?\b/g, 'tbsp')
    .replace(/\bteaspoons?\b/g, 'tsp')
    .replace(/[(),]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function extractLeadingAmount(text: string): string | null {
  const m = text.trim().match(LEADING_AMOUNT_RE);
  if (!m) return null;
  return m[2] ? `${m[1]} ${m[2].replace(/,\s*$/, '')}`.trim() : m[1].trim();
}

export function measuresEquivalent(a: string, b: string): boolean {
  const na = normalizeMeasurePhrase(a);
  const nb = normalizeMeasurePhrase(b);
  if (!na || !nb) return false;
  if (na === nb) return true;
  if (na.startsWith(nb) || nb.startsWith(na)) return true;

  const numUnit = (s: string) => {
    const m = s.match(/^(\d+(?:\.\d+)?(?:\s*\/\s*\d+)?)\s*(.*)$/);
    return m ? { num: m[1], unit: m[2].trim() } : null;
  };
  const pa = numUnit(na);
  const pb = numUnit(nb);
  if (pa && pb && pa.num === pb.num && pa.unit === pb.unit) return true;

  return false;
}

export function stripDuplicateLeadingAmount(amount: string, name: string): string {
  if (!amount.trim() || !name.trim()) return name.trim();

  const lead = extractLeadingAmount(name);
  if (lead && measuresEquivalent(amount, lead)) {
    return name.replace(LEADING_AMOUNT_RE, '').trim();
  }

  return name.trim();
}

export function mergeAmountParts(amount: string, unit: string): string {
  const a = stripNotIndicatedMarkers(amount);
  const u = stripNotIndicatedMarkers(unit);
  if (!a && !u) return '';
  if (!a) return u;
  if (!u) return a;
  if (measuresEquivalent(a, u)) return a;
  if (a.toLowerCase().includes(u.toLowerCase())) return a;
  if (u.toLowerCase().includes(a.toLowerCase())) return u;

  const measureRe =
    /\d+(?:\.\d+)?\s*(?:g|kg|lb|lbs?|oz|ml|l|cups?|tbsp|tsp|cloves?|clove\(s\)|pounds?|eggs?|pieces?)/i;
  if (measureRe.test(a) && measureRe.test(u)) return a;

  return `${a} ${u}`.trim();
}

export function dedupeIngredientLine(text: string): string {
  let result = stripNotIndicatedMarkers(text).replace(/\s+/g, ' ').trim();

  const words = result.split(' ');
  const out: string[] = [];
  for (const word of words) {
    const prev = out[out.length - 1];
    if (prev && prev.toLowerCase() === word.toLowerCase()) continue;
    out.push(word);
  }
  result = out.join(' ');

  const lead1 = extractLeadingAmount(result);
  if (lead1) {
    const rest = result.slice(lead1.length).trim();
    const lead2 = extractLeadingAmount(rest);
    if (lead2 && measuresEquivalent(lead1, lead2)) {
      result = `${lead1} ${rest.replace(LEADING_AMOUNT_RE, '').trim()}`.trim();
    }
  }

  const parts = result.split(' ');
  for (let len = Math.min(4, Math.floor(parts.length / 2)); len >= 1; len--) {
    const suffix = parts.slice(-len).join(' ').toLowerCase();
    const prefix = parts.slice(0, -len).join(' ').toLowerCase();
    if (prefix.includes(suffix)) {
      result = parts.slice(0, -len).join(' ');
      break;
    }
  }

  return result.trim();
}

/** Strip list bullet markers (-, •, *) from ingredient text */
export function stripBulletPrefix(text: string): string {
  return text.replace(/^[\s•*\-–—]+/, '').trim();
}

/** Split "2 tbsp butter, 1 tbsp garlic, 3 tbsp honey" into separate ingredient chunks */
export function splitCombinedIngredientText(text: string): string[] {
  const cleaned = stripBulletPrefix(text).trim();
  if (!cleaned) return [];

  const parts = cleaned.split(/,\s*(?=[-•*–—]?\s*\d)/).map((p) => stripBulletPrefix(p).trim());
  if (parts.length > 1) return parts.filter(Boolean);
  return [cleaned];
}

/** Move product name out of amount field ("2 tbsp Anchor butter" → amount + name) */
export function splitAmountAndName(amount: string, name: string): { amount: string; name: string } {
  let a = stripBulletPrefix(stripNotIndicatedMarkers(amount));
  let n = stripBulletPrefix(stripNotIndicatedMarkers(name));

  const amountLead = extractLeadingAmount(a);
  if (amountLead && a.length > amountLead.length + 2) {
    const rest = a.slice(amountLead.length).trim();
    if (rest && (!n || n.toLowerCase() === 'butter' || rest.length > n.length)) {
      return { amount: amountLead, name: rest };
    }
  }

  if (!a && n) {
    const fromName = extractLeadingAmount(n);
    if (fromName) {
      return {
        amount: fromName,
        name: n.slice(fromName.length).trim(),
      };
    }
  }

  return { amount: a, name: n };
}

export function normalizeIngredientText(text: string): string {
  return fixCommonIngredientTypos(stripLeadingTimeDuration(stripBulletPrefix(stripNotIndicatedMarkers(text))));
}
