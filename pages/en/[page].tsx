import { GetStaticProps, GetStaticPaths } from 'next'
import Head from 'next/head'
import { parse, Page as PageType } from '@progfay/scrapbox-parser'
import { Page } from '../../components/Page'
import { generate_links } from '../../utils/generate_links'

type TDataFromScrapbox = {
  content: PageType
  exists: boolean
  project: string
  page: string
  json: {
    links: string[]
    relatedPages: {
      links1hop: { title: string; titleLc: string }[]
      links2hop: { title: string; titleLc: string; linksLc: string }[]
    }
  }
}
type Props = {
  date: number
  en: TDataFromScrapbox
  ja: TDataFromScrapbox
}

const deepl = async (text: string) => {
  const secret = undefined
  if (secret === undefined) throw new Error('secret is undefined')
  const data = {
    auth_key: secret,
    text,
    source_lang: 'JA',
    target_lang: 'EN-US',
  }
  const trans = await fetch('https://api-free.deepl.com/v2/translate', {
    method: 'POST',
    headers: {
      'Content-type': 'application/x-www-form-urlencoded;charset=UTF-8',
    },
    body: new URLSearchParams(data),
  })
  const transJson = await trans.json()
  return transJson.translations.map(x => x.text).join('\n\n')
}

const getData = async (project: string, page: string) => {
  const url = `https://scrapbox.io/api/pages/${project}/${page}`
  const response = await fetch(url)
  const json = await response.json()
  let content = null
  if (json.lines) {
    const text = json.lines.map(line => line.text).join('\n')
    const doTrans = false
    if (project === 'nishio' && doTrans) {
      content = parse(await deepl(text))
    } else {
      content = parse(text)
    }
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

  const projects = [props.en, props.ja]
  const { links, two_hops_links } = generate_links(projects)

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
          <a
            href={`sbporter://scrapbox.io/intellitech-en/${props.en.page}`}
            target="_blank"
          >
            [Edit]
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
          <a
            href={`sbporter://scrapbox.io/nishio/${props.ja.page}`}
            target="_blank"
          >
            [Edit]
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
