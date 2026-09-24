/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Default github-readme-stats instance shown in the base-URL field. */
  readonly VITE_DEFAULT_BASE_URL?: string
  /** Username pre-filled on first visit. */
  readonly VITE_DEFAULT_USERNAME?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
