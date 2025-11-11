import { generate_links } from "../utils/generate_links";
import { TPageProps } from "../utils/TPageProps";
import { toHideRelatedPages } from "../pages/legacy/[page]";

export const RelatedPages = (props: { props: TPageProps; title: string }) => {
  const { links, two_hops_links } = generate_links(props.props);

  if (toHideRelatedPages.has(props.title)) {
    return null;
  }
  return (
    <div className="related-page-list">
      <h3>Related Pages</h3>
      <ul className="grid">{links}</ul>
      {two_hops_links}
    </div>
  );
};
