import { GetStaticProps, GetStaticPaths } from "next";
import Head from "next/head";
import Link from "next/link";
import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { marked } from "marked";

type Props = {
  title: string;
  content: string;
  lang: string;
  page: string;
  exists: boolean;
};

// Process wiki-style links in markdown
function processWikiLinks(markdown: string, lang: string): string {
  // Replace [[link]] with [link](/lang/link)
  return markdown.replace(/\[\[([^\]]+)\]\]/g, (match, linkText) => {
    return `[${linkText}](/${lang}/${encodeURIComponent(linkText)})`;
  });
}

export const getStaticProps: GetStaticProps<Props> = async (ctx) => {
  const lang = ctx.params!!.lang as string;
  const page = ctx.params!!.page as string;

  // Validate language - redirect to /legacy/<page> if not en or ja
  if (lang !== "ja" && lang !== "en") {
    return {
      redirect: {
        destination: `/legacy/${page}`,
        permanent: false,
      },
    };
  }

  // Build file path
  const filePath = path.join(
    process.cwd(),
    "data",
    lang,
    "pages",
    `${page}.md`
  );

  // Check if file exists
  if (!fs.existsSync(filePath)) {
    return {
      props: {
        title: page,
        content: "",
        lang,
        page,
        exists: false,
      },
      revalidate: 30,
    };
  }

  // Read and parse markdown file
  const fileContent = fs.readFileSync(filePath, "utf-8");
  const { data, content } = matter(fileContent);

  // Process wiki-style links
  const processedContent = processWikiLinks(content, lang);

  // Convert markdown to HTML
  const htmlContent = await marked.parse(processedContent);

  return {
    props: {
      title: data.title || page,
      content: htmlContent,
      lang,
      page,
      exists: true,
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

export default function MarkdownPage(props: Props) {
  if (!props.exists) {
    return (
      <>
        <Head>
          <title>Page Not Found - NISHIO Hirokazu</title>
        </Head>
        <div className="document-header">
          <Link href="/">
            <a id="to-top">NISHIO Hirokazu</a>
          </Link>
        </div>
        <div className="page">
          <h1>Page Not Found</h1>
          <p>The page "{props.page}" does not exist in {props.lang} language.</p>
          <p>
            {props.lang === "ja" ? (
              <Link href={`/en/${props.page}`}>
                <a>Try English version</a>
              </Link>
            ) : (
              <Link href={`/ja/${props.page}`}>
                <a>Try Japanese version</a>
              </Link>
            )}
          </p>
        </div>
      </>
    );
  }

  const otherLang = props.lang === "ja" ? "en" : "ja";
  const title = decodeURIComponent(props.page).replace(/_/g, " ");

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
        <Link href={`/${otherLang}/${props.page}`}>
          <a className="header-util">
            [{otherLang === "ja" ? "日本語" : "English"}]
          </a>
        </Link>
      </div>
      <div className="page">
        <h1>{props.title}</h1>
        <div dangerouslySetInnerHTML={{ __html: props.content }} />
      </div>
      <hr></hr>
      <div>
        (C)NISHIO Hirokazu / Converted from Markdown ({props.lang})
        <br />
        Source:{" "}
        <a
          href={`https://github.com/nishio/external_brain_in_markdown${
            props.lang === "en" ? "_english" : ""
          }/blob/main/pages/${props.page}.md`}
          target="_blank"
        >
          [GitHub]
        </a>
      </div>
    </>
  );
}
