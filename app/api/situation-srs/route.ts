import { kv } from '@vercel/kv'
import { NextResponse } from 'next/server'
import type { ReviewItem } from '@/lib/srs'

const KEY = 'situation_srs'

export async function GET() {
  try {
    const items = (await kv.get<ReviewItem[]>(KEY)) ?? []
    return NextResponse.json(items)
  } catch {
    return NextResponse.json({ error: 'storage unavailable' }, { status: 503 })
  }
}

// Accepts one item or an array; keeps the most recently updated version of each item.
export async function POST(req: Request) {
  try {
    const body: ReviewItem | ReviewItem[] = await req.json()
    const incoming = Array.isArray(body) ? body : [body]
    const byId = new Map(((await kv.get<ReviewItem[]>(KEY)) ?? []).map((it) => [it.id, it]))
    for (const it of incoming) {
      const prev = byId.get(it.id)
      if (!prev || it.updatedAt > prev.updatedAt) byId.set(it.id, it)
    }
    await kv.set(KEY, Array.from(byId.values()))
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: false }, { status: 503 })
  }
}
