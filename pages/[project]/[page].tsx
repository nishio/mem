import { GetStaticProps, GetStaticPaths } from 'next'
import Head from 'next/head'
import { parse, Page as PageType } from '@progfay/scrapbox-parser'
import { Page } from '../../components/Page'
import Link from 'next/link'

type Props = {
  date: number
  content: PageType
  exists: boolean
  project: string
  page: string
  json: {
    links: string[]
    relatedPages: {
      links1hop: { title: string; titleLc: string }[]
      links2hop: { title: string; linksLc: string }[]
    }
  }
}

export const getStaticProps: GetStaticProps<Props> = async ctx => {
  const project = encodeURIComponent(ctx.params.project as string)
  const page = encodeURIComponent(ctx.params.page as string)
  const url = `https://scrapbox.io/api/pages/${project}/${page}`
  const response = await fetch(url)
  const json = await response.json()
  const text = json.lines.map(line => line.text).join('\n')

  return {
    props: {
      date: Date.now(),
      content: parse(text),
      exists: response.ok,
      project: ctx.params.project as string,
      page: ctx.params.page as string,
      json: json,
    },
    revalidate: 30,
  }
}

export const getStaticPaths: GetStaticPaths = async () => {
  return {
    paths: [],
    fallback: true,
  }
}

const Title = (props: Props) => (
  <Head>
    <title>
      {!props.project || !props.page
        ? 'Loading... - Scrapbox Reader'
        : `/${props.project}/${props.page} - Scrapbox Reader`}
    </title>
  </Head>
)

const View = (props: Props) => {
  if (!props.content)
    return (
      <>
        <Title {...props} />
        loading...
      </>
    )
  if (!props.exists)
    return (
      <>
        <Title {...props} />
        This is an empty page
      </>
    )
  const to_link = s => (
    <Link href={`/${props.project}/${s}`}>
      <a>[{s}]</a>
    </Link>
  )

  const links = props.json.links.map(to_link)
  const two_hops = {}
  props.json.relatedPages.links2hop.forEach(x => {
    if (two_hops[x.linksLc] === undefined) {
      two_hops[x.linksLc] = [x.title]
    } else {
      two_hops[x.linksLc].push(x.title)
    }
  })
  const lc_to_title = {}
  props.json.relatedPages.links1hop.forEach(x => {
    lc_to_title[x.titleLc] = x.title
  })

  const intermediate_page = key => {
    if (lc_to_title[key] !== undefined) {
      return to_link(lc_to_title[key])
    }
    return key
  }
  const two_hop_links = Object.keys(two_hops).map(key => (
    <li>
      → {intermediate_page(key)} → {two_hops[key].map(to_link)}
    </li>
  ))
  return (
    <>
      <Title {...props} />
      generated at <time>{new Date(props.date).toLocaleString()}</time> |{' '}
      <a
        href={`https://scrapbox.io/${props.project}/${props.page}`}
        target="_blank"
      >
        [Scrapbox]
      </a>
      <Page blocks={props.content} />
      <div>
        <h3>Related Pages</h3>
        <p>Direct Links: {links}</p>
        <div>
          <p>2-hop links</p>
          <ul>{two_hop_links}</ul>
        </div>
      </div>
      {JSON.stringify(props.json.relatedPages)}
    </>
  )
}

export default View
