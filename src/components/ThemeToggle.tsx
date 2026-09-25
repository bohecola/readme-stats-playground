import { Moon, Sun } from "lucide-react"
import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
import { writeStorage } from "@/lib/storage"

type Theme = "light" | "dark"
const LS_THEME = "rsp:theme"

/** index.html already applied the saved or OS theme before paint; read it back. */
const currentTheme = (): Theme =>
  document.documentElement.classList.contains("dark") ? "dark" : "light"

export function ThemeToggle() {
  const { t } = useTranslation()
  const [theme, setTheme] = useState<Theme>(currentTheme)

  // Only an explicit choice is remembered, so an untouched setting keeps following the OS.
  const toggle = () => {
    const next: Theme = theme === "dark" ? "light" : "dark"
    document.documentElement.classList.toggle("dark", next === "dark")
    writeStorage(LS_THEME, next)
    setTheme(next)
  }

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
