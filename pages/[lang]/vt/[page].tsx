import { GetStaticProps, GetStaticPaths } from "next";
import Head from "next/head";
import Link from "next/link";
import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { marked } from "marked";
import { extractDescription } from "../../../utils/extractDescription";
import { useState } from "react";
import {
  buildVtGraph,
  getDirectVtLinks,
  getSharedReferenceVtLinks,
  loadVtConfig,
  DirectVtLink,
  SharedRefGroup,
} from "../../../utils/vt_graph";

type IllustConfig = {
  illusts: Array<{
    id: number;
    page_ja: string;
    page_en: string | null;
    tags: string[];
  }>;
};

type VtLinkItem = {
  id: number;
  imageUrl: string | null;
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
  noEnglishVersion: boolean;
  jaPageName: string;
  directVtLinks: VtLinkItem[];
  sharedRefGroups: Array<{
    via: string;
    vtLinks: VtLinkItem[];
  }>;
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
        noEnglishVersion: false,
        jaPageName: "",
        directVtLinks: [],
        sharedRefGroups: [],
      },
    };
  }

  let pageName: string;
  let hasEnVersion = false;
  let noEnglishVersion = false;

  if (lang === "ja") {
    pageName = illustItem.page_ja;
    hasEnVersion = illustItem.page_en !== null;
  } else {
    if (!illustItem.page_en) {
      // English version not available - use Japanese page to get image
      noEnglishVersion = true;
      pageName = illustItem.page_ja;
      hasEnVersion = false;
    } else {
      pageName = illustItem.page_en;
      hasEnVersion = true;
    }
  }

  // Build file path - use Japanese file if English version not available
  const filePathLang = noEnglishVersion ? "ja" : lang;
  const filePath = path.join(
    process.cwd(),
    "data",
    filePathLang,
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
        noEnglishVersion,
        jaPageName: illustItem.page_ja,
        directVtLinks: [],
        sharedRefGroups: [],
      },
    };
  }

  // Always extract image from Japanese version (language-independent)
  const jaFilePath = path.join(
    process.cwd(),
    "data",
    "ja",
    "pages",
    `${illustItem.page_ja}.md`
  );
  const jaFileContent = fs.existsSync(jaFilePath)
    ? fs.readFileSync(jaFilePath, "utf-8")
    : "";
  const imageUrl = jaFileContent ? extractGyazoImage(jaFileContent) : null;

  // Read and parse markdown file for description and content (language-specific)
  const fileContent = fs.readFileSync(filePath, "utf-8");
  const { data, content } = matter(fileContent);

  // Extract description first (to preserve metadata filtering)
  const rawDescription = noEnglishVersion ? "" : extractDescription(content);
  
  // Process wiki-style links in the extracted description
  const processedDescription = noEnglishVersion || !rawDescription
    ? ""
    : processWikiLinks(rawDescription, lang);
  
  // Convert description to HTML
  const shortDescription = noEnglishVersion || !processedDescription
    ? ""
    : await marked.parse(processedDescription);

  // Process wiki-style links in full content (only if not noEnglishVersion)
  const processedContent = noEnglishVersion ? "" : processWikiLinks(content, lang);

  // Convert markdown to HTML (only if not noEnglishVersion)
  const htmlContent = noEnglishVersion ? "" : await marked.parse(processedContent);

  const currentIndex = config.illusts.findIndex((item) => item.id === parseInt(page, 10));

  const vtGraph = buildVtGraph(config.illusts);
  
  const directLinks = getDirectVtLinks(illustItem.id, vtGraph);
  const directVtLinks: VtLinkItem[] = directLinks.map((link) => {
    const linkPageJa = vtGraph.idToPageJa.get(link.id) || "";
    const linkJaFilePath = path.join(
      process.cwd(),
      "data",
      "ja",
      "pages",
      `${linkPageJa}.md`
    );
    const linkJaFileContent = fs.existsSync(linkJaFilePath)
      ? fs.readFileSync(linkJaFilePath, "utf-8")
      : "";
    const linkImageUrl = linkJaFileContent ? extractGyazoImage(linkJaFileContent) : null;
    
    return {
      id: link.id,
      imageUrl: linkImageUrl,
    };
  });

  // Get direct link IDs to exclude from shared references
  const directLinkIds = new Set(directLinks.map(link => link.id));

  const sharedGroups = getSharedReferenceVtLinks(illustItem.id, vtGraph);
  const sharedRefGroups = sharedGroups
    .map((group) => {
      // Filter out VT IDs that are already in direct links
      const filteredVtIds = group.vtIds.filter(vtId => !directLinkIds.has(vtId));

      if (filteredVtIds.length === 0) {
        return null; // Skip groups with no remaining VT IDs
      }

      const vtLinks: VtLinkItem[] = filteredVtIds.map((vtId) => {
        const vtPageJa = vtGraph.idToPageJa.get(vtId) || "";
        const vtJaFilePath = path.join(
          process.cwd(),
          "data",
          "ja",
          "pages",
          `${vtPageJa}.md`
        );
        const vtJaFileContent = fs.existsSync(vtJaFilePath)
          ? fs.readFileSync(vtJaFilePath, "utf-8")
          : "";
        const vtImageUrl = vtJaFileContent ? extractGyazoImage(vtJaFileContent) : null;

        return {
          id: vtId,
          imageUrl: vtImageUrl,
        };
      });

      return {
        via: group.via,
        vtLinks,
      };
    })
    .filter((group): group is NonNullable<typeof group> => group !== null);

  return {
    props: {
      title: noEnglishVersion ? illustItem.page_ja : (data.title || pageName),
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
      noEnglishVersion,
      jaPageName: illustItem.page_ja,
      directVtLinks,
      sharedRefGroups,
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
            The illustration "{props.page}" does not exist.
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
        <span style={{ margin: "0 0.5em" }}> &gt; </span>
        <Link href={`/${props.lang}/vt`} id="to-top">
          Visual Thinking
        </Link>
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
            {getPrevId() ? (
              <Link href={`/${props.lang}/vt/${getPrevId()}`} className="nav-button">
                ← Previous
              </Link>
            ) : (
              <span className="nav-button disabled">← Previous</span>
            )}
            <Link href={`/${props.lang}/vt/${getRandomId()}`} className="nav-button">
              Random
            </Link>
            {getNextId() ? (
              <Link href={`/${props.lang}/vt/${getNextId()}`} className="nav-button">
                Next →
              </Link>
            ) : (
              <span className="nav-button disabled">Next →</span>
            )}
          </div>
          <div className="nav-position">
            {props.currentIndex + 1} / {props.totalIllusts}
          </div>
          <div className="nav-all">
            <Link href={`/${props.lang}/vt`} className="nav-secondary">
              {props.lang === "ja" ? "エントランスに戻る" : "Back to Entrance"}
            </Link>
            <Link href={`/${props.lang}/vt/latest`} className="nav-secondary">
              Latest
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
              {props.noEnglishVersion ? (
                <>
                  <h2 className="modal-title">English Version Not Available Yet</h2>
                  <p className="modal-description">
                    This visual thinking illustration does not have an English description yet.
                    You can view the Japanese version instead.
                  </p>
                  <a
                    href={`/ja/${props.jaPageName}`}
                    className="modal-link"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    View Japanese Version →
                  </a>
                </>
              ) : (
                <>
                  <h2 className="modal-title">{props.title}</h2>
                  {props.shortDescription && (
                    <div
                      className="modal-description"
                      dangerouslySetInnerHTML={{ __html: props.shortDescription }}
                    />
                  )}
                  <a
                    href={`/${props.lang}/${props.pageName}`}
                    className="modal-link"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {props.lang === "ja" ? "詳細を読む →" : "Read More →"}
                  </a>
                </>
              )}
            </div>
          </div>
        )}

        {props.directVtLinks.length > 0 && (
          <div className="vt-links-section">
            <div className="illust-grid">
              {props.directVtLinks.map((link) => (
                <Link key={link.id} href={`/${props.lang}/vt/${link.id}`}>
                  <div className="illust-tile">
                    {link.imageUrl && (
                      <img
                        src={link.imageUrl}
                        alt={`VT ${link.id}`}
                        className="illust-image"
                      />
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {props.sharedRefGroups.length > 0 && (
          <div className="vt-links-section">
            {props.sharedRefGroups.map((group, groupIndex) => (
              <div key={groupIndex} className="shared-group">
                <div className="illust-grid">
                  {group.vtLinks.map((link) => (
                    <Link key={link.id} href={`/${props.lang}/vt/${link.id}`}>
                      <div className="illust-tile">
                        {link.imageUrl && (
                          <img
                            src={link.imageUrl}
                            alt={`VT ${link.id}`}
                            className="illust-image"
                          />
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
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
            display: flex;
            justify-content: center;
            align-items: center;
            gap: 0.75rem;
            margin-bottom: 1rem;
            flex-wrap: wrap;
          }

          .nav-button {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            min-height: 44px;
            min-width: 44px;
            padding: 0.5rem 1.2rem;
            font-size: 1.1rem;
            font-family: monospace;
            text-decoration: none;
            background-color: white;
            border: 1px solid #ddd;
            border-radius: 6px;
            cursor: pointer;
            transition: all 0.2s;
          }

          .nav-button:hover {
            border-color: #0070f3;
            background-color: #f8f9fa;
            transform: translateY(-1px);
          }

          .nav-button.disabled {
            color: #ccc;
            cursor: default;
            background-color: #f9f9f9;
            border-color: #e0e0e0;
          }

          .nav-button.disabled:hover {
            transform: none;
            border-color: #e0e0e0;
            background-color: #f9f9f9;
          }

          .nav-position {
            font-size: 0.95rem;
            font-family: monospace;
            color: #666;
            margin-bottom: 1rem;
          }

          .nav-all {
            display: flex;
            justify-content: center;
            align-items: center;
            gap: 1rem;
            margin-top: 0.5rem;
          }

          .nav-secondary {
            font-size: 1rem;
            text-decoration: none;
            color: #0070f3;
            padding: 0.3rem 0.6rem;
            border-radius: 4px;
            transition: background-color 0.2s;
          }

          .nav-secondary:hover {
            background-color: #f0f0f0;
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
            .nav-button {
              font-size: 1rem;
              padding: 0.5rem 1rem;
              min-width: 100px;
            }

            .nav-position {
              font-size: 0.9rem;
            }

            .nav-secondary {
              font-size: 0.95rem;
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

          .vt-links-section {
            margin-top: 1.5rem;
            padding-top: 1rem;
            border-top: 1px solid #e0e0e0;
          }

          .section-title {
            font-size: 1.5rem;
            margin-bottom: 1.5rem;
            text-align: center;
          }

          .shared-group {
            margin-bottom: 0.5rem;
          }

          .illust-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, 184px);
            gap: 0.5rem;
            justify-content: center;
            margin-top: 0.5rem;
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
            cursor: pointer;
            transition: transform 0.2s, box-shadow 0.2s;
          }

          .illust-tile:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
          }

          .illust-grid .illust-image {
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
        `}</style>
      </div>
      <div className="footer">
        (C)NISHIO Hirokazu / Visual Thinking
        <br />
        Source:{" "}
        <a
          href={`https://github.com/nishio/external_brain_in_markdown${props.lang === "en" ? "_english" : ""
            }/blob/main/pages/${props.pageName}.md`}
          target="_blank"
        >
          [GitHub]
        </a>
      </div>
    </>
  );
}
