import { NextResponse, type NextRequest } from 'next/server'
import { SESSION_COOKIE, SESSION_DAYS, USER_COOKIE, USER_HEADER, verifySession } from '@/lib/session'

// Everything (pages, API, data files) requires a valid session, except the login flow
// and the few files a phone needs to install the site as an app.
const PUBLIC = [/^\/login$/, /^\/api\/login$/, /^\/manifest\.webmanifest$/, /^\/app-icon\//, /^\/favicon\.ico$/]

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl
  // Never trust a user header sent by the browser.
  const headers = new Headers(request.headers)
  headers.delete(USER_HEADER)

  if (PUBLIC.some((re) => re.test(pathname))) return NextResponse.next({ request: { headers } })

  const user = await verifySession(request.cookies.get(SESSION_COOKIE)?.value)
  if (user) {
    headers.set(USER_HEADER, user)
    const res = NextResponse.next({ request: { headers } })
    // Sessions created before multi-account support have no display cookie yet.
    if (request.cookies.get(USER_COOKIE)?.value !== encodeURIComponent(user)) {
      res.cookies.set(USER_COOKIE, encodeURIComponent(user), {
        path: '/',
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        maxAge: SESSION_DAYS * 86400,
      })
    }
    return res
  }

  if (pathname.startsWith('/api/')) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const url = new URL('/login', request.url)
  if (pathname !== '/') url.searchParams.set('next', pathname + search)
  return NextResponse.redirect(url)
}

export const config = {
  matcher: ['/((?!_next/static|_next/image).*)'],
}
