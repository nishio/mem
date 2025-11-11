import { GetStaticProps, GetStaticPaths } from "next";
import Head from "next/head";
import Link from "next/link";
import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { marked } from "marked";

type IllustConfig = {
  illusts: Array<{
    id: number;
    page_ja: string;
    page_en: string | null;
    tags: string[];
  }>;
};

type Props = {
  title: string;
  content: string;
  shortDescription: string;
  imageUrl: string | null;
  lang: string;
  page: string;
  exists: boolean;
  pageName: string;
  illustId: number;
  hasEnVersion: boolean;
  totalIllusts: number;
  currentIndex: number;
};

function extractGyazoImage(markdown: string): string | null {
  const gyazoPattern = /!\[.*?\]\((https:\/\/gyazo\.com\/[a-f0-9]+(?:\/thumb\/\d+)?)\)/i;
  const match = markdown.match(gyazoPattern);
  return match ? match[1] : null;
}

function extractShortDescription(markdown: string): string {
  let text = markdown.replace(/^---[\s\S]*?---\n/, "");
  text = text.replace(/!\[.*?\]\(.*?\)/g, "");
  
  const lines = text.split("\n").filter((line) => line.trim().length > 0);
  let description = "";
  let paragraphCount = 0;
  
  for (const line of lines) {
    if (line.startsWith("#") || line.startsWith("-") || line.startsWith("*")) {
      continue; // Skip headers and list items
    }
    description += line + "\n";
    if (line.trim().length > 0) {
      paragraphCount++;
    }
    if (paragraphCount >= 2 || description.length > 300) {
      break;
    }
  }
  
  return description.trim();
}

// Process wiki-style links in markdown
function processWikiLinks(markdown: string, lang: string): string {
  return markdown.replace(/\[\[([^\]]+)\]\]/g, (match, linkText) => {
    return `[${linkText}](/${lang}/${encodeURIComponent(linkText)})`;
  });
}

