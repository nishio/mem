import Link from 'next/link'
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

export const PrevNext = current => {
  const prev = Prev(current)
  const next = Next(current)
  if (prev || next) {
    return (
      <div>
        {prev} {next}
      </div>
    )
  }
  return null
}

export const Breadcrumb = current => {
  let x = nav.parent[current]
  if (x === undefined) return null

  const parents = []
  while (x !== undefined) {
    parents.unshift(x)
    x = nav.parent[x]
  }
  const root = "Engineer's way of creating knowledge"
  const root_url = title_to_url(root)
  const links = parents.map(x => {
    const url = title_to_url(x)
    return (
      <>
        {' > '}
        <Link href={`/${url}`} key={x}>
          <a>{x}</a>
        </Link>
      </>
    )
  })
  return (
    <p>
      <Link href={`/${root_url}`} key={root}>
        <a>{root}</a>
      </Link>
      {links}
      {' > '} {current}
    </p>
  )
}
