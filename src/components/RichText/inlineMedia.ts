import type { Payload } from 'payload'

import type { Media } from '@/payload-types'

type Content = { root?: { children?: { type?: string; value?: unknown }[] } } | null | undefined

/** Ids of an article's in-text pictures. Payload leaves an `upload` node's
 * value as a bare media id (the Posts editor registers no UploadFeature), so
 * the page reads the media itself. Lexical keeps upload nodes at the top level. */
export const uploadIds = (content: Content): (number | string)[] => [
  ...new Set(
    (content?.root?.children ?? [])
      .filter((node) => node?.type === 'upload')
      .map((node) => node.value)
      .filter((v): v is number | string => typeof v === 'number' || typeof v === 'string'),
  ),
]

/** Every in-text picture's media in one read. A failed read is logged and the
 * article renders without those pictures rather than as an error page. */
export const readInlineMedia = async (
  payload: Pick<Payload, 'find' | 'logger'>,
  content: Content,
): Promise<Media[]> => {
  const ids = uploadIds(content)
  if (!ids.length) return []
  try {
    const { docs } = await payload.find({
      collection: 'media',
      where: { id: { in: ids } },
      depth: 0,
      pagination: false,
    })
    return docs
  } catch (err) {
    payload.logger.error({ err, ids }, 'In-text pictures left out: media read failed')
    return []
  }
}

/** The media of an upload node's value when it can show as a picture: an image
 * with width and height (next/image throws without them) on this site's own
 * path. Otherwise null: deleted media, a PDF, a URL on another host. */
export const inlineImage = (value: unknown, media: Media[]): Media | null => {
  const doc =
    value && typeof value === 'object'
      ? (value as Media)
      : media.find((m) => String(m.id) === String(value))
  if (!doc?.mimeType?.startsWith('image/') || !doc.width || !doc.height) return null
  return doc.url?.startsWith('/') && !doc.url.startsWith('//') ? doc : null
}
