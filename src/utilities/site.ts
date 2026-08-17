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
   *
   * This said "no such asset exists yet" for weeks while every page advertised
   * the path regardless, so every link shared of this site came through with no
   * preview card — scrapers skip a 404 image silently. The file now exists:
   * `scripts/generate-og-image.mjs` draws it and the output is committed.
   * `pnpm check:covers` fails if any advertised image goes missing again.
   */
  defaultOGImage: '/og-default.webp',
} as const
