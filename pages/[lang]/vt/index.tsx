import { GetStaticProps, GetStaticPaths } from "next";
import Head from "next/head";
import Link from "next/link";
import fs from "fs";
import path from "path";
import matter from "gray-matter";

type IllustConfig = {
  illusts: Array<{
    id: number;
    page_ja: string;
    page_en: string | null;
    tags: string[];
  }>;
};

type IllustItem = {
  id: number;
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

  const configPath = path.join(process.cwd(), "vt_config.json");
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
        <title>NISHIO Hirokazu - Visual Thinking</title>
      </Head>
      <div className="document-header">
        <Link href="/">
          <a id="to-top">NISHIO Hirokazu</a>
        </Link>
        <span style={{ margin: "0 0.5em" }}> &gt; </span>
        <Link href={`/${props.lang}/vt`}>
          <a id="to-top">Visual Thinking</a>
        </Link>
        {/* <span className="header-util">
          [{props.lang === "ja" ? "日本語" : "English"}]
        </span> */}
        <Link href={`/${otherLang}/vt`}>
          <a className="header-util">
            [{otherLang === "ja" ? "日本語" : "English"}]
          </a>
        </Link>
      </div >
      <div className="page">
        <h1>{props.lang === "ja" ? "イラスト一覧" : "Illustrations"}</h1>

        <div className="illust-grid">
          {props.illusts.map((illust) => (
            <Link key={illust.id} href={`/${props.lang}/vt/${illust.id}`}>
              <a className="illust-tile">
                {illust.imageUrl && (
                  <img
                    src={illust.imageUrl}
                    alt={illust.title}
                    className="illust-image"
                  />
                )}
              </a>
            </Link>
          ))}
        </div>

        <style jsx>{`
          .illust-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, 184px);
            gap: 1rem;
            justify-content: center;
            margin-top: 2rem;
          }

          @media (max-width: 768px) {
            .illust-grid {
              grid-template-columns: repeat(3, 1fr);
              gap: 0.5rem;
            }
          }

          .illust-tile {
            display: block;
            position: relative;
            padding-bottom: 100%;
            overflow: hidden;
            border: 1px solid #ddd;
            border-radius: 8px;
            background-color: #f9f9f9;
          }

          .illust-image {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            max-width: 100%;
            max-height: 100%;
            width: auto;
            height: auto;
            object-fit: contain;
          }

          .footer {
            margin-top: 4rem;
            padding-top: 2rem;
            border-top: 1px solid #e0e0e0;
            text-align: center;
            color: #666;
            font-size: 0.9rem;
          }
        `}</style>
      </div>
      <div className="footer">(C)NISHIO Hirokazu / CC-BY-3.0</div>
    </>
  );
}
