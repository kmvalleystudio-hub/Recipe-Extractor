/** ISO 639-1 codes for video language selection */
export interface LanguageOption {
  code: string;
  label: string;
}

export const VIDEO_LANGUAGES: LanguageOption[] = [
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Spanish' },
  { code: 'fr', label: 'French' },
  { code: 'de', label: 'German' },
  { code: 'it', label: 'Italian' },
  { code: 'pt', label: 'Portuguese' },
  { code: 'ja', label: 'Japanese' },
  { code: 'ko', label: 'Korean' },
  { code: 'zh', label: 'Chinese' },
  { code: 'tl', label: 'Tagalog / Filipino' },
  { code: 'ar', label: 'Arabic' },
  { code: 'hi', label: 'Hindi' },
];

export const DEFAULT_VIDEO_LANGUAGE = 'en';

export function getLanguageLabel(code: string): string {
  return VIDEO_LANGUAGES.find((l) => l.code === code)?.label ?? code;
}
