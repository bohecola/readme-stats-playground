import { Check, Copy } from "lucide-react"
import { useTranslation } from "react-i18next"

import { Button, type ButtonProps } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface CopyButtonProps {
  text: string
  label?: string
  disabled?: boolean
  variant?: ButtonProps["variant"]
  className?: string
}

export function CopyButton({ text, label, disabled, variant, className }: CopyButtonProps) {
  const { t } = useTranslation()
  const [copied, setCopied] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => () => clearTimeout(timer.current), [])

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text)
    } catch {
      // Fallback for insecure contexts / older browsers.
      const el = document.createElement("textarea")
      el.value = text
      el.style.position = "fixed"
      el.style.opacity = "0"
      document.body.appendChild(el)
      el.select()
      document.execCommand("copy")
      document.body.removeChild(el)
    }
    setCopied(true)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setCopied(false), 1500)
  }

  return (
    <Button
      type="button"
      size="sm"
      variant={variant}
      onClick={copy}
      disabled={disabled}
      className={cn("h-8 min-w-[76px] gap-1.5", className)}
    >
      {copied ? <Check /> : <Copy />}
      {copied ? t("preview.copied") : (label ?? t("preview.copy"))}
    </Button>
  )
}
