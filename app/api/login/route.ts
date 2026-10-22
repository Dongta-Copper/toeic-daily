import { NextResponse } from 'next/server'
import { SESSION_COOKIE, SESSION_DAYS, USER_COOKIE, checkCredentials, createSession } from '@/lib/session'

export async function POST(req: Request) {
  const { username, password }: { username?: string; password?: string } = await req.json().catch(() => ({}))
  const user = username && password ? checkCredentials(username, password) : null
  if (!user) {
    // Small delay makes guessing slower.
    await new Promise((r) => setTimeout(r, 800))
    return NextResponse.json({ error: 'Tên đăng nhập hoặc mật khẩu không đúng.' }, { status: 401 })
  }
  const res = NextResponse.json({ ok: true, user })
  const opts = { secure: process.env.NODE_ENV === 'production', sameSite: 'lax' as const, path: '/', maxAge: SESSION_DAYS * 86400 }
  res.cookies.set(SESSION_COOKIE, await createSession(user), { ...opts, httpOnly: true })
  res.cookies.set(USER_COOKIE, encodeURIComponent(user), opts)
  return res
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true })
  res.cookies.set(SESSION_COOKIE, '', { path: '/', maxAge: 0 })
  res.cookies.set(USER_COOKIE, '', { path: '/', maxAge: 0 })
  return res
}
