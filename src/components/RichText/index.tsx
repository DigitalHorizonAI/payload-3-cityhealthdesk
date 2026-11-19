import { cn } from '@/utilities/cn'
import React from 'react'

import type { Media } from '@/payload-types'

import { serializeLexical } from './serialize'

type Props = {
  className?: string
  content: Record<string, any>
  enableGutter?: boolean
  enableProse?: boolean
  /** Media of the in-text pictures; without it they render nothing. */
  media?: Media[]
}

const RichText: React.FC<Props> = ({
  className,
  content,
  enableGutter = true,
  enableProse = true,
  media,
}) => {
  if (!content) {
    return null
  }

  return (
    <div
      className={cn(
        {
          'container ': enableGutter,
          'max-w-none': !enableGutter,
          // article-prose is the main site's .cms-article-content rule set.
          'mx-auto article-prose': enableProse,
        },
        className,
      )}
    >
      {content &&
        !Array.isArray(content) &&
        typeof content === 'object' &&
        'root' in content &&
        serializeLexical({ nodes: content?.root?.children, media })}
    </div>
  )
}

export default RichText
