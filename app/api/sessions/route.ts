import { kv } from '@vercel/kv'
import { NextResponse } from 'next/server'
import type { Session } from '@/lib/history'

const KEY = 'toeic_sessions'

export async function GET() {
  try {
    const sessions = (await kv.get<Session[]>(KEY)) ?? []
    return NextResponse.json(sessions)
  } catch {
    return NextResponse.json([])
  }
}

export async function POST(req: Request) {
  try {
    const session: Session = await req.json()
    const existing = (await kv.get<Session[]>(KEY)) ?? []
    await kv.set(KEY, [session, ...existing])
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}

export async function DELETE() {
  try {
    await kv.del(KEY)
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
