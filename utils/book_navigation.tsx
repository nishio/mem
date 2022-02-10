import Link from 'next/link'
import { title } from 'process'
import React from 'react'
import { nav } from '../book_navigation.js'
import { title_to_url } from './generate_links'

export const Prev = current => {
  const title = nav.prev[current]
  if (title) {
    const url = title_to_url(title)
    return (
      <>
        {'[<<< Previous:'}
        <Link href={`/${url}`} key={title}>
          <a>{title}</a>
        </Link>
        {']'}
      </>
    )
  }
  return null
}

export const Next = current => {
  const title = nav.next[current]
  if (title) {
    const url = title_to_url(title)
    return (
      <>
        {'[Next: '}
        <Link href={`/${url}`} key={title}>
          <a>{title}</a>
        </Link>
        {' >>>]'}
      </>
    )
  }
  return null
}
