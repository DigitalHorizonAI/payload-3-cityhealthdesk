/**
 * Draws public/favicon.ico — the browser-tab icon for cityhealthdesk.com.
 *
 * The site had never had one of its own. The vanilla template shipped
 * Payload's mark; the port that branded this repo ("Bring in the blog CMS,
 * branded for City Health Desk") deleted that and overwrote favicon.ico with
 * the sister site's file, so every City Health Desk tab has been showing
 * 2ahealthylife's green "HEALTHY LIFE" rosette. The same badge sits in four
 * repos. This is the one place it does not belong: a different client, a
 * different palette, and a word that is not in this site's name.
 *
 * The mark is the wordmark's initial in the display face on the accent ground
 * — the same two things src/components/Logo/Logo.tsx and globals.css already
 * define. A single glyph is the only thing that survives 16px; the wordmark,
 * the arcs from the OG card and a two-letter monogram were all tried and all
 * turn to mush at that size.
 *
 * Run it by hand when the palette changes; the output is committed, so
 * nothing regenerates it at build time:
 *
 *   node ./scripts/generate-favicon.mjs
 *
 * ⚠️ The glyph is rendered by librsvg using whatever font the host resolves,
 * so this asks for Georgia — the same fallback --font-display declares in
 * globals.css, and the same trade-off generate-og-image.mjs documents. The
 * artifact is committed, so it only has to be right on the machine that
 * generates it, and a webfont here would not embed.
 */
import { writeFileSync, readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import sharp from 'sharp'

const OUT = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'favicon.ico')

// Straight off globals.css, converted from the HSL triplets Tailwind wraps.
const PAPER = '#F7FAFB' // --background 200 24% 98%
const ACCENT = '#1B6874' // --accent     188 62% 28%

/** The sizes Windows and every browser actually ask an .ico for. */
const SIZES = [16, 32, 48]

const tile = (n) => `<svg xmlns="http://www.w3.org/2000/svg" width="${n}" height="${n}">
  <rect width="${n}" height="${n}" fill="${ACCENT}"/>
  <text x="${n / 2}" y="${n * 0.785}" text-anchor="middle"
        font-family="Georgia, 'Times New Roman', serif"
        font-size="${n * 0.82}" fill="${PAPER}">C</text>
</svg>`

/**
 * An .ico is a 6-byte header, one 16-byte directory entry per image, then the
 * images. The payloads here are PNGs rather than DIBs, which every browser
 * since IE11 reads - and which the front-end's own assets/logo/mark-favicon.ico
 * already uses, so it is the shape this project ships elsewhere.
 */
const ico = (images) => {
  const header = Buffer.alloc(6)
  header.writeUInt16LE(0, 0) // reserved
  header.writeUInt16LE(1, 2) // 1 = icon
  header.writeUInt16LE(images.length, 4)

  const directory = Buffer.alloc(16 * images.length)
  let offset = header.length + directory.length

  images.forEach(({ size, data }, i) => {
    const o = i * 16
    directory[o] = size === 256 ? 0 : size // 0 means 256
    directory[o + 1] = size === 256 ? 0 : size
    directory[o + 2] = 0 // palette colours
    directory[o + 3] = 0 // reserved
    directory.writeUInt16LE(1, o + 4) // colour planes
    directory.writeUInt16LE(32, o + 6) // bits per pixel
    directory.writeUInt32LE(data.length, o + 8)
    directory.writeUInt32LE(offset, o + 12)
    offset += data.length
  })

  return Buffer.concat([header, directory, ...images.map((image) => image.data)])
}

const images = []
for (const size of SIZES) {
  // Rasterised AT the target size rather than downscaled from one big render:
  // a serif at 16px needs the hinting decisions made at 16px.
  images.push({ size, data: await sharp(Buffer.from(tile(size))).png().toBuffer() })
}

writeFileSync(OUT, ico(images))
console.log(`wrote ${OUT}`)

// --------------------------------------------------------------------------
// Read the file back the way a browser would, rather than trusting the write.
// --------------------------------------------------------------------------

const file = readFileSync(OUT)
const count = file.readUInt16LE(4)
let failures = 0
const check = (name, ok, detail = '') => {
  if (ok) return console.log(`  ok    ${name}`)
  failures++
  console.log(`  FAIL  ${name}${detail ? `\n        ${detail}` : ''}`)
}

check('it is an icon file', file.readUInt16LE(0) === 0 && file.readUInt16LE(2) === 1)
check(`it holds ${SIZES.length} images`, count === SIZES.length, `holds ${count}`)

for (let i = 0; i < count; i++) {
  const o = 6 + i * 16
  const declared = file[o] || 256
  const length = file.readUInt32LE(o + 8)
  const start = file.readUInt32LE(o + 12)
  const payload = file.subarray(start, start + length)
  const isPng = payload[0] === 0x89 && payload.subarray(1, 4).toString() === 'PNG'
  const meta = isPng ? await sharp(payload).metadata() : {}
  check(
    `entry ${i} is a ${declared}x${declared} PNG of that size`,
    isPng && meta.width === declared && meta.height === declared && declared === SIZES[i],
    `declared ${declared}, payload ${isPng ? `${meta.width}x${meta.height} png` : 'not a png'}`,
  )
}

// The badge this replaces. If it ever comes back through another port, say so
// here rather than on the live site.
check(
  'it is not the sister site’s badge',
  file.length !== 79310,
  'this is the byte length of the 2ahealthylife rosette',
)

console.log(`\n  ${(file.length / 1024).toFixed(1)} kB`)
if (failures) process.exit(1)
