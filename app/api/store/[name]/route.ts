import { kv } from '@vercel/kv'
import { NextResponse } from 'next/server'

// Generic synced lists (see lib/store.ts). Only these names may be read or written.
const ALLOWED = new Set([
  'phrase_cards',
  'phrase_srs',
  'ielts_attempts',
  'ielts_generated',
  'gap_clusters',
  'gap_items',
  'gap_progress',
  'gap_processed',
])

type Item = { id: string; updatedAt: string }

export async function GET(_req: Request, { params }: { params: Promise<{ name: string }> }) {
  const { name } = await params
  if (!ALLOWED.has(name)) return NextResponse.json({ error: 'unknown store' }, { status: 404 })
  try {
    return NextResponse.json((await kv.get<Item[]>(name)) ?? [])
  } catch {
    return NextResponse.json({ error: 'storage unavailable' }, { status: 503 })
  }
}

// Accepts an array; keeps the most recently updated version of each item.
export async function POST(req: Request, { params }: { params: Promise<{ name: string }> }) {
  const { name } = await params
  if (!ALLOWED.has(name)) return NextResponse.json({ error: 'unknown store' }, { status: 404 })
  try {
    const incoming: Item[] = await req.json()
    const byId = new Map(((await kv.get<Item[]>(name)) ?? []).map((it) => [it.id, it]))
    for (const it of incoming) {
      const prev = byId.get(it.id)
      if (!prev || it.updatedAt > prev.updatedAt) byId.set(it.id, it)
    }
    await kv.set(name, Array.from(byId.values()))
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: false }, { status: 503 })
  }
}
