import { Languages } from "lucide-react"
import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
import { currentLanguage, setLanguage, type Language } from "@/i18n"

/**
 * Two-language switch. Shows the language you'd switch *to*, labelled in that
 * language (each locale's `language.*` strings describe itself).
 */
export function LanguageToggle() {
  const { i18n } = useTranslation()
  const target: Language = currentLanguage(i18n.resolvedLanguage) === "zh" ? "en" : "zh"
  const tTarget = i18n.getFixedT(target)

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => setLanguage(target)}
      title={tTarget("language.switchTo")}
      aria-label={tTarget("language.switchTo")}
      lang={target === "zh" ? "zh-CN" : "en"}
      className="h-9 gap-1.5 px-2.5 text-xs font-medium"
    >
      <Languages className="h-4 w-4" />
      {tTarget("language.target")}
    </Button>
  )
}
