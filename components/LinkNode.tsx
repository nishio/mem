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
  const { project } = useRouter().query

  let url = props.href // suspicious code
  // props.href should be properly encoded
  // e.g. `foo/bar` -> `foo%2Fbar`
  // but `foo bar` ->  `foo_bar`, not `foo%20bar`
  if (props.pathType === 'relative') {
    const url_project = project ?? 'en'
    const url_page = encodeURIComponent(props.href.replace(' ', '_'))
    url = `/${url_project}/${url_page}`
  }

  return (
    <Link href={url}>
      <a className="page-link">{props.href}</a>
    </Link>
  )
}

const ExternalLink = (props: LinkNodeType) => (
  <a href={props.href} rel="noopener noreferrer" target="_blank">
    {props.content || props.href}
  </a>
)
