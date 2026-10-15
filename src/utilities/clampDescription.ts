/**
 * A meta description cut to fit search results.
 *
 * Crawlers flag descriptions over 160 characters and search engines cut them
 * anyway. Articles arrive from the SEO tool at any length, so the cut happens
 * here, at render time: the CMS keeps the full text, every tag that carries
 * the description gets the same short one. The cut lands on a whole word and
 * ends with "…" inside the limit.
 */
export const clampDescription = (text?: string | null, max = 160): string | undefined => {
  const flat = text?.replace(/\s+/g, ' ').trim()
  if (!flat) return undefined
  if (flat.length <= max) return flat

  let kept = flat.slice(0, max - 1)
  // Mid-word: step back to the last space. A single word longer than the
  // limit has none and is hard-cut.
  if (flat[max - 1] !== ' ' && kept.includes(' ')) kept = kept.slice(0, kept.lastIndexOf(' '))
  return `${kept.replace(/[\s\p{P}]+$/u, '')}…`
}
