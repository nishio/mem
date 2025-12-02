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
    featured?: boolean;
  }>;
};

type IllustItem = {
  id: number;
  title: string;
  pageName: string;
  imageUrl: string | null;
  tags: string[];
  featured: boolean;
};

type Props = {
  lang: string;
  illusts: IllustItem[];
  featuredIllusts: IllustItem[];
};

type IntroSectionProps = {
  lang: string;
};

const IntroSection: FC<IntroSectionProps> = ({ lang }) => {
  if (lang === "ja") {
    return (
      <div className="intro">
        <p>
          ビジュアルソート(ビジュアルシンキングの産物、言語非依存な図解)を集めた美術館へようこそ。
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
          Welcome to a gallery of visual thought (products of visual thinking, language-independent diagrams).
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
      featured: item.featured || false,
    });
  }

  // Separate featured and regular illusts
  const featuredIllusts = illusts.filter(item => item.featured === true);
  const regularIllusts = illusts.filter(item => item.featured !== true);

  return {
    props: {
      lang,
      illusts: regularIllusts,
      featuredIllusts,
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

        <div className="illust-grid">
          {props.featuredIllusts.map((illust) => (
            <Link key={illust.id} href={`/${props.lang}/vt/${illust.id}`}>
              <div className="illust-tile">
                {illust.imageUrl && (
                  <img
                    src={illust.imageUrl}
                    alt="Visual Thinking"
                    className="illust-image"
                  />
                )}
              </div>
            </Link>
          ))}
        </div>

        <p style={{ marginTop: "1rem" }}>
          <Link
            href={`/${props.lang}/vt/latest`}
            style={{ color: "#0066cc", textDecoration: "underline" }}
          >
            {props.lang === "ja" ? "新着順で見る" : "View Latest First"}
          </Link>
        </p>

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

          .featured-section {
            max-width: 1200px;
            margin: 2rem auto 3rem;
            padding: 2rem;
            background-color: #f0f4f8;
            border-radius: 12px;
          }

          .featured-title {
            text-align: center;
            font-size: 1.5rem;
            margin-bottom: 1.5rem;
            color: #333;
          }

          .featured-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
            gap: 1.5rem;
            justify-content: center;
            max-width: 900px;
            margin: 0 auto;
          }

          @media (max-width: 768px) {
            .featured-section {
              margin: 1.5rem auto 2rem;
              padding: 1.5rem 1rem;
            }

            .featured-title {
              font-size: 1.3rem;
              margin-bottom: 1rem;
            }

            .featured-grid {
              grid-template-columns: repeat(2, 1fr);
              gap: 1rem;
            }
          }

          .featured-tile {
            display: block;
            position: relative;
            padding-bottom: 100%;
            overflow: hidden;
            border: 2px solid #0070f3;
            border-radius: 12px;
            background-color: white;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
            transition: transform 0.2s, box-shadow 0.2s;
          }

          .featured-tile:hover {
            transform: translateY(-4px);
            box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
          }

          .featured-image {
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

          .illust-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, 184px);
            gap: 1rem;
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
