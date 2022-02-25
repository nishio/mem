import Head from "next/head";
import { GetStaticProps, GetStaticPaths } from "next";

import { getStaticProps as getSRSProps, Props, get_SRS } from "../utils/SRS";
import { Page } from "../components/Page";

export const getStaticProps: GetStaticProps<Props> = async (ctx) => {
  return getSRSProps(ctx);
};

export default function TopPage(props: Props) {
  const content = get_SRS(props);

  return (
    <>
      <Head>
        <title>Dashboard NISHIO Hirokazu</title>
      </Head>
      <div className="header">mem.nhiro.org: Dashboard</div>
      <div className="page">
        <a
          href="https://twitter.com/search?q=mem.nhiro.org&src=typed_query&f=live"
          target="_blank"
        >
          Twitter Search
        </a>
      </div>
      <Page blocks={content} hide_title={false} />
    </>
  );
}
