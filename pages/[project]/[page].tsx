import { GetStaticProps, GetStaticPaths } from 'next'
import Head from 'next/head'
import { parse, Page as PageType } from '@progfay/scrapbox-parser'
import { Page } from '../../components/Page'

type Props = {
  date: number
  content: PageType
  exists: boolean
  project: string
  page: string
  json: { links: string[]; relatedPages: string[] }
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

  return (
    <>
      <Title {...props} />
      generated at <time>{new Date(props.date).toLocaleString()}</time>
      <Page blocks={props.content} />
      <p>{JSON.stringify(props.json.links)}</p>
      <p>{JSON.stringify(props.json.relatedPages)}</p>
    </>
  )
}

export default View
