/**
 * Detect social/slang openers (common in PH Facebook Reels) that are not dish names.
 */
const SLANG_TITLE_RE =
  /^(gagi|grabe|hala|shet|shit|omg|wtf|yow|uy|potang|putang|tangina|tang ina|bwiset|hayop|loko|loka|char|charot|petmalu|nakakagutom|sarap|legit|huhu|hahaha|haha|wow|yum|yumm?y|the best|must try|so good|try this|watch this|pano|paano)\b/i;

const SLANG_PHRASE_RE =
  /\b(gagi|grabe|pwede din pala|ang atake+|nakakagutom|sobrang sarap|grabe sarap|sarap nito grabe|sarap na sarap|legit talaga|hindi ako makapaniwala|nito grabe)\b/i;

const CTA_TITLE_RE =
  /\b(comment\s+\w+|i\s+will\s+dm|will\s+dm\s+you|dm\s+me|dm\s+you|message\s+me|link\s+in\s+bio|follow\s+for|full\s+recipe\s+in|recipe\s+in\s+bio|tap\s+link|click\s+link|save\s+this|share\s+this|tag\s+a\s+friend|pro-tip|pro tip|meal\s+prep\s+tip)\b/i;

const HYPE_PREFIX_RE =
  /^(highly\s+requested|viral|trending|easy|best|ultimate|famous|popular|requested|everyone\s+loves|must\s+try|new\s+favorite|fail\s+proof|fail-proof)\s+/i;

const FOOD_WORD_RE =
  /\b(recipe|bake|baked|salad|chicken|liver|pork|beef|lamb|fish|salmon|tuna|shrimp|prawn|crab|egg|eggs|tokwa|tofu|sauce|fry|fried|grill|roast|style|mayo|sushi|maki|roll|noodles|rice|curry|steak|burger|sandwich|tacos|pancake|bread|cake|dessert|marinade|glaze|dip|spread|bowl|wrap|skewer|bbq|adobo|sinigang|menudo|pasta|spaghetti|meatball|wings|bacon|sausage|mushroom|potato|cheese|garlic|sisig|lumpia|pancit|lechon|caldereta|afritada|bulalo|tempura|teriyaki|ramen|pho|dimsum|dumpling|burrito|pesto|alfredo|carbonara|crispy|crisp|juicy|tender|breast|breasts|patty|patties|cutlet|cutlets|nugget|nuggets|strip|strips|fillet|fillets|meatball|meatballs|soup|stew|saute|stir|ginisang|inihaw|longganisa|tocino|tapa|katsu|gyoza|shawarma|kebab|biryani|laksa|rendang|satay|tikka|masala|hummus|falafel|pinakbet|kilawin|ginataan|palabok|miki|sotanghon|batchoy|lugaw|goto|champorado|puto|bibingka|suman|biko|escabeche|mechado|pochero|kare-kare|bagnet|daing|tuyo|laing|miso|udon|soba|bibimbap|kimchi|jambalaya|gumbo|chowder|frittata|brownie|cookie|tart|pudding|gelato|sorbet|wonton|bao|empanada|tamale|nachos|fajita|ceviche|goulash|schnitzel|crepe|waffle|churro|flan|tiramisu|macaron|eclair|crumble|cobbler|granola|oatmeal|congee|porridge|latte|espresso|mocha|matcha|boba|lemonade|salsa|sriracha|gochujang|broth|gravy|dressing|marinade|garnish|seasoning|herb|onion|shallot|scallion|bell\s+pepper|chili|paprika|sesame|nori|quinoa|couscous|tortilla|naan|pita|flatbread|sourdough|croissant|bagel|scone|biscuit|cornbread)\b/i;

const CLICKBAIT_PHRASE_RE =
  /\b(stop scrolling|don't scroll|do not scroll|changes everything|change everything|game changer|you won't believe|won't believe|must watch|watch till|watch until|before you|secret recipe|ultimate guide|best ever|easiest ever|viral recipe|viral hack|life changing|mind blowing|insane|crazy good|don't skip|do not skip|wait for it|keep watching|like and subscribe|follow for more|link in bio|full recipe in|comment recipe|dm for recipe)\b/i;

const EMOJI_RE =
  /[\u{1F300}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{FE00}-\u{FE0F}\u{1F1E6}-\u{1F1FF}]/gu;

