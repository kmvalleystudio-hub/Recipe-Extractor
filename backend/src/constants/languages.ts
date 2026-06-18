/** ISO 639-1 codes accepted by the extract-recipe API */
export const SUPPORTED_LANGUAGE_CODES = [
  'en',
  'es',
  'fr',
  'de',
  'it',
  'pt',
  'ja',
  'ko',
  'zh',
  'tl',
  'ar',
  'hi',
] as const;

export type SupportedLanguageCode = (typeof SUPPORTED_LANGUAGE_CODES)[number];

export const DEFAULT_LANGUAGE: SupportedLanguageCode = 'en';

export const LANGUAGE_LABELS: Record<SupportedLanguageCode, string> = {
  en: 'English',
  es: 'Spanish',
  fr: 'French',
  de: 'German',
  it: 'Italian',
  pt: 'Portuguese',
  ja: 'Japanese',
  ko: 'Korean',
  zh: 'Chinese',
  tl: 'Tagalog / Filipino',
  ar: 'Arabic',
  hi: 'Hindi',
};

export function getLanguageLabel(code: string): string {
  return LANGUAGE_LABELS[code as SupportedLanguageCode] ?? code;
}
