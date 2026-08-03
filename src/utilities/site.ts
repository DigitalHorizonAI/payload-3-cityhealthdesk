/**
 * Site identity, in one place.
 *
 * The template hardcoded its name across page titles, Open Graph defaults and
 * the SEO plugin, so renaming meant editing every one of them. Anything that
 * needs the site's name or description reads it from here instead.
 */
export const SITE = {
  name: 'City Health Desk',
  description: 'City Health Desk — clear, practical health guides and resources.',
  /**
   * Path to the default social sharing image, relative to the public origin.
   * No such asset exists yet — the site has no brand imagery until the
   * full-site design lands. Scrapers skip a 404 image; nothing breaks.
   */
  defaultOGImage: '/og-default.webp',
} as const
