import { GetStaticProps, GetStaticPaths } from "next";
import Head from "next/head";
import Link from "next/link";
import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { marked } from "marked";
import { extractDescription } from "../../../utils/extractDescription";
import { useState } from "react";

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
  const shortDescription = extractDescription(content);

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
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (!props.exists) {
    return (
      <>
        <Head>
          <title>Illustration Not Found - NISHIO Hirokazu</title>
        </Head>
        <div className="document-header">
          <Link href="/" id="to-top">
            NISHIO Hirokazu
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
              Back to Visual Thinking list
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
        <Link href="/" id="to-top">
          NISHIO Hirokazu
        </Link>
        <span className="header-util">
          [{props.lang === "ja" ? "日本語" : "English"}]
        </span>
        {props.hasEnVersion && (
          <Link href={`/${otherLang}/vt/${props.page}`} className="header-util">
            [{otherLang === "ja" ? "日本語" : "English"}]
          </Link>
        )}
      </div>
      <div className="page illust-page">
        {props.imageUrl && (
          <div className="illust-image-container">
            <img
              src={props.imageUrl}
              alt="Visual Thinking"
              className="illust-image"
            />
          </div>
        )}

        <div className="description-button-container">
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="description-button"
          >
            {props.lang === "ja" ? "説明を見る" : "Show Description"}
          </button>
        </div>

        <div className="illust-nav">
          <div className="nav-buttons">
            <Link href={`/${props.lang}/vt/${getFirstId()}`} className="nav-link">
              |&lt;
            </Link>
            {getPrevId() ? (
              <Link href={`/${props.lang}/vt/${getPrevId()}`} className="nav-link">
                &lt; Prev
              </Link>
            ) : (
              <span className="nav-link disabled">&lt; Prev</span>
            )}
            <Link href={`/${props.lang}/vt/${getRandomId()}`} className="nav-link">
              Random
            </Link>
            {getNextId() ? (
              <Link href={`/${props.lang}/vt/${getNextId()}`} className="nav-link">
                Next &gt;
              </Link>
            ) : (
              <span className="nav-link disabled">Next &gt;</span>
            )}
            <Link href={`/${props.lang}/vt/${getLastId()}`} className="nav-link">
              &gt;|
            </Link>
          </div>
          <div className="nav-all">
            <Link href={`/${props.lang}/vt`}>
              All Visual Thinking
            </Link>
          </div>
        </div>

        {/* Modal */}
        {isModalOpen && (
          <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                className="modal-close"
                onClick={() => setIsModalOpen(false)}
                aria-label="Close"
              >
                ×
              </button>
              <h2 className="modal-title">{props.title}</h2>
              {props.shortDescription && (
                <p className="modal-description">{props.shortDescription}</p>
              )}
              <a
                href={`/${props.lang}/${props.pageName}`}
                className="modal-link"
                target="_blank"
                rel="noopener noreferrer"
              >
                {props.lang === "ja" ? "詳細を読む →" : "Read More →"}
              </a>
            </div>
          </div>
        )}

        <style jsx>{`
          .illust-page {
            max-width: 1400px !important;
            margin: 16px auto !important;
          }

          .illust-image-container {
            text-align: center;
            margin: 0 auto 1.5rem;
          }

          .illust-image {
            width: 100%;
            max-width: 1200px;
            height: auto;
            max-height: 80vh;
            object-fit: contain;
          }

          .description-button-container {
            text-align: center;
            margin: 1.5rem 0 2rem;
          }

          .description-button {
            padding: 0.75rem 2rem;
            font-size: 1.1rem;
            font-weight: bold;
            background-color: #0070f3;
            color: white;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            transition: background-color 0.2s;
          }

          .description-button:hover {
            background-color: #0051cc;
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

          .modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-color: rgba(0, 0, 0, 0.7);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
          }

          .modal-content {
            background: white;
            padding: 2rem;
            border-radius: 12px;
            max-width: 600px;
            width: 90%;
            max-height: 80vh;
            overflow-y: auto;
            position: relative;
          }

          .modal-close {
            position: absolute;
            top: 1rem;
            right: 1rem;
            background: none;
            border: none;
            font-size: 2rem;
            cursor: pointer;
            color: #666;
            line-height: 1;
            padding: 0;
            width: 2rem;
            height: 2rem;
          }

          .modal-close:hover {
            color: #000;
          }

          .modal-title {
            margin: 0 0 1.5rem 0;
            font-size: 1.75rem;
            padding-right: 2rem;
          }

          .modal-description {
            line-height: 1.8;
            font-size: 1.05rem;
            margin-bottom: 2rem;
            white-space: pre-wrap;
          }

          .modal-link {
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

          .modal-link:hover {
            background-color: #0051cc;
          }

          @media (max-width: 768px) {
            .nav-buttons {
              font-size: 1rem;
            }

            .description-button {
              font-size: 1rem;
              padding: 0.6rem 1.5rem;
            }

            .modal-content {
              padding: 1.5rem;
            }

            .modal-title {
              font-size: 1.5rem;
            }

            .modal-description {
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
