import Head from "next/head";

export default function TopPage(props: {}) {
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
    </>
  );
}
