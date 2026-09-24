import { useTranslation } from "react-i18next"

import { ParamControl } from "@/components/ParamControl"
import { Separator } from "@/components/ui/separator"
import { COMMON_PARAMS, type EndpointDef, type ParamDef } from "@/lib/endpoints"
import type { ParamValue, ParamValues } from "@/lib/buildUrl"
import type { ParamScope } from "@/lib/paramText"

interface CardFormProps {
  endpoint: EndpointDef
  values: ParamValues
  onChange: (key: string, value: ParamValue) => void
  /** Keys that currently end up in the card URL. */
  setKeys: ReadonlySet<string>
}

export function CardForm({ endpoint, values, onChange, setKeys }: CardFormProps) {
  const { t } = useTranslation()
  const shared = { values, onChange, setKeys }
  return (
    <div className="space-y-7">
      <FieldSet
        title={t("form.cardParams")}
        scope={endpoint.id}
        params={endpoint.params}
        {...shared}
      />
      <Separator />
      <FieldSet title={t("form.commonStyle")} scope="common" params={COMMON_PARAMS} {...shared} />
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
}: {
  title: string
  scope: ParamScope
  params: ParamDef[]
  values: ParamValues
  onChange: (key: string, value: ParamValue) => void
  setKeys: ReadonlySet<string>
}) {
  const toggles = params.filter((p) => p.type === "boolean")
  // A lone toggle or two would leave a half-empty list, so fold them into the
  // field grid (in declaration order) instead of grouping them separately.
  const inlineToggles = toggles.length <= 2
  const gridParams = inlineToggles ? params : params.filter((p) => p.type !== "boolean")
  const listToggles = inlineToggles ? [] : toggles

  return (
    <section className="space-y-4">
      <h3 className="flex items-center gap-2 text-sm font-semibold">
        <span className="h-3.5 w-1 rounded-full bg-primary" />
        {title}
      </h3>

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
    </section>
  )
}
