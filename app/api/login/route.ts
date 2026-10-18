import { NextResponse } from 'next/server'
import { SESSION_COOKIE, SESSION_DAYS, checkCredentials, createSession } from '@/lib/session'

export async function POST(req: Request) {
  const { username, password }: { username?: string; password?: string } = await req.json().catch(() => ({}))
  if (!username || !password || !checkCredentials(username, password)) {
    // Small delay makes guessing slower.
    await new Promise((r) => setTimeout(r, 800))
    return NextResponse.json({ error: 'Tên đăng nhập hoặc mật khẩu không đúng.' }, { status: 401 })
  }
  const res = NextResponse.json({ ok: true })
  res.cookies.set(SESSION_COOKIE, await createSession(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_DAYS * 86400,
  })
  return res
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true })
  res.cookies.set(SESSION_COOKIE, '', { path: '/', maxAge: 0 })
  return res
}
