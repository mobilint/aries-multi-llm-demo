import enQuestions from "./locales/en.json";
import jaQuestions from "./locales/ja.json";
import koQuestions from "./locales/ko.json";
import zhQuestions from "./locales/zh.json";

export type ExampleQuestions = Record<string, string[]>;

type QuestionKey = keyof typeof enQuestions;
type LocaleQuestionMap = Record<QuestionKey, string>;

const QUESTION_SETS_BY_LANGUAGE: Record<string, LocaleQuestionMap> = {
  en: enQuestions,
  ko: koQuestions,
  ja: jaQuestions,
  zh: zhQuestions,
};

const MODEL_GROUPS = {
  exaone: [
    "LGAI-EXAONE/EXAONE-3.5-2.4B-Instruct",
    "LGAI-EXAONE/EXAONE-3.5-7.8B-Instruct",
    "LGAI-EXAONE/EXAONE-4.0-1.2B",
    "LGAI-EXAONE/EXAONE-Deep-2.4B",
    "LGAI-EXAONE/EXAONE-Deep-7.8B",
    "naver-hyperclovax/HyperCLOVAX-SEED-Text-Instruct-0.5B",
    "naver-hyperclovax/HyperCLOVAX-SEED-Text-Instruct-1.5B",
    "meta-llama/Llama-3.2-1B-Instruct",
    "meta-llama/Llama-3.2-3B-Instruct",
    "meta-llama/Llama-3.1-8B-Instruct",
  ],
  qwen: [
    "Qwen/Qwen2.5-0.5B-Instruct",
    "Qwen/Qwen2.5-1.5B-Instruct",
    "Qwen/Qwen2.5-3B-Instruct",
    "Qwen/Qwen2.5-7B-Instruct",
    "Qwen/Qwen3-0.6B",
    "Qwen/Qwen3-1.7B",
    "Qwen/Qwen3-4B",
    "Qwen/Qwen3-8B",
  ],
} as const;

const QUESTION_ORDER_BY_GROUP: Record<keyof typeof MODEL_GROUPS, QuestionKey[]> = {
  exaone: [
    "cpu_gpu_npu",
    "morning_routine",
    "used_laptop",
    "living_expenses",
    "seoul_itinerary",
    "lunch_ideas",
    "interest_rates",
    "ai_at_work",
  ],
  qwen: [
    "cpu_gpu_npu",
    "morning_routine",
    "used_laptop",
    "living_expenses",
    "seoul_itinerary",
    "lunch_ideas",
    "interest_rates",
    "ai_at_work",
  ],
};

function assignQuestions(models: readonly string[], questions: string[]) {
  return Object.fromEntries(models.map((modelId) => [modelId, questions]));
}

function questionsForLocale(locale: string, keys: QuestionKey[]) {
  const localizedQuestions = QUESTION_SETS_BY_LANGUAGE[locale] ?? koQuestions;
  return keys.map((key) => localizedQuestions[key]);
}

function buildLanguageCatalog(locale: string): ExampleQuestions {
  return {
    ...assignQuestions(
      MODEL_GROUPS.exaone,
      questionsForLocale(locale, QUESTION_ORDER_BY_GROUP.exaone),
    ),
    ...assignQuestions(
      MODEL_GROUPS.qwen,
      questionsForLocale(locale, QUESTION_ORDER_BY_GROUP.qwen),
    ),
  };
}

export const exampleQuestionsByLanguage: Record<string, ExampleQuestions> = {
  en: buildLanguageCatalog("en"),
  ko: buildLanguageCatalog("ko"),
  ja: buildLanguageCatalog("ja"),
  zh: buildLanguageCatalog("zh"),
};
