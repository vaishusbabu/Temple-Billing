const STORAGE_KEY = "templeBilling.auth.v1"

export function readStoredAuth() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { token: null, user: null }
    const parsed = JSON.parse(raw)
    return { token: parsed?.token ?? null, user: parsed?.user ?? null }
  } catch {
    return { token: null, user: null }
  }
}

export function writeStoredAuth(token, user) {
  try {
    if (!token) {
      localStorage.removeItem(STORAGE_KEY)
      return
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ token, user }))
  } catch {
    // ignore
  }
}

