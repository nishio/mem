import React from 'react'
import type { LinkNode as LinkNodeType } from '@progfay/scrapbox-parser'
import { useRouter } from 'next/router'
import Link from 'next/link'

export const LinkNode = (props: LinkNodeType) => {
  switch (props.pathType) {
    case 'root':
    case 'relative':
      return <InternalLink {...props} />
    case 'absolute':
      return <ExternalLink {...props} />
  }
}

const InternalLink = (props: LinkNodeType) => {
  const project = 'nishio'

  // props.href should be properly encoded
  // e.g. `foo/bar` -> `foo%2Fbar`
  // but `foo bar` ->  `foo_bar`, not `foo%20bar`
  if (props.pathType === 'relative') {
    const url_project = project
    const url_page = encodeURIComponent(props.href.replace(/ /g, '_'))
    const url = `/${url_page}`
    return (
      <Link href={url} key={url}>
        <a className="page-link">{props.href}</a>
      </Link>
    )
  }
  // it is link to another scrapbox project
  const url = `https://scrapbox.io${props.href}`
  return (
    <a href={url} rel="noopener noreferrer" target="_blank" key={url}>
      {props.content || props.href}
    </a>
  )
}

const ExternalLink = (props: LinkNodeType) => (
  <a
    href={props.href}
    rel="noopener noreferrer"
    target="_blank"
    key={props.href}
  >
    {props.content || props.href}
  </a>
)
