// Signed session cookie, checked on the server (proxy.ts) for every page and API call.
// Uses Web Crypto so it works in the proxy runtime as well as in route handlers.

export const SESSION_COOKIE = 'ed_session'
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

export async function createSession(): Promise<string> {
  const expires = Date.now() + SESSION_DAYS * 86400000
  return `${expires}.${await hmac(String(expires))}`
}

export async function verifySession(token: string | undefined): Promise<boolean> {
  if (!token) return false
  const [expires, sig] = token.split('.')
  if (!expires || !sig || Number(expires) < Date.now()) return false
  const expected = await hmac(expires)
  if (expected.length !== sig.length) return false
  let diff = 0
  for (let i = 0; i < sig.length; i++) diff |= sig.charCodeAt(i) ^ expected.charCodeAt(i)
  return diff === 0
}

export function checkCredentials(username: string, password: string): boolean {
  const user = process.env.APP_USERNAME || 'Dongta'
  // Until APP_PASSWORD is set in Vercel, the previous password keeps working.
  const pass = process.env.APP_PASSWORD || '123456789'
  return username.trim().toLowerCase() === user.toLowerCase() && password === pass
}
