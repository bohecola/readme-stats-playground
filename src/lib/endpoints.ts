import { THEMES } from "./themes"

export type ParamType
  = | "text"
    | "number"
    | "boolean"
    | "select"
    | "multiselect"
    | "color"

export interface ParamDef {
  /** URL query key. Label / hint / placeholder text live in src/locales (see lib/paramText). */
  key: string
  type: ParamType
  /** Default value used by github-readme-stats; omitted from the URL when unchanged. */
  default?: string | number | boolean
  /** Options for `select`. */
  options?: string[]
  /** Choices for `multiselect` (values are comma-joined in the URL). */
  choices?: string[]
  /** Extra `multiselect` choices only GitHub Stats Extended understands. */
  extendedChoices?: string[]
  /** Only GitHub Stats Extended supports this param; github-readme-stats ignores it. */
  extended?: boolean
  required?: boolean
  /** `color` only: also accept the `angle,c1,c2,...` gradient syntax. */
  gradient?: boolean
  /** `number` only: bounds, step size (↑/↓ and stepper buttons) and a display unit. */
  min?: number
  max?: number
  step?: number
  unit?: "px" | "seconds"
}

export type CardId = "stats" | "top-langs" | "pin" | "wakatime" | "gist"

export interface EndpointDef {
  /** Also the i18n key for the card's name and description (`cards.<id>`). */
  id: CardId
  /** Path appended to the base URL, e.g. "/api" or "/api/top-langs". */
  path: string
  /** Endpoint-specific parameters (common style params are appended separately). */
  params: ParamDef[]
}

/** Shared style parameters available on every card. */
export const COMMON_PARAMS: ParamDef[] = [
  { key: "theme", type: "select", options: THEMES, default: "default" },
  { key: "title_color", type: "color" },
  { key: "text_color", type: "color" },
  { key: "icon_color", type: "color" },
  { key: "bg_color", type: "color", gradient: true },
  { key: "border_color", type: "color" },
  { key: "hide_border", type: "boolean", default: false },
  { key: "border_radius", type: "number", default: 4.5, min: 0, step: 0.5, unit: "px" },
  { key: "cache_seconds", type: "number", min: 21600, max: 86400, step: 3600, unit: "seconds" },
  { key: "locale", type: "text" },
]

