const redirects = async () => {
  const internetExplorerRedirect = {
    destination: '/ie-incompatible.html',
    has: [
      {
        type: 'header',
        key: 'user-agent',
        value: '(.*Trident.*)', // all ie browsers
      },
    ],
    permanent: false,
    source: '/:path((?!ie-incompatible.html$).*)', // all pages except the incompatibility page
  }

  /**
   * The apex is canonical, so www sends visitors and crawlers there.
   *
   * Both hostnames are custom domains on the same Railway service, so without
   * this they serve byte-identical 200s and compete with each other in search.
   * It also has to exist before NEXT_PUBLIC_SITE_URL moves to the apex: at that
   * moment www stops being the public origin, so robots.txt starts answering
   * `Disallow: /` on a host that is still serving the real site.
   *
   * Matched on the literal hostname rather than "anything that is not the
   * public origin", deliberately. The generated *.up.railway.app host is how
   * this service is reached if the domain ever breaks again, and a catch-all
   * would 301 that away too.
   */
  const wwwToApex = {
    destination: 'https://cityhealthdesk.com/:path*',
    has: [{ type: 'host', value: 'www.cityhealthdesk.com' }],
    permanent: true,
    source: '/:path*',
  }

  const redirects = [internetExplorerRedirect, wwwToApex]

  return redirects
}

export default redirects
