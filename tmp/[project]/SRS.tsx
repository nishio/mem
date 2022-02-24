import { GetStaticProps, GetStaticPaths } from "next";
import { get_SRS } from "../../utils/SRS";
import { Page } from "../../components/Page";

export type Props = {
  done: boolean;
  project: string | string[];
  titles: Array<any>;
};
export const getStaticProps: GetStaticProps<Props> = async (ctx) => {
  // const page = encodeURIComponent(ctx.params.page as string)
  // const en = await getData('intellitech-en', page)
  // const ja = await getData('nishio', page)
  const project = ctx.params!!.project as string;
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

const View = (props: Props) => {
  if (!props.done) return <>loading...</>;
  // console.log(props)
  const content = get_SRS(props);
  return (
    <>
      <a href={`https://scrapbox.io/${props.project}`} target="_blank">
        [Scrapbox/{props.project}]
      </a>

      <Page blocks={content} hide_title={false} />
    </>
  );
};
export default View;
