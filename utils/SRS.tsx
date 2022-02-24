import Link from "next/link";
import { Props } from "../tmp/[project]/SRS";
import { parse, Page as PageType } from "@progfay/scrapbox-parser";

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
