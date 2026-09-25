/**
 * Deployment-level defaults, set via env vars at build time (see .env.example).
 * Falls back to the public github-readme-stats instance and an empty username.
 */
export const DEFAULT_BASE_URL =
  import.meta.env.VITE_DEFAULT_BASE_URL?.trim().replace(/\/+$/, "") ||
  "https://github-readme-stats.vercel.app"

export const DEFAULT_USERNAME = import.meta.env.VITE_DEFAULT_USERNAME?.trim() ?? ""

export const UPSTREAM_REPO_URL = "https://github.com/anuraghazra/github-readme-stats"

/** This playground's own repository (the header's GitHub link). */
export const REPO_URL = "https://github.com/bohecola/readme-stats-playground"
