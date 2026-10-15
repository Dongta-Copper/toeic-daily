import { kv } from '@vercel/kv'
import { NextResponse } from 'next/server'
import type { DayProgress, ProgressMap } from '@/lib/situation'

const KEY = 'situation_progress'

export async function GET() {
  try {
    const progress = (await kv.get<ProgressMap>(KEY)) ?? {}
    return NextResponse.json(progress)
  } catch {
    return NextResponse.json({})
  }
}

export async function POST(req: Request) {
  try {
    const entry: DayProgress = await req.json()
    const existing = (await kv.get<ProgressMap>(KEY)) ?? {}
    await kv.set(KEY, { ...existing, [entry.day]: entry })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
