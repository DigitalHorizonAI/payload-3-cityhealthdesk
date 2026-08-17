/**
 * Downloads the site's photography into public/photos/.
 *
 *   node ./scripts/fetch-photos.mjs
 *
 * ## Why a script rather than files dropped in a folder
 *
 * The output is committed and nothing regenerates it at build time — the same
 * arrangement `generate-og-image.mjs` uses, and for the same reason: a build
 * must not depend on a third-party CDN being up. So this runs by hand, when the
 * imagery changes.
 *
 * What it buys over dragging files in is the PHOTOS table below. Every asset on
 * a client's live site can be traced to where it came from, who took it and
 * under what licence, without anybody having to remember. Replacing a photo is
 * an edit here plus a re-run, not an archaeology exercise.
 *
 * ## Licence
 *
 * Everything here is from Pexels, under the Pexels licence: free for commercial
 * use, **no attribution required**, may be modified. Two limits that matter and
 * are respected below — the photos are not resold as stock, and they are not
 * used in a way that implies the people in them endorse anything. The hero is
 * decorative context beside a headline, not a testimonial next to a product.
 * ⚠️ `scripts/check-storefront.mjs` exists partly to stop invented consumer
 * endorsements; do not undermine it by moving a photo of a person onto a
 * product page.
 *
 * ## Why the size cap is an assertion
 *
 * A listing page on a sister site once shipped at 8MB of images and had to be
 * cut to 0.7MB after the fact. A photograph is the easiest thing in a codebase
 * to make accidentally enormous, and nothing else in the repo would notice. So
 * this fails rather than warns.
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import sharp from 'sharp'

const OUT = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'photos')

/** Anything over this is a mistake, not a judgement call. */
const MAX_BYTES = 200 * 1024

const PHOTOS = [
  {
    file: 'hero-home-health.webp',
    /**
     * The hero's right column, replacing an abstract SVG bar chart that was
     * standing in for imagery the site did not have. Chosen off a contact sheet
     * of six: this one carries the palette rather than fighting it — the
     * sweater sits almost exactly on `--accent` (188 62% 28%) — and its subject
     * is what the catalogue is actually about. White-on-white still lifes were
     * rejected outright: the client's complaint was that the site read pure
     * white, and a white photograph would have answered it with more white.
     */
    source: 'https://images.pexels.com/photos/5790818/pexels-photo-5790818.jpeg',
    credit: 'Vlada Karpovich (Pexels)',
    // The container is `aspect-[4/3]`, roughly 570 CSS px wide at the widest
    // breakpoint, so 1400 covers a 2× display with nothing to spare wasted.
    width: 1400,
    height: 1050,
  },
]

mkdirSync(OUT, { recursive: true })

let failures = 0

for (const photo of PHOTOS) {
  // `w` is the CDN's own resize — downloading a 6000px original to throw most
  // of it away is slower and no sharper once sharp has finished.
  const url = `${photo.source}?auto=compress&cs=tinysrgb&w=${photo.width * 2}`
  const res = await fetch(url)

  if (!res.ok) {
    console.error(`✗ ${photo.file}: HTTP ${res.status} from ${photo.source}`)
    failures++
    continue
  }

  const buffer = await sharp(Buffer.from(await res.arrayBuffer()))
    .resize(photo.width, photo.height, { fit: 'cover', position: 'centre' })
    .webp({ quality: 78 })
    .toBuffer()

  writeFileSync(resolve(OUT, photo.file), buffer)

  const kb = (buffer.length / 1024).toFixed(1)
  const over = buffer.length > MAX_BYTES

  console.log(
    `${over ? '✗' : '✓'} ${photo.file}  ${photo.width}×${photo.height}  ${kb} kB  — ${photo.credit}`,
  )

  if (over) {
    console.error(`  over the ${MAX_BYTES / 1024} kB budget. Lower the quality or the dimensions.`)
    failures++
  }
}

if (failures) {
  console.error(`\n${failures} failed`)
  process.exit(1)
}

console.log(`\n${PHOTOS.length} written to public/photos/`)
