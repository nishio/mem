import React from "react";
import {
  Block as BlockType,
  Title as TitleType,
  CodeBlock as CodeBlockType,
  Table as TableType,
  Line as LineType,
} from "@progfay/scrapbox-parser";
import { useRouter } from "next/router";
import { Node } from "./Node";

type Props = {
  block: BlockType;
  hide_title: boolean;
};
export const Block = (props: Props) => {
  const { block, hide_title } = props;
  switch (block.type) {
    case "title":
      if (hide_title) return null;
      return <Title {...block} />;
    case "codeBlock":
      return <CodeBlock {...block} />;
    case "table":
      return <Table {...block} />;
    case "line":
      return <Line {...block} />;
  }
};

const BlockBase = (props: { indent: number; children: React.ReactNode }) => (
  <div style={{ marginLeft: 1.5 * props.indent + "em" }} className="line">
    {props.children}
  </div>
);

const Title = (props: TitleType) => (
  <div className="line line-title">
    <span>{props.text}</span>
  </div>
);

const CodeBlock = (props: CodeBlockType) => {
  const { project, page } = useRouter().query;
  if (props.fileName === "on_scrapbox") {
    return null;
  }
  const path = `https://scrapbox.io/api/code/${project}/${page}/${props.fileName}`;

  return (
    <BlockBase indent={props.indent}>
      <code className="code-block">
        <span className="code-block-start" title={props.fileName}>
          {props.fileName.includes(".") ? (
            <a href={path}>{props.fileName}</a>
          ) : (
            <>{props.fileName}</>
          )}
        </span>
        <div style={{ marginLeft: "1.5em" }}>{props.content}</div>
      </code>
    </BlockBase>
  );
};

const Table = (props: TableType) => {
  const { project, page } = useRouter().query;
  const path = `https://scrapbox.io/api/table/${project}/${page}/${props.fileName}.csv`;

  return (
    <BlockBase indent={props.indent}>
      <div className="table-block">
        <span className="table-block-start">
          <a href={path}>{props.fileName}</a>
        </span>
        <table>
          {props.cells.map((rows) => (
            <tr>
              {rows.map((columns) => (
                <td className="cell">
                  {columns.map((node) => (
                    <Node {...node} />
                  ))}
                </td>
              ))}
            </tr>
          ))}
        </table>
      </div>
    </BlockBase>
  );
};

const Line = (props: LineType) => (
  <BlockBase indent={props.indent}>
    {!props.nodes.length ? (
      <br />
    ) : (
      props.nodes.map((node, i) => <Node key={i} {...node} />)
    )}
  </BlockBase>
);
