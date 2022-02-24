import { Page as PageType } from "@progfay/scrapbox-parser";
import { TScrapboxPageJSON } from "./TScrapboxPageJSON";

export type TPageProps = {
  date: number;
  content: PageType;
  exists: boolean;
  project: string;
  page: string;
  json: TScrapboxPageJSON;
};
