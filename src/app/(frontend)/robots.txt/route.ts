import { getPublicSiteURL } from '@/utilities/getURL'

/**
 * Only the public origin (NEXT_PUBLIC_SITE_URL) may be indexed. Today the
 * CMS host IS the public origin, so it answers Allow; if the app ever gains
 * a second hostname (the apex, once the full site launches there), the
 * non-public one answers Disallow, or the two copies compete in search.
 *
 * A route handler rather than Next's robots.ts convention, because the answer
 * depends on which host asked and so must be produced per request.
 */
export const dynamic = 'force-dynamic'

export function GET(req: Request): Response {
  const siteURL = getPublicSiteURL()
  const host = req.headers.get('host') ?? ''

  let publicHost = ''
  try {
    publicHost = new URL(siteURL).host
  } catch {
    publicHost = ''
  }

  const isPublicSite = !publicHost || !host || host === publicHost

  const body = isPublicSite
    ? `User-agent: *
Allow: /
Disallow: /admin
Disallow: /api
Disallow: /next

Sitemap: ${siteURL}/sitemap.xml
`
    : `User-agent: *
Disallow: /
`

  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' },
  })
}
