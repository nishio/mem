import { Page as PageType } from "@progfay/scrapbox-parser";
import { Block } from "./Block";

export const Page = (props: {
  blocks: PageType;
  hide_title: boolean;
  children?: any;
}) => (
  <div className="page">
    {props.blocks.map((block, i) => (
      <Block key={i} block={block} hide_title={props.hide_title} />
    ))}
    {props.children}
  </div>
);
