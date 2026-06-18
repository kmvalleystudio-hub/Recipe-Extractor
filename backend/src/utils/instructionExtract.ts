/** True when instruction text is empty or a generic placeholder */
export function isPlaceholderInstruction(text: string): boolean {
  const t = text.trim();
  if (!t) return true;
  return /^step\s*\d+$/i.test(t);
}

const COOKING_VERB =
  /\b(roast|cook|blend|mix|simmer|baste|serve|heat|bake|fry|marinate|reduce|pour|brush|toss|boil|grill|season|combine|add|place|transfer|chop|slice|dice|mince|whisk|stir|preheat|air\s*fry|coat|garnish|strain|deglaze|breading|rest|cool)\b/i;

const JUNK_INSTRUCTION =
  /^(ingredients?|marinade|sauce|glaze|dressing|for the)\s*:?\s*$/i;

const PROMO_OR_DIALOG =
  /\b(tefal|air\s*fryer|appliance\s*philippines|check this out|looking for a new|thanks to my|easier din for me|i'?m really loving|if you'?re looking)\b/i;

const CASUAL_DIALOG =
  /\b(legit one of my fave|kasi ang dali|ang sarap sarap|sarap pa|😭|🥰|❤️)\b/i;

/** Section headers, promos, ingredient lines — not cooking steps */
export function isJunkInstruction(text: string): boolean {
  const t = text.trim();
  if (t.length < 10) return true;
  if (JUNK_INSTRUCTION.test(t)) return true;
  if (PROMO_OR_DIALOG.test(t)) return true;
  if (CASUAL_DIALOG.test(t)) return true;
  if (/^#\w+/.test(t)) return true;
  if (looksLikeIngredientLine(t)) return true;
  // Promo praise without any cooking action
  if (!COOKING_VERB.test(t) && /\b(recipe|fave|love|easy|thanks)\b/i.test(t)) return true;
  return false;
}

/** Ingredient list item — quantity + name, no cooking verb */
function looksLikeIngredientLine(text: string): boolean {
  if (COOKING_VERB.test(text)) return false;
  if (/^(juice of|pinch of|dash of)/i.test(text)) return true;
  return /^(\d+[\d/.\s-]*(\s*(cup|cups|tsp|tbsp|oz|lb|g|ml|cloves?|stalks?|small|medium|large))?|\d+\s+[a-z])/i.test(
    text
  );
}

/** A real cooking step — action verb or explicit time/temp with action */
export function isValidCookingStep(text: string): boolean {
  const t = text.trim();
  if (isPlaceholderInstruction(t) || isJunkInstruction(t)) return false;
  if (COOKING_VERB.test(t)) return true;
  const hasTimeOrTemp = /\d+\s*(deg|°|mins?|minutes?|hours?|hrs?)\b/i.test(t);
  return hasTimeOrTemp && /\b(at|for|until|before|after)\b/i.test(t);
}

/** Pull instruction text from AI output that may use alternate JSON keys */
export function extractInstructionText(raw: Record<string, unknown>): string {
  const keys = [
    'instruction',
    'instructions',
    'step',
    'text',
    'direction',
    'content',
    'description',
    'details',
    'value',
  ];

  for (const key of keys) {
    const val = raw[key];
    if (typeof val === 'string') {
      const trimmed = val.trim();
      if (trimmed && !isPlaceholderInstruction(trimmed)) return trimmed;
    }
  }

  return '';
}

/** Extract cooking steps from a Facebook/social post caption when AI returns none */
export function extractInstructionsFromCaption(text: string): string[] {
  if (!text.trim()) return [];

  const steps: string[] = [];

  for (const match of text.matchAll(/\[([^\]]{12,})\]/g)) {
    const step = match[1].trim();
    if (isValidCookingStep(step)) steps.push(step);
  }

  for (const line of text.split(/\n/)) {
    let trimmed = line.trim();
    if (trimmed.length < 12) continue;

    trimmed = trimmed.replace(/^[\d]+[.)]\s*/, '').replace(/^[-*•]\s*/, '');

    if (isValidCookingStep(trimmed)) {
      steps.push(trimmed);
    }
  }

  return [...new Set(steps)];
}
