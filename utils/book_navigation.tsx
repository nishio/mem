import Link from "next/link";
import React from "react";
import { title_to_url } from "./generate_links";
import nav from "../book_navigation.json";

export const Prev = (current: string) => {
  // @ts-ignore
  const title = nav.prev[current];
  if (title) {
    const url = title_to_url(title);
    return (
      <>
        {"[<<< Previous:"}
        <Link href={`/${url}`} key={title}>
          <a>{title}</a>
        </Link>
        {"]"}
      </>
    );
  }
  return null;
};

export const Next = (current: string) => {
  // @ts-ignore
  const title = nav.next[current];
  if (title) {
    const url = title_to_url(title);
    return (
      <>
        {"[Next: "}
        <Link href={`/${url}`} key={title}>
          <a>{title}</a>
        </Link>
        {" >>>]"}
      </>
    );
  }
  return null;
};

export const PrevNext = (current: string) => {
  const prev = Prev(current);
  const next = Next(current);
  if (prev || next) {
    return (
      <div>
        {prev} {next}
      </div>
    );
  }
  return null;
};

export const Breadcrumb = (current: string) => {
  // @ts-ignore
  let x = nav.parent[current];
  if (x === undefined) return null;

  const parents = [];
  while (x !== undefined) {
    parents.unshift(x);
    // @ts-ignore
    x = nav.parent[x];
  }
  const root = "Engineer's way of creating knowledge";
  const root_url = title_to_url(root);
  const links = parents.map((x) => {
    const url = title_to_url(x);
    return (
      <span key={x}>
        {" > "}
        <Link href={`/${url}`}>
          <a>{x}</a>
        </Link>
      </span>
    );
  });
  return (
    <p>
      <Link href={`/${root_url}`} key={root}>
        <a>{root}</a>
      </Link>
      {links}
      {" > "} {current}
    </p>
  );
};
