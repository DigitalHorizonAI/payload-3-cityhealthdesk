/**
 * Draws public/og-default.webp — the social preview card.
 *
 * `src/utilities/site.ts` has advertised `/og-default.webp` on every page since
 * the site was built, and the file never existed. Scrapers skip a 404 silently,
 * which is why links shared in chat had no preview image at all.
 *
 * Run it by hand when the wordmark or palette changes; the output is committed,
 * so nothing regenerates it at build time:
 *
 *   node ./scripts/generate-og-image.mjs
 *
 * ⚠️ The text is rendered by librsvg using whatever font the host resolves, so
 * this asks for Georgia — the same fallback `--font-display` declares in
 * globals.css. That is deliberate: the artifact is committed, so it only has to
 * be right on the machine that generates it, and a webfont here would not embed.
 */
import { writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import sharp from 'sharp'

const OUT = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'og-default.webp')

// Straight off globals.css, converted from the HSL triplets Tailwind wraps.
const PAPER = '#F7FAFB'
const INK = '#1A252B'
const MUTED = '#5E6B72'
const ACCENT = '#1B6874'
const RULE = '#DCE3E6'

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
      <path d="M40 0H0v40" fill="none" stroke="${RULE}" stroke-width="1"/>
    </pattern>
  </defs>

  <rect width="1200" height="630" fill="${PAPER}"/>
  <rect width="1200" height="630" fill="url(#grid)"/>

  <!-- The same concentric arcs the article covers use, anchored bottom right. -->
  <g fill="none" stroke="${ACCENT}" stroke-opacity="0.22" stroke-width="10" stroke-linecap="round">
    <path d="M1200 630a170 170 0 0 0-170-170"/>
    <path d="M1200 630a290 290 0 0 0-290-290"/>
    <path d="M1200 630a410 410 0 0 0-410-410"/>
    <path d="M1200 630a530 530 0 0 0-530-530"/>
  </g>

  <rect x="90" y="150" width="86" height="8" fill="${ACCENT}"/>

  <text x="90" y="235" font-family="Georgia, 'Times New Roman', serif" font-size="72" fill="${INK}" letter-spacing="5">CITYHEALTHDESK</text>

  <text x="92" y="300" font-family="Segoe UI, Helvetica, Arial, sans-serif" font-size="30" fill="${MUTED}">Clear, practical health guides and resources.</text>

  <text x="92" y="500" font-family="Segoe UI, Helvetica, Arial, sans-serif" font-size="24" fill="${ACCENT}" letter-spacing="4">EVERYDAY HEALTH, SORTED</text>

  <rect x="0" y="614" width="1200" height="16" fill="${ACCENT}"/>
</svg>`

const buffer = await sharp(Buffer.from(svg)).webp({ quality: 90 }).toBuffer()
writeFileSync(OUT, buffer)

const meta = await sharp(buffer).metadata()
console.log(`wrote ${OUT}`)
console.log(`  ${meta.width}×${meta.height} ${meta.format}, ${(buffer.length / 1024).toFixed(1)} kB`)

// Open Graph wants 1200×630; anything else and the crop is out of our hands.
if (meta.width !== 1200 || meta.height !== 630) {
  console.error('✗ wrong dimensions for an Open Graph card')
  process.exit(1)
}
