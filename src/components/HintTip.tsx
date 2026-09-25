import { useRef, useState } from "react"
import { Info } from "lucide-react"

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

/**
 * Info icon with an explanation bubble. Opens on hover for mouse and on tap for
 * touch (a Radix Tooltip never opens on touch), so it's a Popover underneath.
 */
export function HintTip({ text }: { text: string }) {
  const [open, setOpen] = useState(false)
  const pointerType = useRef("")
  const isMouse = () => pointerType.current === "mouse"

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={text}
          onPointerDown={(e) => (pointerType.current = e.pointerType)}
          onPointerEnter={(e) => e.pointerType === "mouse" && setOpen(true)}
          onPointerLeave={(e) => e.pointerType === "mouse" && setOpen(false)}
          // Hover already opened it for mouse; skip Radix's click toggle so the
          // click doesn't immediately close it again.
          onClick={(e) => isMouse() && e.preventDefault()}
          className="shrink-0 rounded-full text-muted-foreground/70 hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring coarse:-m-1.5 coarse:p-1.5"
        >
          <Info className="h-3.5 w-3.5" />
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
