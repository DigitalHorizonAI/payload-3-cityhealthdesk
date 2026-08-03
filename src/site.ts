/**
 * Site chrome data, in one place.
 *
 * cityhealthdesk.com has no public website yet — this CMS is the first thing
 * standing on the domain, so the nav and footer carry only destinations that
 * actually exist: the blog and its search. The full site will be served by
 * this same app later; when it lands, its nav and footer data go here and
 * the chrome grows with it — re-syncing is a diff of this file.
 */
export type NavLink = {
  label: string
  href: string
  note?: string
}

/**
 * Where the public site will live once it exists. The apex serves nothing
 * yet, so no chrome link may point at it — everything stays relative and
 * works on whichever host serves the app.
 */
export const SITE = 'https://cityhealthdesk.com'

export const LINKS = {
  blog: { label: 'Blog', href: '/blog' },

  search: { label: 'Search articles', href: '/search' },
} satisfies Record<string, NavLink>

/** The 3-column header: links left and right of the centered wordmark. */
export const NAV_LEFT: NavLink[] = [LINKS.blog]
export const NAV_RIGHT: NavLink[] = []

export const MOBILE_LINKS: NavLink[] = [LINKS.blog, LINKS.search]

/**
 * Footer copy. Placeholder until the site has its own brand voice — swap the
 * blurb when the full-site design lands.
 */
export const FOOTER_BLURB =
  'Clear, practical health information — researched, sourced and written to be useful.'

export const FOOTER_EXPLORE: NavLink[] = [
  { label: 'Journal', href: '/blog' },
  LINKS.search,
]
