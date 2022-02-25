import { parse, Page as PageType } from "@progfay/scrapbox-parser";
import { GetStaticProps, GetStaticPaths } from "next";

export type Props = {
  done: boolean;
  project: string | string[];
  titles: Array<any>;
};

export const getStaticProps: GetStaticProps<Props> = async (ctx) => {
  const project = "nishio";
  const url = `https://scrapbox.io/api/pages/${project}/search/titles`;
  const response = await fetch(url);
  let json = (await response.json()) as Array<any>;
  const titles = [...json];

  for (let i = 0; i < 30; i++) {
    const last = json.slice(-1)[0];
    const last_id = last.id;
    console.log(last_id);
    const url = `https://scrapbox.io/api/pages/${project}/search/titles?followingId=${last_id}`;
    const response = await fetch(url);
    json = (await response.json()) as Array<any>;
    titles.push(...json.slice(1));
    if (json.length === 1) {
      break;
    }
  }

  console.log(titles.length);
  return {
    props: {
      project: project,
      done: true,
      titles: titles,
    },
    revalidate: 60 * 60 * 12,
  };
};

export const getStaticPaths: GetStaticPaths = async () => {
  return {
    paths: [],
    fallback: true,
  };
};

const LINE_PER_SECTION = 10;
const day = 60 * 60 * 24 * 1000;
const year = day * 365;

const menu_title = "SRS振り返り";

// score: 0 is best
const sections: { title: string; score: (diff: number) => number }[] = [
  {
    title: "100日前",
    score: (diff) => Math.abs(diff - 100 * day),
  },
  {
    title: "1年前",
    score: (diff) => Math.abs(diff - year),
  },
  {
    title: "n年前",
    score: (diff) => {
      // excludes 1年前
      if (diff < year * 1.5) {
        return year;
      }
      const mod = diff % year;
      return Math.min(mod, year - mod);
    },
  },
];

type TScoredPage = {
  updated: number;
  title: string;
};
export const get_SRS = (props: Props) => {
  // calc scores
  const now = Date.now();
  const scored_pages: TScoredPage[] = [];
  props.titles.forEach((page) => {
    const updated = page.updated;
    if (updated === 0) return;
    const diff = now - updated * 1000;
    const p = { ...page };
    sections.forEach((section) => {
      p[section.title] = section.score(diff);
    });
    scored_pages.push(p);
  });

  // generate lists
  const title = `${props.project} ${menu_title} ${strftime(new Date())}`;

  const lines = [title];

  sections.forEach((section) => {
    lines.push(section.title);
    // @ts-ignore
    scored_pages.sort((a, b) => a[section.title] - b[section.title]);
    scored_pages.slice(0, LINE_PER_SECTION).forEach((page) => {
      // @ts-ignore
      if (page[section.title] > year / 2) return;
      const title = page.title;
      const date = strftime(new Date(page.updated * 1000));
      lines.push(` ${date} [${title}]`);
    });
    lines.push("");
  });
  const content = parse(lines.join("\n"));
  return content;
};

function pad(number: number) {
  if (number < 10) {
    return "0" + number;
  }
  return number;
}

function strftime(d: Date) {
  return (
    d.getUTCFullYear() +
    "-" +
    pad(d.getUTCMonth() + 1) +
    "-" +
    pad(d.getUTCDate())
  );
}
