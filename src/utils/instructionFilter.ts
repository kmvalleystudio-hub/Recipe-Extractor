const COOKING_VERB =
  /\b(roast|cook|blend|mix|simmer|baste|serve|heat|bake|fry|marinate|reduce|pour|brush|toss|boil|grill|season|combine|add|place|transfer|chop|slice|dice|mince|whisk|stir|preheat|air\s*fry|coat|garnish|strain|deglaze)\b/i;

const JUNK =
  /^(ingredients?|marinade|sauce|glaze)\s*:?\s*$|tefal|easier din for me|thanks to my|check this out|looking for a new|legit one of my fave|kasi ang dali|ang sarap/i;

function looksLikeIngredientLine(text: string): boolean {
  if (COOKING_VERB.test(text)) return false;
  return /^(\d+[\d/.\s-]*(\s*(cup|cups|tsp|tbsp|cloves?|stalks?|small|medium|large))?|\d+\s+[a-z])/i.test(
    text
  );
}

export function isValidCookingStep(text: string): boolean {
  const t = text.trim();
  if (!t || /^step\s*\d+$/i.test(t)) return false;
  if (JUNK.test(t)) return false;
  if (looksLikeIngredientLine(t)) return false;
  if (COOKING_VERB.test(t)) return true;
  return /\d+\s*(deg|°|mins?|minutes?)\b/i.test(t) && /\b(at|for|until|before|after)\b/i.test(t);
}
