import { kv } from '@vercel/kv'
import { NextResponse } from 'next/server'
import type { Attempt } from '@/lib/situation'

const KEY = 'situation_attempts'
const MAX = 2000

export async function GET() {
  try {
    const attempts = (await kv.get<Attempt[]>(KEY)) ?? []
    return NextResponse.json(attempts)
  } catch {
    return NextResponse.json({ error: 'storage unavailable' }, { status: 503 })
  }
}

// Accepts one attempt or an array (used to upload attempts kept in the browser).
export async function POST(req: Request) {
  try {
    const body: Attempt | Attempt[] = await req.json()
    const incoming = Array.isArray(body) ? body : [body]
    const existing = (await kv.get<Attempt[]>(KEY)) ?? []
    const ids = new Set(existing.map((a) => a.id))
    const merged = [...incoming.filter((a) => !ids.has(a.id)), ...existing]
      .sort((a, b) => b.at.localeCompare(a.at))
      .slice(0, MAX)
    await kv.set(KEY, merged)
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: false }, { status: 503 })
  }
}
