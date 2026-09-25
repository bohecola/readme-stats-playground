import type { ParamDef } from "@/lib/endpoints"

import { useTranslation } from "react-i18next"

type Field = "label" | "hint" | "placeholder"

/** Scope for per-card overrides: an endpoint id, or "common" for shared style params. */
export type ParamScope = string

/**
 * Text for a parameter, looked up as `cardParams.<scope>.<key>.<field>` first,
 * then the shared `params.<key>.<field>`. An empty string in an override
 * blanks the field for that card (e.g. no comma hint on a multiselect).
 */
export function useParamText() {
  const { t, i18n } = useTranslation()
  // Keys are built at runtime from param ids, so they can't be checked
  // against the typed resource tree; this is the one place that opts out.
  const tDynamic = t as unknown as (keys: string[]) => string

  return (param: ParamDef, scope: ParamScope, field: Field): string | undefined => {
    const keys = [`cardParams.${scope}.${param.key}.${field}`, `params.${param.key}.${field}`]
    if (!keys.some(k => i18n.exists(k)))
      return undefined
    return tDynamic(keys) || undefined
  }
}
