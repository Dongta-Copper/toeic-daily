// Signed session cookie, checked on the server (proxy.ts) for every page and API call.
// Uses Web Crypto so it works in the proxy runtime as well as in route handlers.

export const SESSION_COOKIE = 'ed_session'
export const USER_COOKIE = 'ed_user' // readable by the page, only used for display and local-cache separation
export const USER_HEADER = 'x-ed-user' // set by proxy.ts after verifying the session
export const SESSION_DAYS = 180

function secret(): string {
  // AUTH_SECRET if set; otherwise fall back to another server-only secret so the site keeps working.
  const s = process.env.AUTH_SECRET || process.env.KV_REST_API_TOKEN
  if (!s) throw new Error('AUTH_SECRET is not set')
  return s
}

async function hmac(data: string): Promise<string> {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret()), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data))
  return Array.from(new Uint8Array(sig), (b) => b.toString(16).padStart(2, '0')).join('')
}

function same(a: string, b: string) {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}

// ─── Accounts ─────────────────────────────────────────────────────────────────
// Owner:  APP_USERNAME / APP_PASSWORD (default Dongta). Keeps the original, unprefixed data.
// Others: APP_USERS = "minh:Password1, lan:Password2" — each gets a separate data space.

type Account = { name: string; password: string; owner: boolean }

function accounts(): Account[] {
  const list: Account[] = [{ name: process.env.APP_USERNAME || 'Dongta', password: process.env.APP_PASSWORD || '123456789', owner: true }]
  for (const entry of (process.env.APP_USERS ?? '').split(',')) {
    const i = entry.indexOf(':')
    if (i <= 0) continue
    const name = entry.slice(0, i).trim()
    const password = entry.slice(i + 1).trim()
    if (name && password && !list.some((a) => a.name.toLowerCase() === name.toLowerCase())) list.push({ name, password, owner: false })
  }
  return list
}

/** Returns the canonical user name if the credentials are valid. */
export function checkCredentials(username: string, password: string): string | null {
  const acc = accounts().find((a) => a.name.toLowerCase() === username.trim().toLowerCase())
  return acc && same(acc.password, password) ? acc.name : null
}

export function isOwner(user: string) {
  return accounts().find((a) => a.name === user)?.owner ?? false
}

// ─── Session token: "<user>.<expires>.<sig>" (older "<expires>.<sig>" tokens belong to the owner) ──

export async function createSession(user: string): Promise<string> {
  const expires = Date.now() + SESSION_DAYS * 86400000
  const u = encodeURIComponent(user)
  return `${u}.${expires}.${await hmac(`${u}.${expires}`)}`
}

/** Returns the user name of a valid session, otherwise null. */
export async function verifySession(token: string | undefined): Promise<string | null> {
  if (!token) return null
  const parts = token.split('.')
  if (parts.length === 2) {
    const [expires, sig] = parts
    if (Number(expires) < Date.now() || !same(sig, await hmac(expires))) return null
    return accounts()[0].name
  }
  if (parts.length !== 3) return null
  const [u, expires, sig] = parts
  if (Number(expires) < Date.now() || !same(sig, await hmac(`${u}.${expires}`))) return null
  const user = decodeURIComponent(u)
  // An account removed from APP_USERS loses access immediately.
  return accounts().some((a) => a.name === user) ? user : null
}

/** KV key for the signed-in user: the owner keeps the original keys, others get their own prefix. */
export function userKey(req: Request, key: string): string {
  const user = req.headers.get(USER_HEADER)
  if (!user) throw new Error('no user')
  return isOwner(user) ? key : `u:${user.toLowerCase()}:${key}`
}
