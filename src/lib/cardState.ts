import type { ParamValues } from "./buildUrl"
import type { UrlState } from "./urlState"
import { DEFAULT_USERNAME } from "./config"
import { COMMON_PARAMS, ENDPOINTS } from "./endpoints"
import { readJson, writeStorage } from "./storage"

/**
 * What the playground remembers between visits: every card's own params, one
 * shared style, and which cards keep a style of their own instead.
 */
export interface StoredState {
  values: Record<string, ParamValues>
  /** Common style shared by every card that hasn't opted out. */
  common: ParamValues
  /** Cards keeping their own common style instead of the shared one. */
  ownStyle: Record<string, boolean>
}

const LS_VALUES = "rsp:values"
const LS_COMMON = "rsp:common"
const LS_OWN_STYLE = "rsp:ownStyle"

const COMMON_KEYS = new Set(COMMON_PARAMS.map(p => p.key))
export const isCommonKey = (key: string) => COMMON_KEYS.has(key)

/** Separates a card's own params from common-style ones. */
export function splitCommon(values: ParamValues): { own: ParamValues, common: ParamValues } {
  const own: ParamValues = {}
  const common: ParamValues = {}
  for (const [key, value] of Object.entries(values)) {
    ;(isCommonKey(key) ? common : own)[key] = value
  }
  return { own, common }
}

/** Equal once unset entries (undefined / empty) are ignored. */
export function sameValues(a: ParamValues, b: ParamValues): boolean {
  const compact = (v: ParamValues) =>
    Object.entries(v).filter(([, x]) => x !== undefined && x !== null && x !== "")
  const ea = compact(a)
  const eb = new Map(compact(b))
  return ea.length === eb.size && ea.every(([k, v]) => JSON.stringify(eb.get(k)) === JSON.stringify(v))
}

/** Sensible starting values so the preview renders something immediately. */
export function seedValues(): Record<string, ParamValues> {
  return {
    "stats": { username: DEFAULT_USERNAME, show_icons: true },
    "top-langs": { username: DEFAULT_USERNAME, layout: "compact" },
    "pin": { username: DEFAULT_USERNAME, repo: "" },
    "wakatime": { username: "" },
    "gist": { id: "bbfce31e0217a3689c8d961a356cb10d" },
  }
}

/**
 * State from what was saved (each piece may be missing). Saves from before the
 * shared-style model kept common style per card: the first card's becomes the
 * shared style, and any card that differs keeps its own.
 */
export function fromStored(
  storedValues: Record<string, ParamValues> | null,
  storedCommon: ParamValues | null,
  storedOwnStyle: Record<string, boolean> | null,
): StoredState {
  const values = { ...seedValues(), ...storedValues }
  if (storedCommon)
    return { values, common: storedCommon, ownStyle: storedOwnStyle ?? {} }

  const shared
    = ENDPOINTS.map(e => splitCommon(values[e.id] ?? {}).common).find(
      c => Object.keys(c).length > 0,
    ) ?? {}
  const ownStyle: Record<string, boolean> = {}
  for (const e of ENDPOINTS) {
    const { own, common: cardCommon } = splitCommon(values[e.id] ?? {})
    // A card that was never styled just joins the shared style.
    if (Object.keys(cardCommon).length === 0 || sameValues(cardCommon, shared))
      values[e.id] = own
    else ownStyle[e.id] = true
  }
  return { values, common: shared, ownStyle }
}

/**
 * A shared link's card layered on top of the stored state. Returns `state`
 * itself when the link carries nothing to apply.
 */
export function applyUrlState(state: StoredState, url: UrlState | null): StoredState {
  // A bare `?card=x` only picks the tab; the card keeps what was stored.
  if (!url || Object.keys(url.values).length === 0)
    return state
  const { cardId, values } = url
  const { own, common } = splitCommon(values)
  // The address bar mirrors the card *with* the shared style, so a plain reload
  // carries style too; only style that differs from the shared one becomes the
  // card's own.
  const styled = Object.keys(common).length > 0 && !sameValues(common, state.common)
  return {
    ...state,
    values: { ...state.values, [cardId]: styled ? { ...own, ...common } : own },
    ownStyle: { ...state.ownStyle, [cardId]: styled },
  }
}

export function storeState(state: StoredState) {
  writeStorage(LS_VALUES, JSON.stringify(state.values))
  writeStorage(LS_COMMON, JSON.stringify(state.common))
  writeStorage(LS_OWN_STYLE, JSON.stringify(state.ownStyle))
}

/** Stored state with the page's link applied; the link's card is then kept. */
export function loadState(url: UrlState | null): StoredState {
  const stored = fromStored(
    readJson<Record<string, ParamValues>>(LS_VALUES),
    readJson<ParamValues>(LS_COMMON),
    readJson<Record<string, boolean>>(LS_OWN_STYLE),
  )
  const state = applyUrlState(stored, url)
  if (state !== stored)
    storeState(state)
  return state
}
