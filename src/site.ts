/**
 * Site chrome data, in one place.
 *
 * The full site now lives in this app: a storefront at `/` and `/shop`
 * alongside the journal. The nav and footer below grew with it, as this file
 * always said they would — re-syncing the chrome is still a diff of this file.
 *
 * The catalogue itself is in src/shop.ts; only the links live here.
 */
import { CATEGORIES } from './shop'

export type NavLink = {
  label: string
  href: string
  note?: string
}

/**
 * Where the public site lives. Nothing in the chrome may point at it
 * absolutely — every link stays relative so it works on whichever host serves
 * the app, which today is still the railway.app hostname while the apex DNS
 * record is outstanding.
 */
export const SITE = 'https://cityhealthdesk.com'

export const LINKS = {
  shop: { label: 'Shop', href: '/shop' },
  blog: { label: 'Journal', href: '/blog' },
  search: { label: 'Search articles', href: '/search' },
} satisfies Record<string, NavLink>

/** The 3-column header: links left and right of the centered wordmark. */
export const NAV_LEFT: NavLink[] = [LINKS.shop]
export const NAV_RIGHT: NavLink[] = [LINKS.blog]

export const MOBILE_LINKS: NavLink[] = [
  LINKS.shop,
  ...CATEGORIES.map((category) => ({
    label: category.name,
    href: `/shop/${category.slug}`,
  })),
  LINKS.blog,
  LINKS.search,
]

export const FOOTER_BLURB =
  'Everyday health essentials, and clear practical guides on choosing and using them — researched, sourced and written to be useful.'

export const FOOTER_EXPLORE: NavLink[] = [
  LINKS.shop,
  ...CATEGORIES.map((category) => ({
    label: category.name,
    href: `/shop/${category.slug}`,
  })),
  LINKS.blog,
  LINKS.search,
]
