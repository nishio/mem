import { GetStaticProps, GetStaticPaths } from "next";
import Head from "next/head";
import Link from "next/link";
import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { marked } from "marked";

type IllustConfig = {
  illusts: Array<{
    id: string;
    page_ja: string;
    page_en: string | null;
    tags: string[];
  }>;
};

type Props = {
  title: string;
  content: string;
  imageUrl: string | null;
  lang: string;
  page: string;
  exists: boolean;
  pageName: string;
  illustId: string;
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

  const configPath = path.join(process.cwd(), "illust_config.json");
  const configContent = fs.readFileSync(configPath, "utf-8");
  const config: IllustConfig = JSON.parse(configContent);

  const illustItem = config.illusts.find((item) => item.id === page);

  if (!illustItem) {
    return {
      props: {
        title: page,
        content: "",
        imageUrl: null,
        lang,
        page,
        exists: false,
        pageName: "",
        illustId: page,
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
          destination: `/ja/illust/${page}`,
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
        imageUrl: null,
        lang,
        page,
        exists: false,
        pageName,
        illustId: illustItem.id,
        hasEnVersion,
        totalIllusts: config.illusts.length,
        currentIndex: config.illusts.findIndex((item) => item.id === page),
      },
    };
  }

  // Read and parse markdown file
  const fileContent = fs.readFileSync(filePath, "utf-8");
  const { data, content } = matter(fileContent);

  const imageUrl = extractGyazoImage(content);

  // Process wiki-style links
  const processedContent = processWikiLinks(content, lang);

  // Convert markdown to HTML
  const htmlContent = await marked.parse(processedContent);

  const currentIndex = config.illusts.findIndex((item) => item.id === page);

  return {
    props: {
      title: data.title || pageName,
      content: htmlContent,
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
            <Link href={`/${props.lang}/illust`}>
              <a>Back to illustration list</a>
            </Link>
          </p>
        </div>
      </>
    );
  }

  const otherLang = props.lang === "ja" ? "en" : "ja";

  const getFirstId = () => "001";
  const getLastId = () => {
    const paddedNum = String(props.totalIllusts).padStart(3, "0");
    return paddedNum;
  };
  const getPrevId = () => {
    if (props.currentIndex <= 0) return null;
    return String(props.currentIndex).padStart(3, "0");
  };
  const getNextId = () => {
    if (props.currentIndex >= props.totalIllusts - 1) return null;
    return String(props.currentIndex + 2).padStart(3, "0");
  };
  const getRandomId = () => {
    const randomIndex = Math.floor(Math.random() * props.totalIllusts) + 1;
    return String(randomIndex).padStart(3, "0");
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
          <Link href={`/${otherLang}/illust/${props.page}`}>
            <a className="header-util">
              [{otherLang === "ja" ? "日本語" : "English"}]
            </a>
          </Link>
        )}
      </div>
      <div className="page">
        <h1>{props.title}</h1>

        {props.imageUrl && (
          <div style={{ textAlign: "center", margin: "2rem 0" }}>
            <img
              src={props.imageUrl}
              alt={props.title}
              style={{ maxWidth: "100%", height: "auto" }}
            />
          </div>
        )}

        <div dangerouslySetInnerHTML={{ __html: props.content }} />

        <hr />

        <div style={{ textAlign: "center", margin: "2rem 0" }}>
          <div style={{ fontSize: "1.2rem", fontFamily: "monospace" }}>
            <Link href={`/${props.lang}/illust/${getFirstId()}`}>
              <a style={{ margin: "0 0.5rem" }}>|&lt;</a>
            </Link>
            {getPrevId() ? (
              <Link href={`/${props.lang}/illust/${getPrevId()}`}>
                <a style={{ margin: "0 0.5rem" }}>&lt; Prev</a>
              </Link>
            ) : (
              <span
                style={{ margin: "0 0.5rem", color: "#ccc", cursor: "default" }}
              >
                &lt; Prev
              </span>
            )}
            <Link href={`/${props.lang}/illust/${getRandomId()}`}>
              <a style={{ margin: "0 0.5rem" }}>Random</a>
            </Link>
            {getNextId() ? (
              <Link href={`/${props.lang}/illust/${getNextId()}`}>
                <a style={{ margin: "0 0.5rem" }}>Next &gt;</a>
              </Link>
            ) : (
              <span
                style={{ margin: "0 0.5rem", color: "#ccc", cursor: "default" }}
              >
                Next &gt;
              </span>
            )}
            <Link href={`/${props.lang}/illust/${getLastId()}`}>
              <a style={{ margin: "0 0.5rem" }}>&gt;|</a>
            </Link>
          </div>
          <div style={{ marginTop: "1rem" }}>
            <Link href={`/${props.lang}/illust`}>
              <a>All Illustrations</a>
            </Link>
          </div>
        </div>
      </div>
      <hr />
      <div>
        (C)NISHIO Hirokazu / Illustration View
        <br />
        Original page:{" "}
        <Link href={`/${props.lang}/${props.pageName}`}>
          <a>[{props.pageName}]</a>
        </Link>
        {" | "}
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
