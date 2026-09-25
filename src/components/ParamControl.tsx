import { useTranslation } from "react-i18next"
import { Check } from "lucide-react"

import { ColorPicker } from "@/components/ColorPicker"
import { HintTip } from "@/components/HintTip"
import { NumberInput } from "@/components/NumberInput"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import type { ParamDef } from "@/lib/endpoints"
import { useParamText, type ParamScope } from "@/lib/paramText"
import { THEMES } from "@/lib/themes"
import type { ParamValue } from "@/lib/buildUrl"

interface ParamControlProps {
  param: ParamDef
  value: ParamValue
  onChange: (key: string, value: ParamValue) => void
  /**
   * How a boolean renders: a row inside a grouped settings list (default), or a
   * standalone field that sits in the input grid alongside text/select fields.
   */
  toggleLayout?: "row" | "field"
  /** The param currently ends up in the card URL (non-empty, non-default). */
  isSet?: boolean
  /** Card id (or "common") for per-card text overrides. */
  scope: ParamScope
  /** Text fields only: focus on mount. */
  autoFocus?: boolean
}

export function ParamControl({
  param,
  value,
  onChange,
  toggleLayout = "row",
  isSet = false,
  scope,
  autoFocus,
}: ParamControlProps) {
  const { t } = useTranslation()
  const text = useParamText()
  const label = text(param, scope, "label") ?? param.key
  const hint = text(param, scope, "hint")
  const placeholder = text(param, scope, "placeholder")
  const id = useId()
  const set = (v: ParamValue) => onChange(param.key, v)

  const labelNode = (
    <div className="flex items-center gap-2">
      <Label htmlFor={id} className="flex shrink-0 items-center gap-1">
        {label}
        {param.required && <span className="text-destructive">*</span>}
      </Label>
      {hint && <HintTip text={hint} />}
      <ParamKey className="ml-auto" name={param.key} active={isSet} extended={param.extended} />
    </div>
  )

  // Boolean as a grid field → same label row as other inputs, switch in an input-height box.
  if (param.type === "boolean" && toggleLayout === "field") {
    const checked = Boolean(value ?? param.default ?? false)
    return (
      <div className="space-y-2">
        {labelNode}
        <label
          htmlFor={id}
          className="flex h-9 cursor-pointer items-center justify-between rounded-md border border-input px-3 shadow-xs transition-colors hover:bg-accent/40"
        >
          <span className="text-sm text-muted-foreground">{checked ? t("form.on") : t("form.off")}</span>
          <Switch id={id} checked={checked} onCheckedChange={(c) => set(c)} />
        </label>
      </div>
    )
  }

  // Boolean → clean settings-list row (border is provided by the group wrapper).
  if (param.type === "boolean") {
    return (
      <label
        htmlFor={id}
        className="flex min-h-12 cursor-pointer items-center justify-between gap-3 px-3 py-2"
      >
        <span className="min-w-0">
          <span className="flex items-center gap-1 text-sm font-medium">
            {label}
            {hint && <HintTip text={hint} />}
          </span>
          <ParamKey className="mt-0.5" name={param.key} active={isSet} extended={param.extended} />
        </span>
        <Switch
          id={id}
          checked={Boolean(value ?? param.default ?? false)}
          onCheckedChange={(c) => set(c)}
        />
      </label>
    )
  }

  return (
    <div className="space-y-2">
      {labelNode}

      {param.type === "select" && (
        <Select
          value={(value as string) ?? param.default ?? ""}
          onValueChange={(v) => set(v)}
        >
          {/* The regenerated trigger defaults to w-fit; form fields fill their column. */}
          <SelectTrigger id={id} className="w-full">
            <SelectValue placeholder={t("form.select")} />
          </SelectTrigger>
          <SelectContent position="popper">
            {(param.key === "theme" ? THEMES : param.options ?? []).map((opt) => (
              <SelectItem key={opt} value={opt}>
                {opt}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {param.type === "multiselect" && (
        <MultiSelect
          choices={[...(param.choices ?? []), ...(param.extendedChoices ?? [])]}
          extendedChoices={param.extendedChoices}
          value={(value as string[]) ?? []}
          onChange={(arr) => set(arr)}
        />
      )}

      {param.type === "color" && (
        <ColorPicker
          id={id}
          value={(value as string) ?? ""}
          onChange={set}
          placeholder={placeholder}
          allowGradient={param.gradient}
        />
      )}

      {param.type === "number" && (
        <NumberInput
          id={id}
          value={value == null ? "" : String(value)}
          onChange={set}
          placeholder={
            placeholder ??
            (param.default !== undefined
              ? t("form.defaultValue", { value: param.default })
              : t("form.auto"))
          }
          min={param.min}
          max={param.max}
          step={param.step}
          unit={param.unit && t(`units.${param.unit}`)}
          base={typeof param.default === "number" ? param.default : undefined}
        />
      )}

      {param.type === "text" && (
        <Input
          id={id}
          value={(value as string) ?? ""}
          placeholder={placeholder}
          autoFocus={autoFocus}
          onChange={(e) => set(e.target.value)}
        />
      )}

    </div>
  )
}

function MultiSelect({
  choices,
  extendedChoices,
  value,
  onChange,
}: {
  choices: string[]
  /** Subset of `choices` only GitHub Stats Extended understands; marked in the UI. */
  extendedChoices?: string[]
  value: string[]
  onChange: (v: string[]) => void
}) {
  const { t } = useTranslation()
  const toggle = (choice: string) => {
    onChange(
      value.includes(choice)
        ? value.filter((c) => c !== choice)
        : [...value, choice],
    )
  }
  return (
    <div className="flex flex-wrap gap-1.5">
      {choices.map((choice) => {
        const active = value.includes(choice)
        const extended = extendedChoices?.includes(choice)
        return (
          <button
            key={choice}
            type="button"
            onClick={() => toggle(choice)}
            title={extended ? t("form.extendedOnly") : undefined}
            className={cn(
              "inline-flex items-center gap-1 rounded-md border px-2 py-1 font-mono text-xs transition-colors",
              active
                ? "border-primary bg-primary text-primary-foreground"
                : "border-input bg-background text-muted-foreground hover:bg-accent",
            )}
          >
            {active && <Check className="h-3 w-3" />}
            {choice}
            {extended && <ExtMark />}
          </button>
        )
      })}
    </div>
  )
}

/**
 * The URL parameter name, shown as a quiet secondary label. Highlighted with a
 * dot when the param is actually written into the card URL.
 */
function ParamKey({
  name,
  active,
  extended,
  className,
}: {
  name: string
  active: boolean
  /** Only GitHub Stats Extended supports it; shows an "ext" mark. */
  extended?: boolean
  className?: string
}) {
  const { t } = useTranslation()
  return (
    <code
      title={active ? t("form.paramSet") : undefined}
      className={cn(
        "flex min-w-0 items-center gap-1.5 font-mono text-[11px] transition-colors",
        active ? "text-foreground" : "text-muted-foreground/80",
        className,
      )}
    >
      {active && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />}
      <span className="truncate">{name}</span>
      {extended && <ExtMark title={t("form.extendedOnly")} />}
    </code>
  )
}

/** "ext" tag for params and choices that only GitHub Stats Extended supports. */
function ExtMark({ title }: { title?: string }) {
  return (
    <span
      title={title}
      className="shrink-0 rounded-sm border border-current/40 px-1 text-[9px] leading-[14px] font-sans uppercase tracking-wide opacity-70"
    >
      ext
    </span>
  )
}
