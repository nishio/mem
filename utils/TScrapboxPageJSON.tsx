export type TScrapboxPageJSON = {
  image: string;
  descriptions: string[];
  lines: { text: string }[];
  links: string[];
  relatedPages: {
    links1hop: { title: string; titleLc: string }[];
    links2hop: {
      title: string;
      titleLc: string;
      linksLc: string[];
    }[];
  };
};
