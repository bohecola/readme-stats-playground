import { useEffect, useState } from "react"
import { Moon, Sun } from "lucide-react"
import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"

type Theme = "light" | "dark"
const LS_THEME = "rsp:theme"

function getInitialTheme(): Theme {
  try {
    const stored = localStorage.getItem(LS_THEME)
    if (stored === "light" || stored === "dark") return stored
  } catch {
    /* ignore */
  }
  // Fall back to the OS preference.
  return window.matchMedia?.("(prefers-color-scheme: light)").matches
    ? "light"
    : "dark"
}

export function ThemeToggle() {
  const { t } = useTranslation()
  const [theme, setTheme] = useState<Theme>(getInitialTheme)

  useEffect(() => {
    const root = document.documentElement
    root.classList.toggle("dark", theme === "dark")
    try {
      localStorage.setItem(LS_THEME, theme)
    } catch {
      /* ignore */
    }
  }, [theme])

  const toggle = () => setTheme((t) => (t === "dark" ? "light" : "dark"))

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggle}
      title={theme === "dark" ? t("theme.toLight") : t("theme.toDark")}
      aria-label={t("theme.toggle")}
    >
      {theme === "dark" ? <Sun /> : <Moon />}
    </Button>
  )
}