export const getStaticProps: GetStaticProps<Props> = async (ctx) => {
  const lang = ctx.params!!.lang as string;
  const page = ctx.params!!.page as string;

  if (lang !== "ja" && lang !== "en") {
    return {
      redirect: {
        destination: `/legacy/${page}`,
        permanent: false,
      },
    };
  }

  const configPath = path.join(process.cwd(), "vt_config.json");
  const configContent = fs.readFileSync(configPath, "utf-8");
  const config: IllustConfig = JSON.parse(configContent);

  const illustItem = config.illusts.find((item) => item.id === parseInt(page, 10));

  if (!illustItem) {
    return {
      props: {
        title: page,
        content: "",
        shortDescription: "",
        imageUrl: null,
        lang,
        page,
        exists: false,
        pageName: "",
        illustId: parseInt(page, 10),
        hasEnVersion: false,
        totalIllusts: config.illusts.length,
        currentIndex: -1,
      },
    };
  }

  let pageName: string;
  let hasEnVersion = false;

  if (lang === "ja") {
    pageName = illustItem.page_ja;
    hasEnVersion = illustItem.page_en !== null;
  } else {
    if (!illustItem.page_en) {
      return {
        redirect: {
          destination: `/ja/vt/${page}`,
          permanent: false,
        },
      };
    }
    pageName = illustItem.page_en;
    hasEnVersion = true;
  }

  // Build file path
  const filePath = path.join(
    process.cwd(),
    "data",
    lang,
    "pages",
    `${pageName}.md`
  );

  // Check if file exists
  if (!fs.existsSync(filePath)) {
    return {
      props: {
        title: pageName,
        content: "",
        shortDescription: "",
        imageUrl: null,
        lang,
        page,
        exists: false,
        pageName,
        illustId: illustItem.id,
        hasEnVersion,
        totalIllusts: config.illusts.length,
        currentIndex: config.illusts.findIndex((item) => item.id === parseInt(page, 10)),
      },
    };
  }

  // Read and parse markdown file
  const fileContent = fs.readFileSync(filePath, "utf-8");
  const { data, content } = matter(fileContent);

  const imageUrl = extractGyazoImage(content);
  const shortDescription = extractShortDescription(content);

  // Process wiki-style links
  const processedContent = processWikiLinks(content, lang);

  // Convert markdown to HTML
  const htmlContent = await marked.parse(processedContent);

  const currentIndex = config.illusts.findIndex((item) => item.id === parseInt(page, 10));

  return {
    props: {
      title: data.title || pageName,
      content: htmlContent,
      shortDescription,
      imageUrl,
      lang,
      page,
      exists: true,
      pageName,
      illustId: illustItem.id,
      hasEnVersion,
      totalIllusts: config.illusts.length,
      currentIndex,
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

export default function IllustPage(props: Props) {
  if (!props.exists) {
    return (
      <>
        <Head>
          <title>Illustration Not Found - NISHIO Hirokazu</title>
        </Head>
        <div className="document-header">
          <Link href="/">
            <a id="to-top">NISHIO Hirokazu</a>
          </Link>
        </div>
        <div className="page">
          <h1>Illustration Not Found</h1>
          <p>
            The illustration "{props.page}" does not exist in {props.lang}{" "}
            language.
          </p>
          <p>
            <Link href={`/${props.lang}/vt`}>
              <a>Back to Visual Thinking list</a>
            </Link>
          </p>
        </div>
      </>
    );
  }

  const otherLang = props.lang === "ja" ? "en" : "ja";

  const getFirstId = () => 1;
  const getLastId = () => props.totalIllusts;
  const getPrevId = () => {
    if (props.currentIndex <= 0) return null;
    return props.currentIndex; // currentIndex is 0-based, but we need the ID of previous item
  };
  const getNextId = () => {
    if (props.currentIndex >= props.totalIllusts - 1) return null;
    return props.currentIndex + 2; // currentIndex is 0-based, next item is currentIndex + 1, so ID is currentIndex + 2
  };
  const getRandomId = () => {
    return Math.floor(Math.random() * props.totalIllusts) + 1;
  };

  return (
    <>
      <Head>
        <title>{props.title} - NISHIO Hirokazu</title>
      </Head>
      <div className="document-header">
        <Link href="/">
          <a id="to-top">NISHIO Hirokazu</a>
        </Link>
        <span className="header-util">
          [{props.lang === "ja" ? "日本語" : "English"}]
        </span>
        {props.hasEnVersion && (
          <Link href={`/${otherLang}/vt/${props.page}`}>
            <a className="header-util">
              [{otherLang === "ja" ? "日本語" : "English"}]
            </a>
          </Link>
        )}
      </div>
      <div className="page illust-page">
        <h1 className="illust-title">{props.title}</h1>

        {props.imageUrl && (
          <div className="illust-image-container">
            <img
              src={props.imageUrl}
              alt={props.title}
              className="illust-image"
            />
          </div>
        )}

        <div className="illust-nav">
          <div className="nav-buttons">
            <Link href={`/${props.lang}/vt/${getFirstId()}`}>
              <a className="nav-link">|&lt;</a>
            </Link>
            {getPrevId() ? (
              <Link href={`/${props.lang}/vt/${getPrevId()}`}>
                <a className="nav-link">&lt; Prev</a>
              </Link>
            ) : (
              <span className="nav-link disabled">&lt; Prev</span>
            )}
            <Link href={`/${props.lang}/vt/${getRandomId()}`}>
              <a className="nav-link">Random</a>
            </Link>
            {getNextId() ? (
              <Link href={`/${props.lang}/vt/${getNextId()}`}>
                <a className="nav-link">Next &gt;</a>
              </Link>
            ) : (
              <span className="nav-link disabled">Next &gt;</span>
            )}
            <Link href={`/${props.lang}/vt/${getLastId()}`}>
              <a className="nav-link">&gt;|</a>
            </Link>
          </div>
          <div className="nav-all">
            <Link href={`/${props.lang}/vt`}>
              <a>All Visual Thinking</a>
            </Link>
          </div>
        </div>

        {props.shortDescription && (
          <div className="illust-description">
            <p>{props.shortDescription}</p>
          </div>
        )}

        <div className="illust-cta">
          <Link href={`/${props.lang}/${props.pageName}`}>
            <a className="read-more-button">
              {props.lang === "ja" ? "詳細を読む →" : "Read More →"}
            </a>
          </Link>
        </div>

        <style jsx>{`
          .illust-page {
            max-width: 1400px !important;
            margin: 16px auto !important;
          }

          .illust-title {
            text-align: center;
            margin-bottom: 2rem;
            font-size: 2rem;
          }

          .illust-image-container {
            text-align: center;
            margin: 0 auto 2rem;
          }

          .illust-image {
            width: 100%;
            max-width: 1200px;
            height: auto;
            max-height: 80vh;
            object-fit: contain;
          }

          .illust-nav {
            text-align: center;
            margin: 2rem 0;
          }

          .nav-buttons {
            font-size: 1.2rem;
            font-family: monospace;
            margin-bottom: 1rem;
          }

          .nav-link {
            margin: 0 0.5rem;
            text-decoration: none;
          }

          .nav-link.disabled {
            color: #ccc;
            cursor: default;
          }

          .nav-all {
            margin-top: 1rem;
          }

          .illust-description {
            max-width: 800px;
            margin: 2rem auto;
            padding: 1.5rem;
            background-color: #f9f9f9;
            border-radius: 8px;
            line-height: 1.8;
            font-size: 1.05rem;
          }

          .illust-description p {
            margin: 0;
            white-space: pre-wrap;
          }

          .illust-cta {
            text-align: center;
            margin: 2rem 0;
          }

          .read-more-button {
            display: inline-block;
            padding: 0.75rem 1.5rem;
            background-color: #0070f3;
            color: white;
            border-radius: 8px;
            text-decoration: none;
            font-size: 1.1rem;
            font-weight: bold;
            transition: background-color 0.2s;
          }

          .read-more-button:hover {
            background-color: #0051cc;
          }

          @media (max-width: 768px) {
            .illust-title {
              font-size: 1.5rem;
            }

            .illust-description {
              max-width: 100%;
              padding: 1rem;
              font-size: 1rem;
            }

            .nav-buttons {
              font-size: 1rem;
            }
          }

          .footer {
            margin-top: 4rem;
            padding-top: 2rem;
            border-top: 1px solid #e0e0e0;
            text-align: center;
            color: #666;
            font-size: 0.9rem;
            line-height: 1.6;
          }

          .footer a {
            color: #0070f3;
            text-decoration: none;
          }

          .footer a:hover {
            text-decoration: underline;
          }
        `}</style>
      </div>
      <div className="footer">
        (C)NISHIO Hirokazu / Visual Thinking
        <br />
        Source:{" "}
        <a
          href={`https://github.com/nishio/external_brain_in_markdown${
            props.lang === "en" ? "_english" : ""
          }/blob/main/pages/${props.pageName}.md`}
          target="_blank"
        >
          [GitHub]
        </a>
      </div>
    </>
  );
}
