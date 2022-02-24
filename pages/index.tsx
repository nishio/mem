import { GetStaticProps, GetStaticPaths } from 'next'
import Head from 'next/head'
import { parse, Page as PageType } from '@progfay/scrapbox-parser'
import { Page } from '../components/Page'

type Props = {
  date: number
  content: PageType
  exists: boolean
  json: {
    links: string[]
    relatedPages: {
      links1hop: { title: string; titleLc: string }[]
      links2hop: { title: string; linksLc: string }[]
    }
  }
}

export const getStaticProps: GetStaticProps<Props> = async ctx => {
  const url = `https://scrapbox.io/api/pages/nishio/INDEX_FOR_VERCEL`
  const response = await fetch(url)
  const json = await response.json()
  const text = json.lines.map(line => line.text).join('\n')

  return {
    props: {
      date: Date.now(),
      content: parse(text),
      exists: response.ok,
      json: json,
    },
    revalidate: 30,
  }
}

export default function TopPage(props: Props) {
  return (
    <>
      <Head>
        <title>NISHIO Hirokazu</title>
      </Head>
      <div className="header">NISHIO Hirokazu</div>

      <Page blocks={props.content} hide_title={true} />
    </>
  )
}
