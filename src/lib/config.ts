/**
 * Deployment-level defaults, set via env vars at build time (see .env.example).
 */

/**
 * github-readme-stats instance used until the visitor enters their own. Empty
 * by default: the public instance is unreliable (currently paused), so each
 * visitor points the playground at their own deployment. Self-hosters can set
 * VITE_DEFAULT_BASE_URL to theirs.
 */
export const DEFAULT_BASE_URL = import.meta.env.VITE_DEFAULT_BASE_URL?.trim().replace(/\/+$/, "") ?? ""

export const DEFAULT_USERNAME = import.meta.env.VITE_DEFAULT_USERNAME?.trim() ?? ""

export const UPSTREAM_REPO_URL = "https://github.com/anuraghazra/github-readme-stats"
/** Upstream's guide to running your own instance. */
export const UPSTREAM_DEPLOY_URL = `${UPSTREAM_REPO_URL}#deploy-on-your-own`

/** This playground's own repository (the header's GitHub link). */
export const REPO_URL = "https://github.com/bohecola/readme-stats-playground"
