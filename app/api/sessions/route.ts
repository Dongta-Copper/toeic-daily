import { kv } from '@vercel/kv'
import { NextResponse } from 'next/server'
import { userKey } from '@/lib/session'
import type { Session } from '@/lib/history'

const KEY = 'toeic_sessions'

// GET returns 503 (not an empty list) when the store is unreachable, so the client knows not to trust it.
export async function GET(req: Request) {
  try {
    const sessions = (await kv.get<Session[]>(userKey(req, KEY))) ?? []
    return NextResponse.json(sessions)
  } catch {
    return NextResponse.json({ error: 'storage unavailable' }, { status: 503 })
  }
}

// Accepts one session or an array (used to upload sessions kept in the browser).
export async function POST(req: Request) {
  try {
    const body: Session | Session[] = await req.json()
    const incoming = Array.isArray(body) ? body : [body]
    const existing = (await kv.get<Session[]>(userKey(req, KEY))) ?? []
    const ids = new Set(existing.map((s) => s.id))
    const merged = [...incoming.filter((s) => !ids.has(s.id)), ...existing].sort((a, b) =>
      b.createdAt.localeCompare(a.createdAt)
    )
    await kv.set(userKey(req, KEY), merged)
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: false }, { status: 503 })
  }
}

export async function DELETE(req: Request) {
  try {
    await kv.del(userKey(req, KEY))
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: false }, { status: 503 })
  }
}
