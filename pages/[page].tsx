import { GetStaticProps, GetStaticPaths } from 'next'
import Head from 'next/head'
import { parse, Page as PageType } from '@progfay/scrapbox-parser'
import { Page } from '../components/Page'
import { generate_links } from '../utils/generate_links'

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
  const project = 'nishio'
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
      project,
      page: ctx.params.page as string,
      json: json,
    },
    revalidate: 30,
  }
}

export const getStaticPaths: GetStaticPaths = async () => {
  return {
    paths: [],
    fallback: 'unstable_blocking',
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

  const { links, two_hops_links } = generate_links([props])
  return (
    <>
      <Title {...props} />
      <div className="header">NISHIO Hirokazu</div>
      <Page blocks={props.content} hide_title={false} />
      <div className="page">
        <h3>Related Pages</h3>
        <p>Direct Links: {links}</p>
        <div>
          <p>2-hop links</p>
          <ul>{two_hops_links}</ul>
        </div>
      </div>
      <hr></hr>
      (C)NISHIO Hirokazu / Converted from{' '}
      <a
        href={`https://scrapbox.io/${props.project}/${props.page}`}
        target="_blank"
      >
        [Scrapbox]
      </a>{' '}
      at <time>{new Date(props.date).toLocaleString()}</time>
      <a
        href={`sbporter://scrapbox.io/${props.project}/${props.page}`}
        target="_blank"
        id="porter"
      >
        [Porter]
      </a>
    </>
  )
}

export default View
