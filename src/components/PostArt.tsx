import React from 'react'

/**
 * Stand-in cover art for an article that has no image of its own.
 *
 * ## Why this exists
 *
 * `Card` renders a 4:3 panel and fills it only when `meta.image` is set. The SEO
 * content tool publishes over the API with `title` and `content` and uploads no
 * media, so without this every article it writes renders an empty grey box. The
 * blog is empty today, which is the only reason nobody has seen it yet.
 *
 * ## Why it is abstract
 *
 * `ProductArt` draws a recognisable object because a product *is* one. An
 * article is not, and a product glyph on an article about sleep would be a
 * wrong picture rather than a neutral one. So this is texture: a tinted ground,
 * the same hairline grid the product panels use, and one piece of geometry.
 *
 * ## Why it varies
 *
 * ⚠️ The first version of `ProductArt` keyed its glyph off the category and
 * rendered three identical tiles in a row, which reads as a broken image rather
 * than a deliberate one (see the note in that file). A single static fallback
 * here would reproduce exactly that on `/blog`. Hue and composition are both
 * derived from the slug, giving 5 × 4 combinations — enough that a page of
 * cards does not repeat itself.
 *
 * Any single post overrides this simply by having a `meta.image`; nothing here
 * needs changing when real artwork arrives.
 */

/**
 * Deterministic, stable across server and client renders. djb2 — it only has to
 * scatter short slugs across 20 buckets, not resist anything.
 */
const hash = (slug: string): number => {
  let h = 5381
  for (let i = 0; i < slug.length; i++) h = ((h << 5) + h + slug.charCodeAt(i)) >>> 0
  return h
}

/**
 * Deliberately all cool and close together. The site's palette is a health
 * counter, not a magazine — a rainbow of covers would fight it. These sit
 * around the teal accent (188) rather than spanning the wheel.
 */
const HUES = [188, 200, 168, 212, 152]

/** Four compositions on a 120×90 field. Pure geometry; stroke is set on the <g>. */
const FIGURES: React.ReactNode[] = [
  // Concentric arcs rising from the lower left.
  <>
    <path d="M0 90a30 30 0 0 1 30-30" />
    <path d="M0 90a54 54 0 0 1 54-54" />
    <path d="M0 90a78 78 0 0 1 78-78" />
    <path d="M0 90a102 102 0 0 1 102-102" />
  </>,
  // A stepped field, like a measurement read off a chart.
  <>
    <path d="M14 74V54" />
    <path d="M32 74V38" />
    <path d="M50 74V60" />
    <path d="M68 74V28" />
    <path d="M86 74V48" />
    <path d="M104 74V34" />
    <path d="M6 74h108" />
  </>,
  // Layered curves.
  <>
    <path d="M-4 40c20-14 40 14 60 0s40-14 68 0" />
    <path d="M-4 56c20-14 40 14 60 0s40-14 68 0" />
    <path d="M-4 72c20-14 40 14 60 0s40-14 68 0" />
  </>,
  // A measured cross-section: one emphasised rule through a light frame.
  <>
    <path d="M18 18h84v54H18z" />
    <path d="M18 45h84" />
    <path d="M45 18v54" />
    <path d="M75 18v54" />
  </>,
]

export const PostArt = ({ slug, className }: { slug: string; className?: string }) => {
  const h = hash(slug || 'untitled')

  /**
   * ⚠️ Both indices are `unsigned % length`, deliberately. The first version
   * picked the figure with `(h >> 3) % FIGURES.length`, and `>>` is a SIGNED
   * shift — `hash` returns an unsigned 32-bit value, so any slug hashing above
   * 2^31 made the shift negative, `FIGURES[-2]` was `undefined`, and the panel
   * rendered an empty tinted box. About half of all slugs. That is precisely
   * the defect this component exists to prevent, and it shipped inside the fix.
   * `>>>` is the unsigned shift and cannot go negative, so both results are in
   * range by construction. The high bytes are used because djb2's low bits
   * barely move between similar slugs — over 16 realistic article slugs,
   * deriving the figure from the low end put 7 of 16 on one drawing, while
   * `>>> 8` spreads them 4/5/5/2.
   */
  const hueIndex = h % HUES.length
  const figureIndex = (h >>> 8) % FIGURES.length

  const hue = HUES[hueIndex]
  const figure = FIGURES[figureIndex] ?? FIGURES[0]

  // 94% was near-white, so an article card read as a blank rectangle on a 98%
  // page. 88% is six points clear of --background and check-article-covers.mjs
  // asserts it. This is the ground behind every card on /blog — the page the
  // client linked when he said the site was empty — so it is the colour he sees
  // there the day articles land. Ink stays dark: see the note in ProductArt.
  const ground = `hsl(${hue} 30% 88%)`
  const ink = `hsl(${hue} 40% 32%)`
  const rule = `hsl(${hue} 24% 80%)`
  // Unique per hue/figure pair, which is all that can collide on one page.
  const gridId = `post-grid-${hueIndex}-${figureIndex}`

  return (
    <svg
      viewBox="0 0 120 90"
      className={className}
      // Decorative: the article title is always adjacent as real text, so a
      // description here would be announced twice.
      aria-hidden="true"
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <pattern id={gridId} width="8" height="8" patternUnits="userSpaceOnUse">
          <path d="M8 0H0v8" fill="none" stroke={rule} strokeWidth={0.5} />
        </pattern>
      </defs>
      <rect width="120" height="90" fill={ground} />
      <rect width="120" height="90" fill={`url(#${gridId})`} />
      <g fill="none" stroke={ink} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        {figure}
      </g>
    </svg>
  )
}

export default PostArt
