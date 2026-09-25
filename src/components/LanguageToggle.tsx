import { Languages } from "lucide-react"
import { useTranslation } from "react-i18next"

import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select"
import { currentLanguage, LANGUAGES, setLanguage, type Language } from "@/i18n"

/**
 * Each language is named in itself, so it stays recognizable whichever
 * language the UI is currently in.
 */
const LANGUAGE_NAMES: Record<Language, { short: string; full: string; tag: string }> = {
  en: { short: "EN", full: "English", tag: "en" },
  zh: { short: "中文", full: "简体中文", tag: "zh-CN" },
}

/** Language dropdown: the trigger shows the current language, the menu lists all of them. */
export function LanguageToggle() {
  const { t, i18n } = useTranslation()
  const current = currentLanguage(i18n.resolvedLanguage)
  // Radix refocuses the trigger on close, which the browser flags as
  // :focus-visible and draws a ring. Skip that when the menu was opened with
  // the mouse; keep it for keyboard users so they don't lose their place.
  const openedByPointer = useRef(false)

  return (
    <Select value={current} onValueChange={(lng) => setLanguage(lng as Language)}>
      <SelectTrigger
        title={t("language.label")}
        aria-label={t("language.label")}
        onPointerDown={() => (openedByPointer.current = true)}
        onKeyDown={() => (openedByPointer.current = false)}
        className="h-9 w-auto gap-1.5 border-0 bg-transparent px-2.5 text-xs font-medium shadow-none transition-colors hover:bg-accent hover:text-accent-foreground focus:ring-0 focus-visible:ring-1 dark:bg-transparent dark:hover:bg-accent"
      >
        <Languages className="h-4 w-4" />
        <span lang={LANGUAGE_NAMES[current].tag}>{LANGUAGE_NAMES[current].short}</span>
      </SelectTrigger>
      <SelectContent
        align="end"
        onCloseAutoFocus={(e) => {
          if (openedByPointer.current) e.preventDefault()
        }}
      >
        {LANGUAGES.map((lng) => (
          <SelectItem key={lng} value={lng} lang={LANGUAGE_NAMES[lng].tag}>
            {LANGUAGE_NAMES[lng].full}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
