import { GetStaticProps, GetStaticPaths } from "next";
import Head from "next/head";
import Link from "next/link";
import fs from "fs";
import path from "path";
import matter from "gray-matter";

type IllustConfig = {
  illusts: Array<{
    id: string;
    page_ja: string;
    page_en: string | null;
    tags: string[];
  }>;
};

type IllustItem = {
  id: string;
  title: string;
  pageName: string;
  imageUrl: string | null;
  tags: string[];
};

type Props = {
  lang: string;
  illusts: IllustItem[];
};

function extractGyazoImage(markdown: string): string | null {
  const gyazoPattern = /!\[.*?\]\((https:\/\/gyazo\.com\/[a-f0-9]+(?:\/thumb\/\d+)?)\)/i;
  const match = markdown.match(gyazoPattern);
  return match ? match[1] : null;
}

export const getStaticProps: GetStaticProps<Props> = async (ctx) => {
  const lang = ctx.params!!.lang as string;

  if (lang !== "ja" && lang !== "en") {
    return {
      redirect: {
        destination: "/",
        permanent: false,
      },
    };
  }

  const configPath = path.join(process.cwd(), "illust_config.json");
  const configContent = fs.readFileSync(configPath, "utf-8");
  const config: IllustConfig = JSON.parse(configContent);

  const illusts: IllustItem[] = [];

  for (const item of config.illusts) {
    let pageName: string;

    if (lang === "ja") {
      pageName = item.page_ja;
    } else {
      if (!item.page_en) {
        continue; // Skip if no English version
      }
      pageName = item.page_en;
    }

    const filePath = path.join(
      process.cwd(),
      "data",
      lang,
      "pages",
      `${pageName}.md`
    );

    if (!fs.existsSync(filePath)) {
      continue;
    }

    const fileContent = fs.readFileSync(filePath, "utf-8");
    const { data, content } = matter(fileContent);
    const imageUrl = extractGyazoImage(content);

    illusts.push({
      id: item.id,
      title: data.title || pageName,
      pageName,
      imageUrl,
      tags: item.tags,
    });
  }

  return {
    props: {
      lang,
      illusts,
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

export default function IllustIndexPage(props: Props) {
  const otherLang = props.lang === "ja" ? "en" : "ja";

  return (
    <>
      <Head>
        <title>Illustrations - NISHIO Hirokazu</title>
      </Head>
      <div className="document-header">
        <Link href="/">
          <a id="to-top">NISHIO Hirokazu</a>
        </Link>
        <span className="header-util">
          [{props.lang === "ja" ? "日本語" : "English"}]
        </span>
        <Link href={`/${otherLang}/illust`}>
          <a className="header-util">
            [{otherLang === "ja" ? "日本語" : "English"}]
          </a>
        </Link>
      </div>
      <div className="page">
        <h1>{props.lang === "ja" ? "イラスト一覧" : "Illustrations"}</h1>
        <p>
          {props.lang === "ja"
            ? "xkcd風のイラストをまとめて表示しています。"
            : "A collection of xkcd-style illustrations."}
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
            gap: "2rem",
            marginTop: "2rem",
          }}
        >
          {props.illusts.map((illust) => (
            <div
              key={illust.id}
              style={{
                border: "1px solid #ddd",
                borderRadius: "8px",
                padding: "1rem",
                textAlign: "center",
              }}
            >
              <Link href={`/${props.lang}/illust/${illust.id}`}>
                <a>
                  <h3 style={{ marginTop: 0 }}>{illust.title}</h3>
                  {illust.imageUrl && (
                    <img
                      src={illust.imageUrl}
                      alt={illust.title}
                      style={{
                        maxWidth: "100%",
                        height: "auto",
                        maxHeight: "200px",
                        objectFit: "contain",
                      }}
                    />
                  )}
                </a>
              </Link>
              <div style={{ marginTop: "0.5rem", fontSize: "0.9rem" }}>
                {illust.tags.map((tag) => (
                  <span
                    key={tag}
                    style={{
                      display: "inline-block",
                      background: "#f0f0f0",
                      padding: "0.2rem 0.5rem",
                      margin: "0.2rem",
                      borderRadius: "4px",
                      fontSize: "0.8rem",
                    }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
      <hr />
      <div>(C)NISHIO Hirokazu / Illustration View</div>
    </>
  );
}
