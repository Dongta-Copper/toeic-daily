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
    roundTrip = e instanceof Error ? e.message.slice(0, 300) : String(e)
  }

  return NextResponse.json({ envVarNames: vars, roundTrip })
}
