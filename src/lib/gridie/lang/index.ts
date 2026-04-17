// src/gridie/lang/index.ts

import { es } from './es';
import { en } from './en';
import type { LanguageES } from './es';
import type { LanguageEN } from './en';

export type Language = 'es' | 'en';
export type LanguageStrings = LanguageES | LanguageEN;

export const languages: Record<Language, LanguageStrings> = {
  es,
  en
};

export function getLanguage(lang: Language): LanguageStrings {
  return languages[lang] || languages.es;
}