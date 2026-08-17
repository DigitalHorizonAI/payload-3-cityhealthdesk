import React from 'react'

import type { ArtToken, CategorySlug } from '@/shop'

/**
 * Stand-in product imagery, drawn rather than photographed.
 *
 * There is no licensed photography for this catalogue, and the sister site's
 * photos belong to different products — copying them would put the same assets
 * on two of the client's sites and tie the two together visually. So each
 * product gets a generated panel: a line glyph on a tinted ground.
 *
 * ⚠️ The glyph is chosen per PRODUCT, not per category. The first version keyed
 * it off the category and the related-products strip rendered three identical
 * tiles side by side, which reads as a broken image rather than a deliberate
 * one. The tint still comes from the category, so a category reads as a family.
 *
 * Deliberately abstract rather than a fake photograph. Swap this component for
 * real images when the client supplies them — every caller passes the same
 * three props, so nothing else changes.
 */

/**
 * Base hue per category, so a category reads as a family at a glance.
 * Exported because the homepage tints its category cards with the same values —
 * a category must not be one colour in the shop and another on the front page.
 */
export const HUES: Record<CategorySlug, number> = {
  'home-monitoring': 196,
  'first-aid': 8,
  'daily-living': 264,
  'personal-care': 158,
}

/**
 * The whole painted surface of a category card — fill, rule, and the two ink
 * weights that sit on it.
 *
 * ## Why the card is dark
 *
 * It was a pale tint with dark text, and it did not work: `hsl(h 34% 96%)` on a
 * 98% page is two points of lightness, and the client's verdict on the live site
 * was that there was no colour on it at all. The obvious repair — deepen the
 * tint — has a hard ceiling, because the tagline rendered in
 * `--muted-foreground` measures 4.77:1 against the old fill and drops to about
 * 4.25:1 by 90%. Under AA. So pale-with-dark-text could be visible or it could
 * be accessible, not both.
 *
 * Going past the midpoint removes the trade instead of optimising inside it.
 * At 26% lightness with near-white ink the worst pairing across all four hues is
 * about 5.8:1, so contrast stops constraining the design and the colour can be
 * as loud as it needs to be. Chosen off a rendered swatch of three depths rather
 * than from a number: 38% was measured at 3.48:1 and rejected, 18% read as four
 * dark rectangles rather than four colours.
 *
 * ⚠️ `bar` LIGHTENS. It was a dark rule for contrast against a pale tint; on a
 * dark card the same value is invisible. Anything added here has to pick its
 * side of the fill deliberately.
 *
 * `scripts/check-article-covers.mjs` reads this function and asserts both
 * properties — separation from the page, and AA for both inks — per hue.
 */
export const categorySurface = (hue: number) => ({
  background: `hsl(${hue} 45% 26%)`,
  borderColor: `hsl(${hue} 50% 20%)`,
  bar: `hsl(${hue} 55% 62%)`,
  heading: `hsl(${hue} 30% 97%)`,
  body: `hsl(${hue} 20% 88%)`,
})

/**
 * One line drawing per product, on a 92×92 field. Stroke colour, width and
 * linecaps are set once on the wrapping <g>, so a glyph is pure geometry.
 */
const GLYPHS: Record<ArtToken, React.ReactNode> = {
  pulse: <path d="M8 50h18l8-20 11 40 9-27 7 7h23" />,
  thermometer: (
    <>
      <path d="M40 20a6 6 0 0 1 12 0v32a12 12 0 1 1-12 0z" />
      <path d="M46 38v18" />
    </>
  ),
  sensor: (
    <>
      <path d="M30 26h32a6 6 0 0 1 6 6v28a6 6 0 0 1-6 6H30a6 6 0 0 1-6-6V32a6 6 0 0 1 6-6z" />
      <path d="M46 40v12M40 46h12" />
    </>
  ),
  scale: (
    <>
      <path d="M20 24h52v44H20z" />
      <path d="M34 40h24" />
      <path d="M46 40v14" />
    </>
  ),
  kit: (
    <>
      <path d="M16 34h60v40H16z" />
      <path d="M36 34V24h20v10" />
      <path d="M46 44v20M36 54h20" />
    </>
  ),
  plaster: (
    <>
      <path d="M28 40a12 12 0 0 1 17-17l24 24a12 12 0 0 1-17 17z" />
      <path d="M40 44h.01M52 48h.01M44 54h.01M50 38h.01" />
    </>
  ),
  spray: (
    <>
      <path d="M36 34h20v40H36z" />
      <path d="M40 34V22h12v12" />
      <path d="M62 22h8M62 30h6M62 14h6" />
    </>
  ),
  compress: (
    <>
      <path d="M18 32h56v32H18z" />
      <path d="M26 48c6-6 12 6 18 0s12 6 18 0" />
    </>
  ),
  pills: (
    <>
      <path d="M18 34h30v28H18z" />
      <path d="M33 34v28" />
      <path d="M54 48a11 11 0 1 1 22 0 11 11 0 0 1-22 0z" />
      <path d="M57 41l16 14" />
    </>
  ),
  cane: (
    <>
      <path d="M40 74V38a14 14 0 0 1 28 0" />
      <path d="M32 74h16" />
    </>
  ),
  jar: (
    <>
      <path d="M28 34h36v40H28z" />
      <path d="M32 22h28v12H32z" />
      <path d="M36 48h20" />
    </>
  ),
  brush: (
    <>
      <path d="M20 46h34v10H20z" />
      <path d="M54 48h20a4 4 0 0 1 0 6H54z" />
      <path d="M26 46v-8M34 46v-8M42 46v-8" />
    </>
  ),
  tube: (
    <>
      <path d="M32 34h28v40H32z" />
      <path d="M38 34V24h16v10" />
      <path d="M42 18h8" />
    </>
  ),
  sock: (
    <>
      <path d="M36 18h18v30l14 14a10 10 0 0 1-14 14L36 62z" />
      <path d="M36 30h18" />
    </>
  ),
}

export const ProductArt = ({
  art,
  category,
  className,
}: {
  art: ArtToken
  category: CategorySlug
  className?: string
}) => {
  const hue = HUES[category]
  // 94% was near-white and read as an empty tile on a near-white page; 88% is
  // six points clear of --background, which check-article-covers.mjs asserts.
  // ⚠️ Deliberately NOT taken as dark as the category cards. A thin line glyph
  // on a dark ground reads as a broken image, which is the exact failure this
  // component exists to avoid — so the ground moves and the ink stays dark.
  const ground = `hsl(${hue} 34% 88%)`
  const ink = `hsl(${hue} 44% 30%)`
  const rule = `hsl(${hue} 26% 80%)`
  const gridId = `grid-${art}`

  return (
    <svg
      viewBox="0 0 92 92"
      className={className}
      // Decorative: the product name is always adjacent as real text, so a
      // description here would be announced twice.
      aria-hidden="true"
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <pattern id={gridId} width="8" height="8" patternUnits="userSpaceOnUse">
          <path d="M8 0H0v8" fill="none" stroke={rule} strokeWidth={0.5} />
        </pattern>
      </defs>
      <rect width="92" height="92" fill={ground} />
      <rect width="92" height="92" fill={`url(#${gridId})`} />
      <g
        fill="none"
        stroke={ink}
        strokeWidth={3}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {GLYPHS[art]}
      </g>
    </svg>
  )
}

export default ProductArt
