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

const Arrow = <span className="two-hop-symbol">→</span>;
const Cross = <span className="two-hop-symbol">×</span>;
type TLink = { titleLc: string; title: string; image?: string };
const link_to_dom = (link: TLink): JSX.Element => {
  const url = title_to_url(link.titleLc);
  return (
    <Link href={`/${url}`} key={link.titleLc}>
      <a>{link.title}</a>
    </Link>
  );
};

export const generate_links = (props: TPageProps) => {
  const links: unknown[] = [];
  const lc_to_title: { [key: string]: string } = {};
  const lc_to_linkobj: { [key: string]: TLink } = {};
  const two_hops: { [key: string]: string[] } = {};
  const two_hops_links: unknown[] = [];

  const link_to_card = (x: TLink) => {
    const url = title_to_url(x.titleLc);
    const img = x.image ? (
      <div className="icon">
        <img
          loading="lazy"
          // src="https://gyazo.com/0a767996e1e70b9c8447940ae3533226/max_size/400"
          src={x.image}
        />
      </div>
    ) : null;
    return (
      <li className="page-list-item" key={x.title}>
        <div className="header">{link_to_dom(x)}</div>
        {img}
      </li>
    );
  };

  props.json.relatedPages.links1hop.forEach((x) => {
    lc_to_title[x.titleLc] = x.title;
    lc_to_linkobj[x.titleLc] = x;
    links.push(link_to_card(x));
  });

  const lc_to_dom = (lc: string): JSX.Element | string => {
    const linkobj = lc_to_linkobj[lc];
    if (linkobj !== undefined) {
      return link_to_dom(linkobj);
    }
    const title = lc_to_title[lc] || lc;
    return <span className="no-page">{title}</span>;
  };

  const lc_to_card = (lc: string): JSX.Element | null => {
    const linkobj = lc_to_linkobj[lc];
    if (linkobj !== undefined) {
      return link_to_card(linkobj);
    }
    return null;
  };

  props.json.relatedPages.links2hop.forEach((x) => {
    lc_to_title[x.titleLc] = x.title;
    lc_to_linkobj[x.titleLc] = x;

    const key = x.linksLc.join("\t");
    if (two_hops[key] === undefined) {
      two_hops[key] = [x.titleLc];
    } else {
      two_hops[key].push(x.titleLc);
    }
  });

  Object.keys(two_hops).forEach((key) => {
    const key_to_link = (key: string) => {
      const keys = key.split("\t");
      const links: (string | JSX.Element)[] = [];

      keys.forEach((lc) => {
        links.push(Cross);
        links.push(lc_to_dom(lc));
      });
      links.shift();
      return links;
    };

    two_hops_links.push(
      <ul className="grid" key={key}>
        <li className="relation-label">
          <div className="header">
            {Arrow}
            {key_to_link(key)}
            {Arrow}
          </div>
        </li>
        {two_hops[key].map(lc_to_card)}
      </ul>
    );
  });

  const two_hops_links_dom =
    two_hops_links.length > 0 ? <div>{two_hops_links}</div> : null;

  return { links, two_hops_links: two_hops_links_dom };
};
