import { type ReactNode } from "react"
import { Info } from "lucide-react"

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

/**
 * Explanation bubble. Opens on hover for mouse and on tap for touch (a Radix
 * Tooltip never opens on touch), so it's a Popover underneath.
 *
 * Without children it's an info icon; with children, the children themselves
 * are the trigger, marked with a dotted underline like a defined term.
 */
export function HintTip({ text, children }: { text: string; children?: ReactNode }) {
  const [open, setOpen] = useState(false)
  const pointerType = useRef("")
  const isMouse = () => pointerType.current === "mouse"

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          // The icon needs a name; wrapped text is its own name.
          aria-label={children ? undefined : text}
          onPointerDown={(e) => (pointerType.current = e.pointerType)}
          onPointerEnter={(e) => e.pointerType === "mouse" && setOpen(true)}
          onPointerLeave={(e) => e.pointerType === "mouse" && setOpen(false)}
          // Hover already opened it for mouse; skip Radix's click toggle so the
          // click doesn't immediately close it again.
          onClick={(e) => isMouse() && e.preventDefault()}
          className={cn(
            "shrink-0 focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring",
            children
              ? "cursor-default rounded-sm underline decoration-dotted decoration-muted-foreground/60 underline-offset-[3px] hover:text-foreground hover:decoration-foreground/60"
              : "rounded-full text-muted-foreground/70 hover:text-foreground coarse:-m-1.5 coarse:p-1.5",
          )}
        >
          {children ?? <Info className="h-3.5 w-3.5" />}
        </button>
      </PopoverTrigger>
      <PopoverContent
        side="top"
        onOpenAutoFocus={(e) => e.preventDefault()}
        className="w-auto max-w-64 border-0 bg-primary px-3 py-1.5 text-xs text-primary-foreground"
      >
        {text}
      </PopoverContent>
    </Popover>
  )
}
