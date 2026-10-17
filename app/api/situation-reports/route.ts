import { kv } from '@vercel/kv'
import { NextResponse } from 'next/server'
import type { SavedReport } from '@/lib/situation'

const KEY = 'situation_reports'
const MAX = 20

export async function GET() {
  try {
    const reports = (await kv.get<SavedReport[]>(KEY)) ?? []
    return NextResponse.json(reports)
  } catch {
    return NextResponse.json({ error: 'storage unavailable' }, { status: 503 })
  }
}

// Accepts one report or an array (used to upload reports kept in the browser).
export async function POST(req: Request) {
  try {
    const body: SavedReport | SavedReport[] = await req.json()
    const incoming = Array.isArray(body) ? body : [body]
    const existing = (await kv.get<SavedReport[]>(KEY)) ?? []
    const ids = new Set(incoming.map((r) => r.id))
    const merged = [...incoming, ...existing.filter((r) => !ids.has(r.id))]
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, MAX)
    await kv.set(KEY, merged)
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: false }, { status: 503 })
  }
}
