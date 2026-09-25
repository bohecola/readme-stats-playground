import type { EndpointDef, ParamDef } from "./endpoints"
import { stripHash } from "./color"
import { COMMON_PARAMS } from "./endpoints"

export type ParamValue = string | number | boolean | string[] | undefined
export type ParamValues = Record<string, ParamValue>

/**
 * Cleans up a user-entered instance URL: trims, drops trailing slashes and adds
 * `https://` when no scheme was given, so `my-instance.vercel.app` works too.
 */
export function normalizeBaseUrl(input: string): string {
  const s = input.trim().replace(/\/+$/, "")
  if (!s)
    return ""
  return /^[a-z][a-z0-9+.-]*:\/\//i.test(s) ? s : `https://${s}`
}

/** All params for an endpoint: its own params followed by shared style params. */
export function allParams(endpoint: EndpointDef): ParamDef[] {
  return [...endpoint.params, ...COMMON_PARAMS]
}

function isEmptyValue(v: ParamValue): boolean {
  if (v == null)
    return true
  if (typeof v === "string")
    return v.trim() === ""
  if (Array.isArray(v))
    return v.length === 0
  return false
}

/** Serialize a single param to a query value, or null to omit it. */
function serialize(param: ParamDef, value: ParamValue): string | null {
  if (isEmptyValue(value))
    return null

  switch (param.type) {
    case "boolean": {
      const def = param.default ?? false
      if (value === def)
        return null
      return value ? "true" : "false"
    }
    case "select": {
      if (param.default !== undefined && value === param.default)
        return null
      return String(value)
    }
    case "multiselect": {
      const arr = (value as string[]).filter(Boolean)
      return arr.length ? arr.join(",") : null
    }
    case "color": {
      // Colors (and every gradient stop) are passed without a leading '#'.
      return stripHash(String(value))
    }
    case "number": {
      const text = String(value).trim()
      if (param.default !== undefined && Number(text) === param.default)
        return null
      return text
    }
    case "text":
    default:
      return String(value).trim()
  }
}

export interface BuiltUrl {
  url: string
  /** Ordered [key, value] pairs actually included in the query. */
  pairs: [string, string][]
  missingRequired: string[]
}

export function buildUrl(
  baseUrl: string,
  endpoint: EndpointDef,
  values: ParamValues,
): BuiltUrl {
  const params = allParams(endpoint)
  const pairs: [string, string][] = []
  const missingRequired: string[] = []

  for (const param of params) {
    const raw = values[param.key]
    if (param.required && isEmptyValue(raw)) {
      missingRequired.push(param.key)
    }
    const serialized = serialize(param, raw)
    if (serialized !== null) {
      pairs.push([param.key, serialized])
    }
  }

  const base = baseUrl.trim().replace(/\/+$/, "")
  const query = pairs
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join("&")
  const url = query ? `${base}${endpoint.path}?${query}` : `${base}${endpoint.path}`

  return { url, pairs, missingRequired }
}

export function toMarkdown(url: string, alt = "readme stats"): string {
  return `![${alt}](${url})`
}

export function toHtml(url: string, alt = "readme stats"): string {
  return `<img src="${url}" alt="${alt}" />`
}
