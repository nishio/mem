import Link from "next/link";
import { TPageProps } from "./TPageProps";

/*
 from https://github.com/takker99/scrapbox-userscript-std/blob/0.8.5/title.ts#L28
*/
export const title_to_url = (title: string) => {
  return Array.from(title)
    .map((char, index) => {
      if (char === " ") return "_";
      if (
        !noEncodeChars.includes(char) ||
        (index === title.length - 1 && noTailChars.includes(char))
      ) {
        return encodeURIComponent(char);
      }
      return char;
    })
    .join("");
};
const noEncodeChars = '@$&+=:;",';
const noTailChars = ':;",';

export const generate_links = (projects: TPageProps[]) => {
  const links: unknown[] = [];
  const lc_to_title: { [key: string]: string } = {};
  const two_hops: { [key: string]: string[] } = {};
  const two_hops_links: unknown[] = [];

  const _to_link = (title: string, titleLc: string) => {
    const url = title_to_url(titleLc);
    return (
      <li className="page-list-item" key={title}>
        <Link href={`/${url}`} key={titleLc}>
          <a>[{title}]</a>
        </Link>
      </li>
    );
  };
  const direct_to_link = (key: string) => {
    if (lc_to_title[key] !== undefined) {
      return _to_link(lc_to_title[key], key);
    }
    const title = key.replace(/_/g, " ");
    return (
      <li className="grid related-page-list" key={title}>
        [{title}]
      </li>
    );
  };

  const to_link = (key: string) => {
    if (lc_to_title[key] !== undefined) {
      return _to_link(lc_to_title[key], key);
    }
    const title = key.replace(/_/g, " ");
    return <span key={title}>[{title}]</span>;
  };

  projects.forEach((props) => {
    if (!props.exists) return;

    props.json.relatedPages.links1hop.forEach((x) => {
      lc_to_title[x.titleLc] = x.title;
      links.push(direct_to_link(x.titleLc));
    });
    props.json.relatedPages.links2hop.forEach((x) => {
      lc_to_title[x.titleLc] = x.title;

      const key = x.linksLc.join("\t");
      if (two_hops[key] === undefined) {
        two_hops[key] = [x.titleLc];
      } else {
        two_hops[key].push(x.titleLc);
      }
    });
  });
  Object.keys(two_hops).forEach((key) => {
    const key_to_link = (key: string) => {
      const keys = key.split("\t");
      const links: (string | JSX.Element)[] = [];
      keys.forEach((x) => {
        links.push("×");
        links.push(to_link(x));
      });
      links.shift();
      return links;
    };
    two_hops_links.push(
      <li key={key}>
        → {key_to_link(key)} → {two_hops[key].map(to_link)}
      </li>
    );
  });
  return { links, two_hops_links };
};