const HASHTAG_RE = /#\w+/g;

function titleCase(phrase: string): string {
  const small = new Set(['and', 'or', 'with', 'in', 'on', 'at', 'the', 'a', 'an', 'of', 'for', 'to', '&']);
  return phrase
    .trim()
    .split(/\s+/)
    .map((w, i) => {
      if (w === '&') return '&';
      const lower = w.toLowerCase();
      if (i > 0 && small.has(lower)) return lower;
      return lower.length ? lower.charAt(0).toUpperCase() + lower.slice(1) : w;
    })
    .join(' ');
}

function removeEmoji(text: string): string {
  return text.replace(EMOJI_RE, ' ').replace(/\s+/g, ' ').trim();
}

function stripHashtags(text: string): string {
  return text.replace(HASHTAG_RE, ' ').replace(/\s+/g, ' ').trim();
}

function removeClickbaitAndHype(text: string): string {
  let s = text;
  const replacements: RegExp[] = [
    CLICKBAIT_PHRASE_RE,
    SLANG_PHRASE_RE,
    CTA_TITLE_RE,
    /\bsarap\s+nito\s+grabe\b/gi,
    /\bgrabe\s+sarap\b/gi,
    /\bnito\s+grabe\b/gi,
    /\bang\s+atake+\b/gi,
    /\blegit\s+(talaga|naman)?\b/gi,
    /\bsobrang\s+\w+\b/gi,
  ];

  for (const re of replacements) {
    s = s.replace(re, ' ');
  }

  return s.replace(/\s+/g, ' ').trim();
}

function stripRecipeSuffix(phrase: string): string {
  return phrase.replace(/\s+recipe\s*$/i, '').trim();
}

function stripHypePrefix(phrase: string): string {
  return phrase.replace(HYPE_PREFIX_RE, '').trim();
}

function hasClickbait(text: string): boolean {
  return CLICKBAIT_PHRASE_RE.test(text) || SLANG_PHRASE_RE.test(text) || CTA_TITLE_RE.test(text);
}

/** Engagement / CTA lines — never valid dish titles */
export function isEngagementOrCtaTitle(title: string): boolean {
  const lower = title.trim().toLowerCase();
  if (!lower) return true;
  if (CTA_TITLE_RE.test(lower)) return true;
  if (/^comment\b/i.test(lower)) return true;
  if (/\bdm\b/i.test(lower) && (/\bfull\b/i.test(lower) || /\brecipe\b/i.test(lower))) return true;
  if (/\bpage\s*:/i.test(lower)) return true;
  if (/\|\s*\w+\s*$/.test(title) && !FOOD_WORD_RE.test(lower)) return true;
  return false;
}

export function isSocialSlangTitle(title: string): boolean {
  const t = title.trim();
  if (!t || t.length < 3) return true;
  if (isEngagementOrCtaTitle(t)) return true;

  const lower = t.toLowerCase();

  if (SLANG_TITLE_RE.test(lower)) return true;
  if (SLANG_PHRASE_RE.test(lower)) return true;
  if (hasClickbait(lower)) return true;

  const wordCount = t.split(/\s+/).length;
  if (wordCount <= 5 && !FOOD_WORD_RE.test(lower)) {
    if (/[!?]{2,}|atake|pwede|pala|naman|talaga|pre|pare|mars|sis|lods/i.test(lower)) {
      return true;
    }
  }

  return false;
}

function isPlausibleDishName(dish: string): boolean {
  const t = dish.trim();
  if (t.length < 3 || t.length > 80) return false;
  if (isSocialSlangTitle(t)) return false;
  if (isEngagementOrCtaTitle(t)) return false;
  if (!FOOD_WORD_RE.test(t.toLowerCase())) return false;
  if (t.split(/\s+/).length > 12) return false;
  return true;
}

function finalizeDishName(phrase: string): string {
  let dish = stripRecipeSuffix(removeClickbaitAndHype(removeEmoji(stripHashtags(phrase))));
  dish = stripHypePrefix(dish);
  dish = dish.replace(/^this\s+/i, '').trim();
  dish = dish.replace(/\s*,\s*my\s+.*$/i, '').trim();
  dish = dish.replace(/\s*\|\s*.*$/, '').trim();
  dish = dish.replace(/\s+/g, ' ').trim();
  if (!dish) return '';
  return titleCase(dish);
}

