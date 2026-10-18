import { NextResponse, type NextRequest } from 'next/server'
import { SESSION_COOKIE, verifySession } from '@/lib/session'

// Everything (pages, API, data files) requires a valid session, except the login flow
// and the few files a phone needs to install the site as an app.
const PUBLIC = [/^\/login$/, /^\/api\/login$/, /^\/manifest\.webmanifest$/, /^\/app-icon\//, /^\/favicon\.ico$/]

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl
  if (PUBLIC.some((re) => re.test(pathname))) return NextResponse.next()

  if (await verifySession(request.cookies.get(SESSION_COOKIE)?.value)) return NextResponse.next()

  if (pathname.startsWith('/api/')) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const url = new URL('/login', request.url)
  if (pathname !== '/') url.searchParams.set('next', pathname + search)
  return NextResponse.redirect(url)
}

export const config = {
  matcher: ['/((?!_next/static|_next/image).*)'],
}
