import { GetStaticProps, GetStaticPaths } from "next";
import Head from "next/head";
import Link from "next/link";
import fs from "fs";
import path from "path";
import matter from "gray-matter";
import type { FC } from "react";

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

type IntroSectionProps = {
  lang: string;
};

const IntroSection: FC<IntroSectionProps> = ({ lang }) => {
  if (lang === "ja") {
    return (
      <div className="intro">
        <p>
          西尾泰和の言語非依存な図解を集めた美術館へようこそ。
        </p>
        <p>
          ここでは、言語的な説明よりも先に図解を見る体験を提供しています。
          図解のタイトルや解説はクリックするまで表示されないようになっています。まず図解を見て、あなた自身が何かをイメージしてください。
          それが作者の意図と違っていても構いません――その違いこそが、予期しないつながりを発見する機会になります。
        </p>
      </div>
    );
  }

  if (lang === "en") {
    return (
      <div className="intro">
        <p>
          Welcome to a gallery of language-independent visual thinking by NISHIO Hirokazu.
        </p>
        <p>
          Here, we provide an experience of viewing diagrams before linguistic explanations.
          Titles and descriptions are hidden until you click. First, look at the diagram and imagine something for yourself.
          Even if it differs from the author's intent, that difference may become an opportunity to discover unexpected connections.
        </p>
      </div>
    );
  }

  return null;
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

    // Always extract image from Japanese version (language-independent)
    const jaFilePath = path.join(
      process.cwd(),
      "data",
      "ja",
      "pages",
      `${item.page_ja}.md`
    );
    const jaFileContent = fs.existsSync(jaFilePath)
      ? fs.readFileSync(jaFilePath, "utf-8")
      : "";
    const imageUrl = jaFileContent ? extractGyazoImage(jaFileContent) : null;

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
        <Link href="/" id="to-top">
          NISHIO Hirokazu
        </Link>
        <span style={{ margin: "0 0.5em" }}> &gt; </span>
        <Link href={`/${props.lang}/vt`} id="to-top">
          Visual Thinking
        </Link>
        {/* <span className="header-util">
          [{props.lang === "ja" ? "日本語" : "English"}]
        </span> */}
        <Link href={`/${otherLang}/vt`} className="header-util">
          [{otherLang === "ja" ? "日本語" : "English"}]
        </Link>
      </div >
      <div className="page">
        <h1>{props.lang === "ja" ? "ビジュアルシンキング" : "Visual Thinking"}</h1>

        <IntroSection lang={props.lang} />

        <p style={{ marginBottom: "1rem" }}>
          <Link
            href={`/${props.lang}/vt/latest`}
            style={{ color: "#0066cc", textDecoration: "underline" }}
          >
            {props.lang === "ja" ? "最新順で見る" : "View Latest First"}
          </Link>
        </p>

        <div className="illust-grid">
          {props.illusts.map((illust) => (
            <Link key={illust.id} href={`/${props.lang}/vt/${illust.id}`}>
              <div className="illust-tile">
                {illust.imageUrl && (
                  <img
                    src={illust.imageUrl}
                    alt={illust.title}
                    className="illust-image"
                  />
                )}
              </div>
            </Link>
          ))}
        </div>

        <style jsx>{`
          .page {
            max-width: 1600px !important;
          }

          .intro {
            max-width: 800px;
            margin: 2rem auto;
            padding: 1.5rem;
            background-color: #f9f9f9;
            border-radius: 8px;
            line-height: 1.8;
            font-size: 1.05rem;
          }

          .intro p {
            margin: 0 0 1rem 0;
          }

          .intro p:last-child {
            margin-bottom: 0;
          }

          @media (max-width: 768px) {
            .intro {
              margin: 1rem auto;
              padding: 1rem;
              font-size: 0.95rem;
            }
          }

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
