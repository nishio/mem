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

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
            gap: "1rem",
            marginTop: "2rem",
          }}
        >
          {props.illusts.map((illust) => (
            <Link key={illust.id} href={`/${props.lang}/illust/${illust.id}`}>
              <a
                style={{
                  display: "block",
                  position: "relative",
                  paddingBottom: "100%",
                  overflow: "hidden",
                  border: "1px solid #ddd",
                  borderRadius: "8px",
                  backgroundColor: "#f9f9f9",
                }}
              >
                {illust.imageUrl && (
                  <img
                    src={illust.imageUrl}
                    alt={illust.title}
                    style={{
                      position: "absolute",
                      top: "50%",
                      left: "50%",
                      transform: "translate(-50%, -50%)",
                      maxWidth: "100%",
                      maxHeight: "100%",
                      width: "auto",
                      height: "auto",
                      objectFit: "contain",
                    }}
                  />
                )}
              </a>
            </Link>
          ))}
        </div>
      </div>
      <hr />
      <div>(C)NISHIO Hirokazu / Illustration View</div>
    </>
  );
}
