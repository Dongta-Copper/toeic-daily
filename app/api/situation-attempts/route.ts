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
    return NextResponse.json([])
  }
}

export async function POST(req: Request) {
  try {
    const attempt: Attempt = await req.json()
    const existing = (await kv.get<Attempt[]>(KEY)) ?? []
    await kv.set(KEY, [attempt, ...existing].slice(0, MAX))
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
