import { normalizeBaseUrl } from "./buildUrl"

/**
 * Deployment-level defaults, set via env vars at build time (see .env.example).
 */

/**
 * github-readme-stats instance used until the visitor enters their own. Empty
 * by default: the public instance is unreliable (currently paused), so each
 * visitor points the playground at their own deployment. Self-hosters can set
 * VITE_DEFAULT_BASE_URL to theirs.
 */
export const DEFAULT_BASE_URL = normalizeBaseUrl(import.meta.env.VITE_DEFAULT_BASE_URL ?? "")

export const DEFAULT_USERNAME = import.meta.env.VITE_DEFAULT_USERNAME?.trim() ?? ""

export const UPSTREAM_REPO_URL = "https://github.com/anuraghazra/github-readme-stats"
/** github-readme-stats is unmaintained; this API-compatible successor is. */
export const EXTENDED_REPO_URL = "https://github.com/stats-organization/github-stats-extended"
/** The successor's public instance, offered with one click when none is set. */
export const SUGGESTED_INSTANCE_URL = "https://github-stats-extended.vercel.app"
/** Where to send people who want to run their own instance. */
export const DEPLOY_GUIDE_URL = EXTENDED_REPO_URL

/** This playground's own repository (the header's GitHub link). */
export const REPO_URL = "https://github.com/bohecola/readme-stats-playground"
