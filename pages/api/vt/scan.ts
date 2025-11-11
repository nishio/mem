import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { NextApiRequest, NextApiResponse } from "next";

type ScanResult = {
  pageName: string;
  title: string;
  imageUrl: string;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const pagesDir = path.join(process.cwd(), "data", "ja", "pages");
  const configPath = path.join(process.cwd(), "vt_config.json");

  // Read existing config
  const configContent = fs.readFileSync(configPath, "utf-8");
  const config = JSON.parse(configContent);
  const registeredPages = new Set(config.illusts.map((i: any) => i.page_ja));
  const skippedPages = new Set(config.skipped || []);

  // Scan pages
  const files = fs.readdirSync(pagesDir);
  const results: ScanResult[] = [];

  for (const file of files) {
    if (!file.endsWith(".md")) continue;

    const pageName = file.replace(/\.md$/, "");
    if (registeredPages.has(pageName)) continue; // Skip registered
    if (skippedPages.has(pageName)) continue; // Skip skipped

    const filePath = path.join(pagesDir, file);
    const fileContent = fs.readFileSync(filePath, "utf-8");
    const { data, content } = matter(fileContent);

    // Check for Gyazo image
    const gyazoPattern = /!\[.*?\]\((https:\/\/gyazo\.com\/[a-f0-9]+(?:\/thumb\/\d+)?)\)/i;
    const match = content.match(gyazoPattern);

    if (match) {
      results.push({
        pageName,
        title: data.title || pageName,
        imageUrl: match[1],
      });
    }
  }

  return res.status(200).json({ results });
}