export const ENDPOINTS: EndpointDef[] = [
  {
    id: "stats",
    path: "/api",
    params: [
      { key: "username", type: "text", required: true },
      { key: "custom_title", type: "text" },
      {
        key: "hide",
        type: "multiselect",
        choices: ["stars", "commits", "prs", "issues", "contribs"],
      },
      {
        key: "show",
        type: "multiselect",
        choices: [
          "reviews",
          "discussions_started",
          "discussions_answered",
          "prs_merged",
          "prs_merged_percentage",
        ],
        extendedChoices: [
          "contributions",
          "all_time_contribs",
          "prs_authored",
          "prs_commented",
          "prs_reviewed",
          "issues_authored",
          "issues_commented",
        ],
      },
      { key: "exclude_repo", type: "text" },
      { key: "repo", type: "text", extended: true },
      { key: "owner", type: "text", extended: true },
      { key: "role", type: "multiselect", choices: ["OWNER", "ORGANIZATION_MEMBER", "COLLABORATOR"], extended: true },
      { key: "show_icons", type: "boolean", default: false },
      { key: "hide_title", type: "boolean", default: false },
      { key: "hide_rank", type: "boolean", default: false },
      { key: "include_all_commits", type: "boolean", default: false },
      { key: "contribs_include_own_repos", type: "boolean", default: false, extended: true },
      { key: "text_bold", type: "boolean", default: true },
      { key: "disable_animations", type: "boolean", default: false },
      { key: "rank_icon", type: "select", options: ["default", "github", "percentile"], default: "default" },
      { key: "number_format", type: "select", options: ["short", "long"], default: "short" },
      { key: "number_precision", type: "number", min: 0, max: 2, step: 1 },
      // Upstream defaults to the current year; matching it keeps it out of the URL and starts the stepper there.
      { key: "commits_year", type: "number", default: new Date().getFullYear(), min: 2008, step: 1 },
      { key: "line_height", type: "number", default: 25, min: 1, unit: "px" },
      { key: "card_width", type: "number", min: 0, step: 10, unit: "px" },
      { key: "ring_color", type: "color" },
    ],
  },
  {
    id: "top-langs",
    path: "/api/top-langs",
    params: [
      { key: "username", type: "text", required: true },
      { key: "custom_title", type: "text" },
      {
        key: "layout",
        type: "select",
        options: ["normal", "compact", "donut", "donut-vertical", "pie"],
        default: "normal",
      },
      { key: "stats_format", type: "select", options: ["percentages", "bytes"], default: "percentages" },
      { key: "hide", type: "text" },
      { key: "exclude_repo", type: "text" },
      { key: "role", type: "multiselect", choices: ["OWNER", "ORGANIZATION_MEMBER", "COLLABORATOR"], extended: true },
      // No default: upstream picks 5 or 6 depending on layout, so always send what's set.
      { key: "langs_count", type: "number", min: 1, max: 20 },
      { key: "hide_title", type: "boolean", default: false },
      { key: "hide_progress", type: "boolean", default: false },
      { key: "hide_values", type: "boolean", default: false, extended: true },
      { key: "disable_animations", type: "boolean", default: false },
      { key: "card_width", type: "number", default: 300, min: 0, step: 10, unit: "px" },
      { key: "size_weight", type: "number", default: 1, min: 0, step: 0.1 },
      { key: "count_weight", type: "number", default: 0, min: 0, step: 0.1 },
      { key: "prog_bar_bg_color", type: "color", extended: true },
    ],
  },
  {
    id: "pin",
    path: "/api/pin",
    params: [
      { key: "username", type: "text", required: true },
      { key: "repo", type: "text", required: true },
      { key: "show_owner", type: "boolean", default: false },
      { key: "description_lines_count", type: "number", min: 1, max: 3 },
      {
        key: "show",
        type: "multiselect",
        choices: ["prs_authored", "prs_commented", "prs_reviewed", "issues_authored", "issues_commented"],
        extended: true,
      },
      { key: "number_format", type: "select", options: ["short", "long"], default: "short", extended: true },
      { key: "line_height", type: "number", default: 22, min: 1, unit: "px", extended: true },
      { key: "card_width", type: "number", min: 0, step: 10, unit: "px", extended: true },
      { key: "show_icons", type: "boolean", default: true, extended: true },
      { key: "text_bold", type: "boolean", default: false, extended: true },
      { key: "browser_rendering", type: "boolean", default: false, extended: true },
    ],
  },
  {
    id: "wakatime",
    path: "/api/wakatime",
    params: [
      { key: "username", type: "text", required: true },
      { key: "custom_title", type: "text" },
      { key: "layout", type: "select", options: ["default", "compact"], default: "default" },
      { key: "display_format", type: "select", options: ["time", "percent"], default: "time" },
      { key: "hide", type: "text" },
      { key: "langs_count", type: "number", min: 1, max: 20 },
      { key: "hide_title", type: "boolean", default: false },
      { key: "hide_progress", type: "boolean", default: false },
      { key: "disable_animations", type: "boolean", default: false },
      { key: "line_height", type: "number", default: 25, min: 1, unit: "px" },
      { key: "card_width", type: "number", default: 495, min: 0, step: 10, unit: "px" },
      { key: "api_domain", type: "text" },
    ],
  },
  {
    id: "gist",
    path: "/api/gist",
    params: [
      { key: "id", type: "text", required: true },
      { key: "show_owner", type: "boolean", default: false },
      { key: "browser_rendering", type: "boolean", default: false, extended: true },
    ],
  },
]
