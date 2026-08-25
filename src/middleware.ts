import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

/**
 * This service serves the real site on cityhealthdesk.com AND a copy on the
 * generated Railway host. robots.txt already answers Disallow on non-public
 * hosts, but Disallow only blocks crawling — a linked URL can still be
 * indexed. This header is the index-blocking half, keyed on the same host
 * comparison as the robots route (www is a 308 to the apex, so only the apex
 * ever serves content).
 *
 * Unlike the robots route this deliberately fails OPEN (no header) when
 * NEXT_PUBLIC_SITE_URL is missing: this app serves production on the apex,
 * and failing closed would noindex the live site on a lost env var.
 */
const publicHost = (() => {
  try {
    return new URL(process.env.NEXT_PUBLIC_SITE_URL ?? '').host
  } catch {
    return null
  }
})()

export function middleware(request: NextRequest): NextResponse {
  const response = NextResponse.next()
  const host = request.headers.get('host')
  if (publicHost && host && host !== publicHost) {
    response.headers.set('X-Robots-Tag', 'noindex, nofollow')
  }
  return response
}

export const config = {
  // Frontend routes only; the admin UI ships its own noindex meta and the
  // API gains nothing from the header.
  matcher: ['/((?!api|admin|_next|media).*)'],
}
