/**
 * localStorage that never throws: Safari with cookies blocked, sandboxed
 * iframes and some private modes raise on access. Everything stored is a
 * convenience, so a failed read is "nothing saved" and a failed write is ignored.
 */
export function readStorage(key: string): string | null {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

export function writeStorage(key: string, value: string) {
  try {
    localStorage.setItem(key, value)
  } catch {
    // Nothing to do: the app works without persistence.
  }
}

export function readJson<T>(key: string): T | null {
  const raw = readStorage(key)
  if (raw === null) return null
  try {
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}
