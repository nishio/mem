import { GetStaticProps, GetStaticPaths } from "next";
import Head from "next/head";
import { parse } from "@progfay/scrapbox-parser";
import { Page } from "../components/Page";
import { generate_links } from "../utils/generate_links";
import { Breadcrumb, PrevNext } from "../utils/book_navigation";
import Link from "next/link";
import { TScrapboxPageJSON } from "../utils/TScrapboxPageJSON";
import { TPageProps } from "../utils/TPageProps";

export const getStaticProps: GetStaticProps<TPageProps> = async (ctx) => {
  const project = "nishio";
  const page = encodeURIComponent(ctx.params!!.page as string);
  if (page === "favicon.ico") {
    throw new Error("404");
  }
  const url = `https://scrapbox.io/api/pages/${project}/${page}`;
  const response = await fetch(url);
  const json: TScrapboxPageJSON = await response.json();
  const text = json.lines.map((line) => line.text).join("\n");

  return {
    props: {
      date: Date.now(),
      content: parse(text),
      exists: response.ok,
      project,
      page: ctx.params!!.page as string,
      json: json,
    },
    revalidate: 30,
  };
};

export const getStaticPaths: GetStaticPaths = async () => {
  return {
    paths: [],
    fallback: "blocking",
  };
};

const toHideRelatedPages = new Set();
toHideRelatedPages.add("Engineer's way of creating knowledge");

const Tweet = (props: { page: string }) => {
  const tweet_url = `https://twitter.com/intent/tweet`;
  return (
    <a className="twitter-share-button" href={tweet_url}>
      Tweet
    </a>
  );
};
const View = (props: TPageProps) => {
  const { links, two_hops_links } = generate_links([props]);
  const title = decodeURIComponent(props.page).replace(/_/g, " ");
  const trans_url = `https://mem-nhiro-org.translate.goog/${props.page}?_x_tr_sl=en&_x_tr_tl=zh-CN&_x_tr_hl=en&_x_tr_pto=wapp`;
  const description = props.json.descriptions
    .map((line) => line.replace(/\[.*?\]/g, ""))
    .join(" ");

  return (
    <>
      <Head>
        <title>{title} - NISHIO Hirokazu</title>
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="nishio" />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={description} />
        <meta name="twitter:image" content={props.json.image} />
      </Head>
      <div className="header">
        <Link href="/">
          <a id="to-top">NISHIO Hirokazu</a>
        </Link>
        <a className="header-util" href={trans_url}>
          [Translate]
        </a>
      </div>
      <Page blocks={props.content} hide_title={false}>
        {PrevNext(title)}
        {Breadcrumb(title)}
        {/* <Tweet page={props.page} /> */}
      </Page>
      {toHideRelatedPages.has(title) ? null : (
        <div className="page">
          <h3>Related Pages</h3>

          <p>Direct Links: {links}</p>
          {two_hops_links.length > 0 && (
            <div>
              <p>2-hop links</p>
              <ul>{two_hops_links}</ul>
            </div>
          )}
        </div>
      )}
      <div className="page">
        "<strong>Engineer's way of creating knowledge</strong>" the English
        version of my book is now available on{" "}
        <Link href="/Engineer's_way_of_creating_knowledge">
          [Engineer's way of creating knowledge]
        </Link>
        <br />
        <img src="https://gyazo.com/9ae63458a8653dd1fc31c864f5f9acf4/max_size/400"></img>
      </div>
      <hr></hr>
      <div>
        (C)NISHIO Hirokazu / Converted from{" "}
        <a
          href={`https://scrapbox.io/${props.project}/${props.page}`}
          target="_blank"
        >
          [Scrapbox]
        </a>{" "}
        at <time>{new Date(props.date).toLocaleString()}</time>
        <a
          href={`sbporter://scrapbox.io/${props.project}/${props.page}`}
          target="_blank"
          id="porter"
        >
          [Edit]
        </a>
      </div>
    </>
  );
};

export default View;
