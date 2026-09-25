import { allParams, buildUrl, normalizeBaseUrl, type ParamValue, type ParamValues } from "./buildUrl"
import { ENDPOINTS, type CardId, type EndpointDef, type ParamDef } from "./endpoints"

/**
 * The playground's own URL mirrors the card: `?card=stats&username=x&theme=dark`.
 * Param keys and values are exactly what github-readme-stats takes, so a link
 * can be written by hand (or by an assistant) without knowing the app.
 */
const CARD_KEY = "card"
/** Only present when it differs from the deployment default. */
const INSTANCE_KEY = "instance"

export interface UrlState {
  cardId: CardId
  /** Own and common params mixed, as they appear in the card URL. */
  values: ParamValues
  baseUrl?: string
}

/** Inverse of buildUrl's serialize for one param; undefined when the text is unusable. */
function parse(param: ParamDef, text: string): ParamValue {
  switch (param.type) {
    case "boolean":
      return text === "true" ? true : text === "false" ? false : undefined
    case "multiselect": {
      const picked = text.split(",").map((s) => s.trim())
      const allowed = [...(param.choices ?? []), ...(param.extendedChoices ?? [])]
      const known = allowed.length ? picked.filter((s) => allowed.includes(s)) : picked
      return known.length ? known : undefined
    }
    case "select":
      // Theme options live in a separate list; other selects declare theirs.
      return param.options?.length && !param.options.includes(text) ? undefined : text
    case "number":
      return Number.isFinite(Number(text)) ? text : undefined
    case "color":
    case "text":
    default:
      return text
  }
}

export function parseUrlState(search: string): UrlState | null {
  const query = new URLSearchParams(search)
  const endpoint = ENDPOINTS.find((e) => e.id === query.get(CARD_KEY))
  if (!endpoint) return null

  const values: ParamValues = {}
  for (const param of allParams(endpoint)) {
    const text = query.get(param.key)
    if (text === null) continue
    const value = parse(param, text)
    if (value !== undefined) values[param.key] = value
  }
  // An empty `instance=` is deliberate ("no instance" on a deployment that has a default).
  const instance = query.get(INSTANCE_KEY)
  return { cardId: endpoint.id, values, baseUrl: instance === null ? undefined : normalizeBaseUrl(instance) }
}

/** Query string for the current card, serialized exactly like the card URL. */
export function toUrlSearch(
  endpoint: EndpointDef,
  values: ParamValues,
  baseUrl: string,
  defaultBaseUrl: string,
): string {
  const pairs: [string, string][] = [[CARD_KEY, endpoint.id], ...buildUrl(baseUrl, endpoint, values).pairs]
  if (baseUrl !== defaultBaseUrl) pairs.push([INSTANCE_KEY, baseUrl])
  return (
    "?" +
    pairs
      // Keep lists (hide=stars,commits) and the instance URL readable; these
      // characters are valid unescaped in a query value.
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v).replace(/%2C/g, ",").replace(/%3A/g, ":").replace(/%2F/g, "/")}`)
      .join("&")
  )
}
