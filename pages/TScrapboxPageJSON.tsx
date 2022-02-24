export type TScrapboxPageJSON = {
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
