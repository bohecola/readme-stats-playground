import type { Gradient, Hsla, Rgba } from "@/lib/color"
import { Plus, X } from "lucide-react"
import { HexAlphaColorPicker } from "react-colorful"

import { useTranslation } from "react-i18next"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  expandHex,

  hexToRgba,

  hslaToRgba,
  isHex,
  normalizeHex,
  parseGradient,

  rgbaToHex,
  rgbaToHsla,
  serializeGradient,
  stripHash,
  toCssBackground,
} from "@/lib/color"
import { readJson, readStorage, writeStorage } from "@/lib/storage"
import { cn } from "@/lib/utils"

/** Default card colors first, then a general-purpose palette. */
const PRESETS = [
  "2f80ed",
  "434d58",
  "4c71f2",
  "fffefe",
  "e4e2e2",
  "000000",
  "151515",
  "24292e",
  "0d1117",
  "ffffff",
  "ef4444",
  "f97316",
  "eab308",
  "22c55e",
  "14b8a6",
  "06b6d4",
  "3b82f6",
  "6366f1",
  "a855f7",
  "ec4899",
]

const CHECKER
  = "bg-[conic-gradient(#d4d4d8_90deg,#fff_90deg_180deg,#d4d4d8_180deg_270deg,#fff_270deg)] bg-size-[8px_8px] bg-clip-padding"

const LS_RECENT = "rsp:recentColors"
const LS_FORMAT = "rsp:colorFormat"
const MAX_RECENT = 10

function loadRecent(): string[] {
  const list = readJson<unknown>(LS_RECENT)
  return Array.isArray(list)
    ? list.filter((c): c is string => typeof c === "string" && isHex(c))
    : []
}

/** Remember colors the user actually applied; shared by every color field. */
function pushRecent(value: string) {
  const colors = parseGradient(value)?.stops ?? [value]
  const fresh = colors.map(normalizeHex).filter(isHex)
  if (fresh.length === 0)
    return
  const next = [...new Set([...fresh, ...loadRecent()])].slice(0, MAX_RECENT)
  writeStorage(LS_RECENT, JSON.stringify(next))
}

type Format = "hex" | "rgb" | "hsl"

function loadFormat(): Format {
  const f = readStorage(LS_FORMAT)
  return f === "rgb" || f === "hsl" ? f : "hex"
}

interface ColorPickerProps {
  id: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  /** Allow the `angle,c1,c2,...` gradient syntax (bg_color only). */
  allowGradient?: boolean
}