function isCtaCaptionLine(line: string): boolean {
  const lower = line.toLowerCase();
  if (CTA_TITLE_RE.test(lower)) return true;
  if (/^comment\b/i.test(lower)) return true;
  if (/#\w/.test(line) && line.split('#').length > 2 && !FOOD_WORD_RE.test(lower.slice(0, 40))) return true;
  return false;
}

/**
 * Extract dish name from a caption line like:
 * "HIGHLY REQUESTED CRISPY & JUICY CHICKEN BREAST PATTIES, my grandmas fail proof recipe"
 */
function extractDishFromCaptionLine(line: string): string | null {
  let text = stripHashtags(removeEmoji(line)).trim();
  if (!text) return null;

  // Same line often mixes headline + "Comment X for full recipe" — keep headline only
  text = text.split(/\bcomment\s+[a-z0-9]+\s+and\b/i)[0]?.trim() ?? text;
  text = text.split(/\bi\s+will\s+dm\b/i)[0]?.trim() ?? text;
  text = text.split(/\bpro-tip\b/i)[0]?.trim() ?? text;
  text = text.replace(/\s*\|\s*[^|]+$/, '').trim();

  if (/^comment\b/i.test(text.trim())) return null;
  if (CTA_TITLE_RE.test(text.toLowerCase()) && !FOOD_WORD_RE.test(text.slice(0, 60))) return null;

  text = stripHypePrefix(text);

  // Take segment before comma or " my " when it looks like a dish headline
  const commaSplit = text.split(',')[0]?.trim() ?? text;
  const mySplit = commaSplit.split(/\bmy\s+(grandma|grandpa|mom|dad|fail)/i)[0]?.trim() ?? commaSplit;
  let candidate = mySplit.trim();

  if (candidate.length > 70) {
    const foodMatch = candidate.match(
      /\b((?:crispy|crisp|juicy|creamy|spicy|garlic|honey|butter|fried|baked|roasted|grilled)\s+[\w\s&'-]{3,50}?(?:patties|patty|breast|chicken|pork|beef|fish|steak|salad|curry|pasta|soup|stew|adobo|sinigang|sushi|bake|wings|nuggets|cutlets|sandwich|burger|taco|wrap|bowl|ramen|pho)\b[\w\s&'-]*)/i
    );
    if (foodMatch?.[1]) candidate = foodMatch[1].trim();
  }

  const dish = finalizeDishName(candidate);
  if (isPlausibleDishName(dish)) return dish;

  return null;
}

/** Scan full caption — prefer headline lines over CTA / "comment for recipe" lines */
export function extractDishNameFromCaptionBody(caption: string): string | null {
  const cleaned = stripHashtags(caption);
  const lines = cleaned
    .split(/\n+/)
    .map((l) => l.trim())
    .filter(Boolean);

  for (const line of lines) {
    const dish = extractDishFromCaptionLine(line);
    if (dish) return dish;
  }

  // Single-block captions (Facebook OG often one paragraph)
  const blocks = cleaned.split(/\s{2,}|(?:\!\s+)/).map((b) => b.trim()).filter(Boolean);
  for (const block of blocks) {
    if (isCtaCaptionLine(block)) continue;
    const dish = extractDishFromCaptionLine(block);
    if (dish) return dish;
  }

  return null;
}

/** Extract dish name from YouTube/social video titles with clickbait and PH hype */
export function extractDishNameFromVideoTitle(title: string): string | null {
  const raw = title.trim();
  if (!raw || isEngagementOrCtaTitle(raw)) return null;

  let text = removeClickbaitAndHype(removeEmoji(raw));
  text = text.replace(/\s+/g, ' ').trim();

  const thisRecipe = text.match(/\bthis\s+(.+?)\s+recipe\b/i);
  if (thisRecipe?.[1]) {
    const dish = finalizeDishName(thisRecipe[1]);
    if (isPlausibleDishName(dish)) return dish;
  }

  const recipeMatches = [...text.matchAll(/\b([\w][\w\s&'-]{1,55}?)\s+recipe\b/gi)];
  for (const match of recipeMatches) {
    const beforeRecipe = match[1].trim();
    if (isEngagementOrCtaTitle(beforeRecipe) || /\bcomment\b/i.test(beforeRecipe)) continue;
    const dish = finalizeDishName(beforeRecipe);
    if (isPlausibleDishName(dish)) return dish;
  }

  if (text.length <= 70 && FOOD_WORD_RE.test(text) && !hasClickbait(text)) {
    const dish = finalizeDishName(text);
    if (isPlausibleDishName(dish)) return dish;
  }

  const rawRecipe = raw.match(/\b([\w][\w\s&'-]{1,55}?)\s+recipe\b/i);
  if (rawRecipe?.[1] && !/\bcomment\b/i.test(rawRecipe[1])) {
    const dish = finalizeDishName(rawRecipe[1]);
    if (isPlausibleDishName(dish)) return dish;
  }

  return null;
}

/** Pull a real dish name from Filipino-style social captions */
export function extractDishNameFromCaption(caption: string): string | null {
  const fromBody = extractDishNameFromCaptionBody(caption);
  if (fromBody) return fromBody;

  const fromVideo = extractDishNameFromVideoTitle(caption);
  if (fromVideo) return fromVideo;

  const text = caption.trim();
  if (!text) return null;

  const atakeMatch = text.match(/([A-Za-z0-9][A-Za-z0-9\s&'/-]{1,55}?)\s+ang atake+/i);
  if (atakeMatch?.[1]) {
    const candidate = finalizeDishName(atakeMatch[1].trim());
    if (isPlausibleDishName(candidate)) return candidate;
  }

  const bakeMatch = text.match(/\b([a-z][a-z\s-]{0,20}\bbake)\b/i);
  if (bakeMatch?.[1]) return titleCase(bakeMatch[1]);

  const quoted = text.match(/["“]([^"”]{3,50})["”]/);
  if (quoted?.[1] && FOOD_WORD_RE.test(quoted[1])) return finalizeDishName(quoted[1]);

  return null;
}

export function extractDishNameFromDescription(description: string): string | null {
  const fromBody = extractDishNameFromCaptionBody(description);
  if (fromBody) return fromBody;

  const fromVideo = extractDishNameFromVideoTitle(description);
  if (fromVideo) return fromVideo;

  const d = description.trim();
  if (!d) return null;

  const bakeMatch = d.match(/\b([a-z][a-z\s-]{0,20}\bbake)\b/i);
  if (bakeMatch?.[1]) return titleCase(bakeMatch[1]);

  const dishMatch = d.match(
    /\b(chicken|pork|beef|fish|shrimp|tokwa|tofu|egg)\s+(\w+(?:\s+\w+){0,3})/i
  );
  if (dishMatch) {
    const dish = finalizeDishName(`${dishMatch[1]} ${dishMatch[2]}`);
    if (isPlausibleDishName(dish)) return dish;
  }

  return null;
}

/**
 * Always reduce to a clean dish name — not clickbait, slang, CTA, or "Recipe" suffix noise.
 */
export function sanitizeRecipeTitle(
  title: string,
  caption: string,
  description?: string,
  sourceVideoTitle?: string
): string {
  const fullCaption = [caption, description, sourceVideoTitle].filter(Boolean).join('\n\n');

  const candidates = [
    extractDishNameFromCaptionBody(fullCaption),
    extractDishNameFromCaption(caption),
    !isEngagementOrCtaTitle(title) ? extractDishNameFromVideoTitle(title) : null,
    sourceVideoTitle && !isEngagementOrCtaTitle(sourceVideoTitle)
      ? extractDishNameFromVideoTitle(sourceVideoTitle)
      : null,
    description ? extractDishNameFromDescription(description) : null,
  ].filter((c): c is string => Boolean(c));

  if (candidates.length > 0) {
    return candidates[0];
  }

  if (!isEngagementOrCtaTitle(title)) {
    const fallback = finalizeDishName(title);
    if (fallback && isPlausibleDishName(fallback)) return fallback;
  }

  return 'Extracted Recipe';
}

/** Short display title for Facebook OG — avoids CTA / slang lines */
export function extractRecipeTitleFromCaption(caption: string): string {
  const fromBody = extractDishNameFromCaptionBody(caption);
  if (fromBody) return fromBody;

  const fromDish = extractDishNameFromCaption(caption);
  if (fromDish) return fromDish;

  const fromVideo = extractDishNameFromVideoTitle(caption);
  if (fromVideo) return fromVideo;

  return 'Facebook video';
}
