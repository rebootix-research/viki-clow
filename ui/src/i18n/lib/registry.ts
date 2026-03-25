import type { TranslationMap } from "./types.ts";

export const DEFAULT_LOCALE = "en";
export const SUPPORTED_LOCALES = ["en", "zh-CN", "zh-TW", "pt-BR", "de", "es"] as const;

const TRANSLATIONS: Record<string, TranslationMap | null> = {
  en: null,
  de: {
    common: {
      health: "Status",
    },
  },
  es: {
    common: {
      health: "Estado",
    },
    languages: {
      de: "Deutsch (Alemán)",
    },
  },
  "pt-BR": {
    languages: {
      es: "Español (Espanhol)",
    },
  },
  "zh-CN": {
    common: {
      health: "\u5065\u5eb7\u72b6\u51b5",
    },
  },
  "zh-TW": {
    common: {
      health: "\u5065\u5eb7\u72c0\u6cc1",
    },
  },
};

export function resolveNavigatorLocale(locale: string | null | undefined): string {
  const raw = locale?.trim();
  if (!raw) {
    return DEFAULT_LOCALE;
  }
  const normalized = raw.toLowerCase();
  if (normalized.startsWith("zh-hk") || normalized.startsWith("zh-tw")) {
    return "zh-TW";
  }
  if (normalized.startsWith("zh")) {
    return "zh-CN";
  }
  if (normalized.startsWith("pt")) {
    return "pt-BR";
  }
  if (normalized.startsWith("de")) {
    return "de";
  }
  if (normalized.startsWith("es")) {
    return "es";
  }
  return DEFAULT_LOCALE;
}

export async function loadLazyLocaleTranslation(locale: string): Promise<TranslationMap | null> {
  return TRANSLATIONS[locale] ?? null;
}
