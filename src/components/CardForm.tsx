import { useState, type ReactNode } from "react"
import { ChevronDown } from "lucide-react"
import { useTranslation } from "react-i18next"

import { ParamControl } from "@/components/ParamControl"
import { Separator } from "@/components/ui/separator"
import { COMMON_PARAMS, type EndpointDef, type ParamDef } from "@/lib/endpoints"
import type { ParamValue, ParamValues } from "@/lib/buildUrl"
import type { ParamScope } from "@/lib/paramText"
import { cn } from "@/lib/utils"

const LS_STYLE_OPEN = "rsp:styleOpen"

interface CardFormProps {
  endpoint: EndpointDef
  values: ParamValues
  onChange: (key: string, value: ParamValue) => void
  /** Keys that currently end up in the card URL. */
  setKeys: ReadonlySet<string>
  /** This card keeps its own common style instead of the shared one. */
  ownStyle: boolean
  onOwnStyleChange: (own: boolean) => void
}

export function CardForm({
  endpoint,
  values,
  onChange,
  setKeys,
  ownStyle,
  onOwnStyleChange,
}: CardFormProps) {
  const { t } = useTranslation()
  const shared = { values, onChange, setKeys }
  // First visit with nothing filled in: put the cursor in the required field.
  // Only once (this component stays mounted across tabs) and only with a
  // mouse, since a popped-up keyboard would push the preview off screen.
  const [autoFocusKey] = useState(() => {
    if (!window.matchMedia?.("(pointer: fine)").matches) return null
    const first = endpoint.params.find((p) => p.required)
    return first && !values[first.key] ? first.key : null
  })

  // Common style is long and mostly set-once, so it starts folded; the choice sticks.
  const [styleOpen, setStyleOpen] = useState(() => {
    try {
      return localStorage.getItem(LS_STYLE_OPEN) === "1"
    } catch {
      return false
    }
  })
  const toggleStyle = () => {
    const next = !styleOpen
    setStyleOpen(next)
    try {
      localStorage.setItem(LS_STYLE_OPEN, next ? "1" : "0")
    } catch {
      // Remembering the fold is optional.
    }
  }
  const styleCount = COMMON_PARAMS.filter((p) => setKeys.has(p.key)).length

  return (
    <div className="space-y-7">
      <FieldSet
        title={t("form.cardParams")}
        scope={endpoint.id}
        params={endpoint.params}
        autoFocusKey={autoFocusKey}
        {...shared}
      />
      <Separator />
      <FieldSet
        title={t("form.commonStyle")}
        scope="common"
        params={COMMON_PARAMS}
        collapsed={!styleOpen}
        onToggle={toggleStyle}
        meta={
          <>
            {styleCount > 0 && (
              <span className="text-xs font-normal tabular-nums text-muted-foreground">
                {t("form.setCount", { count: styleCount })}
              </span>
            )}
            {ownStyle && (
              <span className="rounded-full border px-1.5 py-px text-[11px] font-normal text-muted-foreground">
                {t("form.ownStyleBadge")}
              </span>
            )}
          </>
        }
        note={
          <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
            {ownStyle ? t("form.ownStyleNote") : t("form.sharedStyleNote")}
            <button
              type="button"
              onClick={() => onOwnStyleChange(!ownStyle)}
              className="font-medium text-foreground underline-offset-4 hover:underline"
            >
              {ownStyle ? t("form.useSharedStyle") : t("form.customizeStyle")}
            </button>
          </p>
        }
        {...shared}
      />
    </div>
  )
}

function FieldSet({
  title,
  scope,
  params,
  values,
  onChange,
  setKeys,
  autoFocusKey,
  collapsed = false,
  onToggle,
  meta,
  note,
}: {
  title: string
  scope: ParamScope
  params: ParamDef[]
  values: ParamValues
  onChange: (key: string, value: ParamValue) => void
  setKeys: ReadonlySet<string>
  autoFocusKey?: string | null
  /** With `onToggle`, the heading folds the section. */
  collapsed?: boolean
  onToggle?: () => void
  /** Extra bits after the title (counts, badges). */
  meta?: ReactNode
  /** Explanatory line under the heading, shown while open. */
  note?: ReactNode
}) {
  const toggles = params.filter((p) => p.type === "boolean")
  // A lone toggle or two would leave a half-empty list, so fold them into the
  // field grid (in declaration order) instead of grouping them separately.
  const inlineToggles = toggles.length <= 2
  const gridParams = inlineToggles ? params : params.filter((p) => p.type !== "boolean")
  const listToggles = inlineToggles ? [] : toggles

  const heading = (
    <>
      <span className="h-3.5 w-1 shrink-0 rounded-full bg-primary" />
      {title}
      {meta}
    </>
  )

  return (
    <section className="space-y-4">
      <h3 className="flex items-center gap-2 text-sm font-semibold">
        {onToggle ? (
          <button
            type="button"
            onClick={onToggle}
            aria-expanded={!collapsed}
            className="-m-1 flex flex-1 items-center gap-2 rounded-md p-1 text-left hover:bg-accent/60 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            {heading}
            <ChevronDown
              className={cn(
                "ml-auto h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200",
                collapsed && "-rotate-90",
              )}
            />
          </button>
        ) : (
          heading
        )}
      </h3>

      {collapsed ? null : (
        <>
          {note}

          {gridParams.length > 0 && (
            <div className="grid grid-cols-1 items-start gap-x-5 gap-y-5 sm:grid-cols-2">
              {gridParams.map((param) => (
                <div
                  key={param.key}
                  className={param.type === "multiselect" ? "sm:col-span-2" : undefined}
                >
                  <ParamControl
                    param={param}
                    value={values[param.key]}
                    onChange={onChange}
                    toggleLayout="field"
                    isSet={setKeys.has(param.key)}
                    scope={scope}
                    autoFocus={param.key === autoFocusKey}
                  />
                </div>
              ))}
            </div>
          )}

          {listToggles.length > 0 && (
            <div className="overflow-hidden rounded-lg border">
              <div className="grid grid-cols-1 gap-px bg-border sm:grid-cols-2">
                {listToggles.map((param) => (
                  <div key={param.key} className="bg-card transition-colors hover:bg-accent/40">
                    <ParamControl
                      param={param}
                      value={values[param.key]}
                      onChange={onChange}
                      isSet={setKeys.has(param.key)}
                      scope={scope}
                    />
                  </div>
                ))}
                {/* Fill a trailing odd cell so the divider grid stays flush. */}
                {listToggles.length % 2 === 1 && <div className="hidden bg-card sm:block" />}
              </div>
            </div>
          )}
        </>
      )}
    </section>
  )
}
