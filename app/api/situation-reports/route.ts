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
    return NextResponse.json([])
  }
}

export async function POST(req: Request) {
  try {
    const saved: SavedReport = await req.json()
    const existing = (await kv.get<SavedReport[]>(KEY)) ?? []
    await kv.set(KEY, [saved, ...existing.filter((r) => r.id !== saved.id)].slice(0, MAX))
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
