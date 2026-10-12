import enTexts from "./i18n/en.json";
import jaTexts from "./i18n/ja.json";
import koTexts from "./i18n/ko.json";
import zhTexts from "./i18n/zh.json";
import { exampleQuestionsByLanguage } from "./questions/catalog";

export type LanguageText = {
  sidebarTitle: string,
  greetingTitle: string,
  greetingDescription: string[],
  inputPlaceholder: string,
  languageLabel: string,
  autoLabel: string,
  loadingPreparingModels: string,
  loadingSwitchingModel: string,
  loadingModelDescription: string,
  statusConnecting: string,
  statusLoadingModels: string,
  statusPreparingPromptBundle: string,
};

export const DEFAULT_LANGUAGE = "en";
export const AVAILABLE_LANGUAGES = ["en", "ko", "ja", "zh"] as const;

export const example_questions_by_language = exampleQuestionsByLanguage;

export const language_labels: Record<string, string> = {
  en: "English",
  ko: "\uD55C\uAD6D\uC5B4",
  ja: "\u65E5\u672C\u8A9E",
  zh: "\u4E2D\u6587",
};

export const language_texts: Record<string, LanguageText> = {
  en: enTexts,
  ko: koTexts,
  ja: jaTexts,
  zh: zhTexts,
};

export function getLanguageTexts(language: string): LanguageText {
  return language_texts[language] ?? language_texts[DEFAULT_LANGUAGE];
}

export const INACTIVITY_TIMEOUT_MS = 2 * 60 * 1000;

export type PromptBundle = {
  system_prompt: string,
};

export async function loadPromptBundle(language: string): Promise<PromptBundle> {
  const locale = AVAILABLE_LANGUAGES.includes(language as typeof AVAILABLE_LANGUAGES[number])
    ? language
    : DEFAULT_LANGUAGE;

  const systemPrompt = await fetch(`/prompt-bundles/${locale}/system.txt`).then((response) => response.text());

  return {
    system_prompt: systemPrompt.trim(),
  };
}
