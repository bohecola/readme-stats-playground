import { type PointerEvent, type ReactNode } from "react"
import { ChevronDown, ChevronUp } from "lucide-react"
import { useTranslation } from "react-i18next"

import { cn } from "@/lib/utils"

interface NumberInputProps {
  id?: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  min?: number
  max?: number
  step?: number
  unit?: string
  /** Where stepping starts from when the field is empty (usually the param's default). */
  base?: number
}

const HOLD_DELAY_MS = 400
const HOLD_INTERVAL_MS = 60

/**
 * Text field with custom stepper buttons in place of the native spinner:
 * ↑/↓ step (Shift ×10), buttons repeat while held, values are clamped to
 * [min, max] and rounded to the step's precision.
 */
export function NumberInput({
  id,
  value,
  onChange,
  placeholder,
  min,
  max,
  step = 1,
  unit,
  base,
}: NumberInputProps) {
  const { t } = useTranslation()
  const decimals = (String(step).split(".")[1] ?? "").length
  const clamp = (n: number) => Math.min(max ?? Infinity, Math.max(min ?? -Infinity, n))
  const parsed = value.trim() === "" ? NaN : Number(value)

  // Held buttons fire from timers, so read the latest value through a ref.
  const latest = useRef(value)
  latest.current = value

  const nudge = (direction: 1 | -1, multiplier = 1) => {
    const text = latest.current
    const current =
      text.trim() === "" || Number.isNaN(Number(text)) ? (base ?? min ?? 0) : Number(text)
    const next = clamp(current + direction * step * multiplier)
    onChange(String(Number(next.toFixed(decimals))))
  }

  const hold = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const stopHold = () => {
    clearTimeout(hold.current)
    clearInterval(hold.current)
  }
  useEffect(() => stopHold, [])

  const startHold = (direction: 1 | -1) => (e: PointerEvent) => {
    if (e.button !== 0) return
    e.preventDefault() // keep focus where it is
    nudge(direction)
    stopHold()
    // A button disabled mid-hold (hit min/max) stops getting pointer events,
    // so also end the hold on release anywhere.
    window.addEventListener("pointerup", stopHold, { once: true })
    hold.current = setTimeout(() => {
      hold.current = setInterval(() => nudge(direction), HOLD_INTERVAL_MS)
    }, HOLD_DELAY_MS)
  }

  const atMin = min !== undefined && parsed <= min
  const atMax = max !== undefined && parsed >= max

  return (
    <div className="flex h-9 items-stretch overflow-hidden rounded-md border border-input shadow-xs transition-colors focus-within:ring-1 focus-within:ring-ring">
      <input
        id={id}
        value={value}
        placeholder={placeholder}
        inputMode="decimal"
        autoComplete="off"
        onChange={(e) => onChange(e.target.value.replace(/[^\d.-]/g, ""))}
        onKeyDown={(e) => {
          if (e.key !== "ArrowUp" && e.key !== "ArrowDown") return
          e.preventDefault()
          nudge(e.key === "ArrowUp" ? 1 : -1, e.shiftKey ? 10 : 1)
        }}
        onBlur={() => {
          // Pull out-of-range typing back into bounds once the user is done.
          if (!Number.isNaN(parsed) && clamp(parsed) !== parsed) onChange(String(clamp(parsed)))
        }}
        className="min-w-0 flex-1 bg-transparent px-3 text-sm tabular-nums outline-hidden placeholder:text-muted-foreground"
      />
      {unit && (
        <span className="flex select-none items-center pr-2.5 text-xs text-muted-foreground">
          {unit}
        </span>
      )}
      {/* Stacked chevrons for mouse; side-by-side 36px buttons (− left, + right) for touch. */}
      <div className="flex w-7 shrink-0 flex-col border-l border-input coarse:w-auto coarse:flex-row-reverse">
        <StepButton label={t("form.increase")} disabled={atMax} onPointerDown={startHold(1)} onStop={stopHold}>
          <ChevronUp className="h-3 w-3" />
        </StepButton>
        <StepButton
          label={t("form.decrease")}
          disabled={atMin}
          onPointerDown={startHold(-1)}
          onStop={stopHold}
          className="border-t border-input coarse:border-r coarse:border-t-0"
        >
          <ChevronDown className="h-3 w-3" />
        </StepButton>
      </div>
    </div>
  )
}

function StepButton({
  label,
  disabled,
  onPointerDown,
  onStop,
  className,
  children,
}: {
  label: string
  disabled: boolean
  onPointerDown: (e: PointerEvent) => void
  onStop: () => void
  className?: string
  children: ReactNode
}) {
  return (
    <button
      type="button"
      tabIndex={-1} // keyboard users step with ↑/↓ in the field
      aria-label={label}
      disabled={disabled}
      onPointerDown={onPointerDown}
      onPointerUp={onStop}
      onPointerLeave={onStop}
      onPointerCancel={onStop}
      className={cn(
        "flex flex-1 touch-manipulation select-none items-center justify-center text-muted-foreground transition-colors hover:bg-accent hover:text-foreground active:bg-accent/80 disabled:pointer-events-none disabled:opacity-40 coarse:w-9 coarse:flex-none [&_svg]:coarse:h-4 [&_svg]:coarse:w-4",
        className,
      )}
    >
      {children}
    </button>
  )
}
