import { GetStaticProps, GetStaticPaths } from 'next'
import Head from 'next/head'
import { parse, Page as PageType } from '@progfay/scrapbox-parser'
import { Page } from '../../components/Page'
import Link from 'next/link'

type TDataFromScrapbox = {
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
type Props = {
  date: number
  en: TDataFromScrapbox
  ja: TDataFromScrapbox
}

const getData = async (project: string, page: string) => {
  const url = `https://scrapbox.io/api/pages/${project}/${page}`
  const response = await fetch(url)
  const json = await response.json()
  let content = null
  if (json.lines) {
    const text = json.lines.map(line => line.text).join('\n')
    content = parse(text)
  }

  return {
    exists: response.ok,
    content,
    project,
    page,
    json,
  }
}

export const getStaticProps: GetStaticProps<Props> = async ctx => {
  const page = encodeURIComponent(ctx.params.page as string)
  const en = await getData('intellitech-en', page)
  const ja = await getData('nishio', page)

  return {
    props: {
      date: Date.now(),
      en,
      ja,
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
      {!props.date
        ? 'Loading... - Scrapbox Reader'
        : `${props.en.page} - Scrapbox Reader`}
    </title>
  </Head>
)

const View = (props: Props) => {
  if (!props.date)
    return (
      <>
        <Title {...props} />
        loading...
      </>
    )

  const to_link = (title, titleLc) => (
    <Link href={`/en/${titleLc}`}>
      <a style={{ marginRight: '1em' }}>[{title}]</a>
    </Link>
  )
  const intermediate_page = key => {
    if (lc_to_title[key] !== undefined) {
      return to_link(lc_to_title[key], key)
    }
    return key
  }

  const links = []
  const lc_to_title = {}
  const two_hops = {}
  const two_hops_links = []
  const projects = [props.en, props.ja]
  projects.forEach(props => {
    if (!props.exists) return
    props.json.relatedPages.links1hop.forEach(x => {
      lc_to_title[x.titleLc] = x.title
      links.push(to_link(x.title, x.titleLc))
    })
    props.json.relatedPages.links2hop.forEach(x => {
      if (two_hops[x.linksLc] === undefined) {
        two_hops[x.linksLc] = [x.title]
      } else {
        two_hops[x.linksLc].push(x.title)
      }
    })
  })
  Object.keys(two_hops).forEach(key => {
    two_hops_links.push(
      <li key={key}>
        → {intermediate_page(key)} → {two_hops[key].map(to_link)}
      </li>,
    )
  })

  return (
    <>
      <Title {...props} />
      generated at <time>{new Date(props.date).toLocaleString()}</time>
      {/* <a
        href={`https://scrapbox.io/${props.project}/${props.page}`}
        target="_blank"
      >
        [Scrapbox]
      </a> */}
      {props.en.exists ? (
        <div style={{ borderTop: '#888 solid 1px' }}>
          from{' '}
          <a
            href={`https://scrapbox.io/intellitech-en/${props.en.page}`}
            target="_blank"
          >
            Scrapbox(intellitech-en)
          </a>
          <Page blocks={props.en.content} hide_title={false} />
        </div>
      ) : null}
      {props.ja.exists ? (
        <div style={{ borderTop: '#888 solid 1px' }}>
          from{' '}
          <a
            href={`https://scrapbox.io/nishio/${props.ja.page}`}
            target="_blank"
          >
            Scrapbox(nishio)
          </a>
          <Page blocks={props.ja.content} hide_title={false} />
        </div>
      ) : null}
      <div style={{ borderTop: '#888 solid 1px' }}>
        <h3>Related Pages</h3>
        <p>Direct Links: {links}</p>
        <div>
          <p>2-hop links</p>
          <ul>{two_hops_links}</ul>
        </div>
      </div>
    </>
  )
}

export default View
