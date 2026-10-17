import { kv } from '@vercel/kv'
import { NextResponse } from 'next/server'

// Diagnostics: which storage env vars exist (names only, never values) and whether a round-trip works.
export async function GET() {
  const vars = Object.keys(process.env)
    .filter((k) => /KV|REDIS|UPSTASH/i.test(k))
    .sort()

  let roundTrip = 'ok'
  try {
    await kv.set('storage_health_check', Date.now())
    await kv.get('storage_health_check')
  } catch (e) {
    const cause = e instanceof Error && e.cause instanceof Error ? ` (${(e.cause as NodeJS.ErrnoException).code ?? e.cause.message})` : ''
    roundTrip = (e instanceof Error ? e.message.slice(0, 300) : String(e)) + cause
  }

  // Is the database host reachable at all? (an Upstash host that no longer exists fails DNS)
  let host = 'unknown'
  try {
    const url = new URL(process.env.KV_REST_API_URL ?? '')
    const res = await fetch(url.origin, { signal: AbortSignal.timeout(8000) })
    host = `reachable (HTTP ${res.status})`
  } catch (e) {
    const cause = e instanceof Error && e.cause instanceof Error ? (e.cause as NodeJS.ErrnoException).code ?? e.cause.message : ''
    host = `unreachable: ${e instanceof Error ? e.message : String(e)} ${cause}`.trim()
  }

  return NextResponse.json({ envVarNames: vars, roundTrip, host })
}
