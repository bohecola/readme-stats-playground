import { Check, Copy } from "lucide-react"
import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
import { useCopy } from "@/hooks/useCopy"
import { cn } from "@/lib/utils"

interface CopyButtonProps {
  text: string
  label?: string
  disabled?: boolean
  variant?: React.ComponentProps<typeof Button>["variant"]
  className?: string
}

export function CopyButton({ text, label, disabled, variant, className }: CopyButtonProps) {
  const { t } = useTranslation()
  const { copied, copy } = useCopy()

  return (
    <Button
      type="button"
      size="sm"
      variant={variant}
      onClick={() => copy(text)}
      disabled={disabled}
      className={cn("h-8 min-w-[76px] gap-1.5", className)}
    >
      {copied ? <Check /> : <Copy />}
      {copied ? t("preview.copied") : (label ?? t("preview.copy"))}
    </Button>
  )
}