export function ColorPicker({
  id,
  value,
  onChange,
  placeholder,
  allowGradient,
}: ColorPickerProps) {
  const { t } = useTranslation()
  const background = toCssBackground(value)
  const invalid = value.trim() !== "" && !background
  const isGradient = Boolean(allowGradient && parseGradient(value))

  return (
    <div
      className={cn(
        "flex h-9 items-center gap-2 rounded-md border border-input bg-transparent pl-1.5 pr-1 shadow-xs transition-colors focus-within:ring-1 focus-within:ring-ring",
        invalid && "border-destructive focus-within:ring-destructive",
      )}
    >
      <Popover onOpenChange={open => !open && pushRecent(value)}>
        <PopoverTrigger asChild>
          <button
            type="button"
            aria-label={t("color.open")}
            className={cn(
              "relative h-6 w-6 shrink-0 overflow-hidden rounded border border-black/10 shadow-xs transition-transform hover:scale-110 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring dark:border-white/15",
              CHECKER,
            )}
          >
            <span className="absolute inset-0" style={{ background }} />
            {!background && (
              // Empty / invalid → diagonal "no color" slash.
              <span className="absolute left-1/2 top-[-20%] h-[140%] w-px -translate-x-1/2 rotate-45 bg-destructive" />
            )}
          </button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-72 p-3">
          <PickerPanel
            value={value}
            onChange={onChange}
            allowGradient={allowGradient}
          />
        </PopoverContent>
      </Popover>

      {/*
        Shown with a leading `#` so the field copies as a ready-to-paste CSS
        color; the stored value (and the URL) stay without it, as
        github-readme-stats expects. Gradients keep their raw syntax.
      */}
      <input
        id={id}
        value={value && !isGradient ? `#${value}` : value}
        spellCheck={false}
        autoComplete="off"
        placeholder={
          placeholder ?? (allowGradient ? t("color.followThemeOrGradient") : t("color.followTheme"))
        }
        onChange={e => onChange(stripHash(e.target.value))}
        className="h-full min-w-0 flex-1 bg-transparent font-mono text-sm outline-hidden placeholder:font-sans placeholder:text-muted-foreground"
      />
      {value && (
        <button
          type="button"
          aria-label={t("color.clear")}
          onClick={() => onChange("")}
          className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  )
}

function PickerPanel({
  value,
  onChange,
  allowGradient,
}: {
  value: string
  onChange: (v: string) => void
  allowGradient?: boolean
}) {
  const { t } = useTranslation()
  const gradient = allowGradient ? parseGradient(value) : null
  const [activeStop, setActiveStop] = useState(0)
  // Read once per open — the panel unmounts when the popover closes.
  const [recent] = useState(loadRecent)
  const stopIndex = gradient ? Math.min(activeStop, gradient.stops.length - 1) : 0

  const current = gradient ? gradient.stops[stopIndex] : normalizeHex(value)
  const setCurrent = (hex: string) => {
    if (!gradient)
      return onChange(hex)
    const stops = gradient.stops.map((s, i) => (i === stopIndex ? hex : s))
    onChange(serializeGradient({ ...gradient, stops }))
  }

  const toMode = (mode: "solid" | "gradient") => {
    if (mode === "solid" && gradient) {
      onChange(gradient.stops[0] ?? "")
    }
    else if (mode === "gradient" && !gradient) {
      const base = isHex(value) ? normalizeHex(value) : "2f80ed"
      setActiveStop(0)
      onChange(serializeGradient({ angle: 90, stops: [base, "a855f7"] }))
    }
  }

  return (
    <div className="space-y-3">
      {allowGradient && (
        <div className="grid grid-cols-2 rounded-md bg-muted p-0.5 text-xs font-medium">
          {(["solid", "gradient"] as const).map((mode) => {
            const active = (mode === "gradient") === Boolean(gradient)
            return (
              <button
                key={mode}
                type="button"
                onClick={() => toMode(mode)}
                className={cn(
                  "rounded px-2 py-1 transition-colors",
                  active
                    ? "bg-background text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {mode === "solid" ? t("color.solid") : t("color.gradient")}
              </button>
            )
          })}
        </div>
      )}

      {gradient && (
        <GradientEditor
          gradient={gradient}
          activeStop={stopIndex}
          onSelectStop={setActiveStop}
          onChange={g => onChange(serializeGradient(g))}
        />
      )}

      <HexAlphaColorPicker
        className="color-picker"
        color={isHex(current) ? `#${expandHex(current)}` : "#000000"}
        onChange={(hex) => {
          const rgba = hexToRgba(hex)
          if (rgba)
            setCurrent(rgbaToHex(rgba))
        }}
      />

      <ColorInputs value={current} onCommit={setCurrent} />

      {recent.length > 0 && (
        <SwatchGrid title={t("color.recent")} colors={recent} current={current} onPick={setCurrent} />
      )}
      <SwatchGrid title={t("color.presets")} colors={PRESETS} current={current} onPick={setCurrent} />
    </div>
  )
}

/**
 * Figma / DevTools-style value row: format switch, per-channel
 * fields and a separate alpha percentage. Always commits card-ready hex.
 */
function ColorInputs({ value, onCommit }: { value: string, onCommit: (hex: string) => void }) {
  const { t } = useTranslation()
  const [format, setFormat] = useState<Format>(loadFormat)
  const rgba = hexToRgba(value)
  const base: Rgba = rgba ?? { r: 0, g: 0, b: 0, a: 1 }
  const hsla = rgbaToHsla(base)

  const changeFormat = (f: Format) => {
    setFormat(f)
    try {
      localStorage.setItem(LS_FORMAT, f)
    }
    catch {
      // Remembering the format is optional.
    }
  }

  const setRgb = (patch: Partial<Rgba>) => onCommit(rgbaToHex({ ...base, ...patch }))
  const setHsl = (patch: Partial<Hsla>) => onCommit(rgbaToHex(hslaToRgba({ ...hsla, ...patch })))

  return (
    <div className="flex items-center gap-1.5">
      <Select value={format} onValueChange={f => changeFormat(f as Format)}>
        <SelectTrigger aria-label={t("color.format")} size="sm" className="w-[66px] shrink-0 px-2 text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent position="popper">
          <SelectItem value="hex" className="text-xs">HEX</SelectItem>
          <SelectItem value="rgb" className="text-xs">RGB</SelectItem>
          <SelectItem value="hsl" className="text-xs">HSL</SelectItem>
        </SelectContent>
      </Select>

      <div className="flex h-8 min-w-0 flex-1 divide-x divide-input overflow-hidden rounded-md border border-input shadow-xs focus-within:ring-1 focus-within:ring-ring">
        {format === "hex" && <HexInput value={value} alpha={base.a} onCommit={onCommit} />}
        {format === "rgb" && (
          <>
            <NumberField label="R" value={rgba?.r} max={255} onCommit={r => setRgb({ r })} />
            <NumberField label="G" value={rgba?.g} max={255} onCommit={g => setRgb({ g })} />
            <NumberField label="B" value={rgba?.b} max={255} onCommit={b => setRgb({ b })} />
          </>
        )}
        {format === "hsl" && (
          <>
            <NumberField label="H" value={rgba && hsla.h} max={360} onCommit={h => setHsl({ h })} />
            <NumberField label="S" value={rgba && hsla.s} max={100} onCommit={s => setHsl({ s })} />
            <NumberField label="L" value={rgba && hsla.l} max={100} onCommit={l => setHsl({ l })} />
          </>
        )}
        <NumberField
          label={t("color.alpha")}
          value={rgba && base.a * 100}
          max={100}
          suffix="%"
          className="w-[52px] flex-none"
          onCommit={pct => setRgb({ a: pct / 100 })}
        />
      </div>
    </div>
  )
}

/** 6-digit hex (alpha lives in its own field); an 8-digit paste is accepted as-is. */
function HexInput({
  value,
  alpha,
  onCommit,
}: {
  value: string
  alpha: number
  onCommit: (hex: string) => void
}) {
  const shown = isHex(value) ? expandHex(value).slice(0, 6) : ""
  const [draft, setDraft] = useState(shown)
  // A new value from outside (picker, swatch) replaces what's being typed.
  const [prevShown, setPrevShown] = useState(shown)
  if (shown !== prevShown) {
    setPrevShown(shown)
    setDraft(shown)
  }

  return (
    <input
      aria-label="HEX"
      value={draft ? `#${draft}` : ""}
      spellCheck={false}
      maxLength={9}
      onChange={(e) => {
        const next = normalizeHex(e.target.value)
        setDraft(next)
        const rgba = hexToRgba(next)
        if (!rgba)
          return
        const hasAlpha = next.length === 4 || next.length === 8
        onCommit(rgbaToHex(hasAlpha ? rgba : { ...rgba, a: alpha }))
      }}
      onBlur={() => setDraft(shown)}
      className={cn(
        "min-w-0 flex-1 bg-transparent px-2 font-mono text-xs uppercase outline-hidden",
        draft !== "" && !isHex(draft) && "text-destructive",
      )}
    />
  )
}

/** Integer field: live-commits valid input, ↑/↓ steps by 1 (Shift ×10). */
function NumberField({
  label,
  value,
  max,
  suffix,
  className,
  onCommit,
}: {
  label: string
  value: number | null | undefined
  max: number
  suffix?: string
  className?: string
  onCommit: (v: number) => void
}) {
  const shown = value == null ? "" : String(Math.round(value))
  const [draft, setDraft] = useState(shown)
  const [prevShown, setPrevShown] = useState(shown)
  if (shown !== prevShown) {
    setPrevShown(shown)
    setDraft(shown)
  }

  const commit = (n: number) => onCommit(Math.min(max, Math.max(0, n)))

  return (
    <label className={cn("relative flex min-w-0 flex-1 items-center", className)} title={label}>
      <input
        aria-label={label}
        value={draft}
        inputMode="numeric"
        onChange={(e) => {
          const text = e.target.value.replace(/\D/g, "")
          setDraft(text)
          if (text !== "")
            commit(Number(text))
        }}
        onKeyDown={(e) => {
          if (e.key !== "ArrowUp" && e.key !== "ArrowDown")
            return
          e.preventDefault()
          const step = (e.shiftKey ? 10 : 1) * (e.key === "ArrowUp" ? 1 : -1)
          commit(Math.round(value ?? 0) + step)
        }}
        onBlur={() => setDraft(shown)}
        className={cn(
          "h-full w-full min-w-0 bg-transparent text-center font-mono text-xs tabular-nums outline-hidden",
          suffix && "pr-3",
        )}
      />
      {suffix && (
        <span className="pointer-events-none absolute right-1.5 text-[10px] text-muted-foreground">
          {suffix}
        </span>
      )}
    </label>
  )
}

function SwatchGrid({
  title,
  colors,
  current,
  onPick,
}: {
  title: string
  colors: string[]
  current: string
  onPick: (hex: string) => void
}) {
  return (
    <div className="space-y-1.5">
      <p className="text-[11px] font-medium text-muted-foreground">{title}</p>
      <div className="grid grid-cols-10 gap-1">
        {colors.map(hex => (
          <button
            key={hex}
            type="button"
            title={`#${hex}`}
            onClick={() => onPick(hex)}
            className={cn(
              "aspect-square overflow-hidden rounded-sm border border-black/10 transition-transform hover:scale-110 dark:border-white/15",
              CHECKER,
              normalizeHex(current) === hex && "ring-2 ring-ring ring-offset-1 ring-offset-popover",
            )}
          >
            <span className="block h-full w-full" style={{ background: `#${hex}` }} />
          </button>
        ))}
      </div>
    </div>
  )
}

function GradientEditor({
  gradient,
  activeStop,
  onSelectStop,
  onChange,
}: {
  gradient: Gradient
  activeStop: number
  onSelectStop: (i: number) => void
  onChange: (g: Gradient) => void
}) {
  const { t } = useTranslation()
  const { angle, stops } = gradient
  const canRemove = stops.length > 2

  return (
    <div className="space-y-2.5">
      <div
        className={cn("h-8 overflow-hidden rounded-md border border-black/10 dark:border-white/15", CHECKER)}
      >
        <div
          className="h-full w-full"
          style={{ background: toCssBackground(serializeGradient(gradient)) }}
        />
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        {stops.map((stop, i) => (
          // Stops can repeat and are edited in place, so the position is the identity.
          // eslint-disable-next-line react/no-array-index-key
          <div key={i} className="group relative">
            <button
              type="button"
              title={t("color.stop", { n: i + 1, hex: stop })}
              onClick={() => onSelectStop(i)}
              className={cn(
                "block h-6 w-6 overflow-hidden rounded border border-black/10 dark:border-white/15",
                CHECKER,
                i === activeStop && "ring-2 ring-ring ring-offset-1 ring-offset-popover",
              )}
            >
              <span
                className="block h-full w-full"
                style={{ background: isHex(stop) ? `#${stop}` : undefined }}
              />
            </button>
            {canRemove && (
              <button
                type="button"
                aria-label={t("color.removeStop", { n: i + 1 })}
                onClick={() => {
                  onChange({ angle, stops: stops.filter((_, j) => j !== i) })
                  onSelectStop(Math.max(0, activeStop - (i <= activeStop ? 1 : 0)))
                }}
                className="absolute -right-1.5 -top-1.5 hidden h-3.5 w-3.5 items-center justify-center rounded-full bg-foreground text-background group-hover:flex"
              >
                <X className="h-2.5 w-2.5" />
              </button>
            )}
          </div>
        ))}
        {stops.length < 5 && (
          <button
            type="button"
            aria-label={t("color.addStop")}
            onClick={() => {
              onChange({ angle, stops: [...stops, stops[stops.length - 1]] })
              onSelectStop(stops.length)
            }}
            className="flex h-6 w-6 items-center justify-center rounded border border-dashed border-input text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground">{t("color.angle")}</span>
        <input
          type="range"
          min={0}
          max={360}
          value={angle}
          onChange={e => onChange({ angle: Number(e.target.value), stops })}
          className="h-1.5 flex-1 cursor-pointer accent-primary"
        />
        <span className="w-9 text-right font-mono text-xs tabular-nums">
          {angle}
          °
        </span>
      </div>
    </div>
  )
}
