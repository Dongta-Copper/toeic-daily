import { kv } from '@vercel/kv'
import { NextResponse } from 'next/server'
import { userKey } from '@/lib/session'
import type { DayProgress, ProgressMap } from '@/lib/situation'

const KEY = 'situation_progress'

export async function GET(req: Request) {
  try {
    const progress = (await kv.get<ProgressMap>(userKey(req, KEY))) ?? {}
    return NextResponse.json(progress)
  } catch {
    return NextResponse.json({ error: 'storage unavailable' }, { status: 503 })
  }
}

// Accepts one day entry or an array (used to upload progress kept in the browser).
export async function POST(req: Request) {
  try {
    const body: DayProgress | DayProgress[] = await req.json()
    const incoming = Array.isArray(body) ? body : [body]
    const existing = (await kv.get<ProgressMap>(userKey(req, KEY))) ?? {}
    for (const entry of incoming) existing[entry.day] = entry
    await kv.set(userKey(req, KEY), existing)
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: false }, { status: 503 })
  }
}
