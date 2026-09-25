import i18n from "i18next"
import LanguageDetector from "i18next-browser-languagedetector"
import { initReactI18next } from "react-i18next"

import en from "@/locales/en.json"
import ja from "@/locales/ja.json"
import zh from "@/locales/zh.json"

export const LANGUAGES = ["en", "zh", "ja"] as const
const LS_LANG = "rsp:lang"
export type Language = (typeof LANGUAGES)[number]

/** BCP 47 tag for <html lang>. */
const HTML_LANG: Record<Language, string> = { en: "en", zh: "zh-CN", ja: "ja" }

export const resources = {
  en: { translation: en },
  zh: { translation: zh },
  ja: { translation: ja },
} as const

declare module "i18next" {
  interface CustomTypeOptions {
    resources: (typeof resources)["en"]
  }
}

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    supportedLngs: LANGUAGES,
    // zh-CN / zh-TW / en-US … resolve to the base language we ship.
    nonExplicitSupportedLngs: true,
    load: "languageOnly",
    fallbackLng: "en",
    detection: {
      // A saved choice wins; otherwise follow the browser; else English.
      order: ["localStorage", "navigator"],
      lookupLocalStorage: LS_LANG,
      // Don't persist the auto-detected language, only an explicit choice
      // (see setLanguage), so a changed browser language is still honored.
      caches: [],
    },
    interpolation: { escapeValue: false }, // React already escapes
    react: { useSuspense: false }, // resources are bundled, nothing to wait for
  })

const syncHtmlLang = (lng: string) => {
  document.documentElement.lang = HTML_LANG[currentLanguage(lng)]
}
syncHtmlLang(i18n.language)
i18n.on("languageChanged", syncHtmlLang)

/** Normalizes whatever i18next resolved (e.g. "zh-CN") to a shipped language. */
export function currentLanguage(lng = i18n.resolvedLanguage ?? i18n.language): Language {
  const base = lng?.split("-")[0] ?? ""
  return (LANGUAGES as readonly string[]).includes(base) ? (base as Language) : "en"
}

/** Switch language and remember it as the user's explicit choice. */
export function setLanguage(lng: Language) {
  try {
    localStorage.setItem(LS_LANG, lng)
  } catch {
    // Remembering the choice is optional.
  }
  return i18n.changeLanguage(lng)
}

export default i18n
