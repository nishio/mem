import { NextApiRequest, NextApiResponse } from "next";
import fs from "fs";
import path from "path";
import matter from "gray-matter";

type RelatedPage = {
  pageName: string;
  title: string;
  imageUrl: string;
  linkType: "forward" | "backward" | "2hop";
  status?: "registered" | "skipped" | "available";
};

/**
 * Fetch related pages from a Scrapbox page URL
 * This calls the Scrapbox API to get 1-hop and 2-hop links
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { url } = req.body;

  if (!url || typeof url !== "string") {
    return res.status(400).json({ error: "URL is required" });
  }

  // Parse Scrapbox URL: https://scrapbox.io/PROJECT/PAGE
  const urlPattern = /https:\/\/scrapbox\.io\/([^\/]+)\/(.+)/;
  const match = url.match(urlPattern);

  if (!match) {
    return res.status(400).json({ error: "Invalid Scrapbox URL" });
  }

  const [, project, pageName] = match;

  // Decode URL-encoded page name
  const decodedPageName = decodeURIComponent(pageName);

  try {
    // Call Scrapbox API
    const apiUrl = `https://scrapbox.io/api/pages/${project}/${encodeURIComponent(
      decodedPageName
    )}`;
    const response = await fetch(apiUrl);

    if (!response.ok) {
      throw new Error(`Scrapbox API error: ${response.statusText}`);
    }

    const pageData = await response.json();

    // Extract links
    const directLinks = new Set<string>(pageData.links || []);
    const links1hop = new Set<string>(
      (pageData.relatedPages?.links1hop || []).map((item: any) => item.title)
    );

    // Extract 2-hop links
    // links2hop contains pages that are linked from 1-hop pages
    const links2hop = new Set<string>(
      (pageData.relatedPages?.links2hop || []).map((item: any) => item.title)
    );

    // Categorize links
    const forelinks = new Set(
      Array.from(directLinks).filter((link) => links1hop.has(link))
    );
    const backlinks = new Set(
      Array.from(links1hop).filter((link) => !directLinks.has(link))
    );
    const links2hopOnly = new Set(
      Array.from(links2hop).filter(
        (link) => !links1hop.has(link) && !directLinks.has(link)
      )
    );

    // Read existing VT config to filter out registered pages
    const configPath = path.join(process.cwd(), "vt_config.json");
    const configContent = fs.readFileSync(configPath, "utf-8");
    const config = JSON.parse(configContent);
    const registeredPages = new Set(
      config.illusts.map((i: any) => i.page_ja)
    );
    const skippedPages = new Set(config.skipped || []);

    // Get image URLs from markdown files
    const pagesDir = path.join(process.cwd(), "data", "ja", "pages");
    const results: RelatedPage[] = [];
    const processedPages = new Set<string>(); // Track processed pages to avoid duplicates

    const processLinks = (links: Set<string>, linkType: RelatedPage["linkType"]) => {
      links.forEach((link) => {
        // Skip if already processed (avoid duplicates)
        if (processedPages.has(link)) {
          return;
        }

        // Determine status
        let status: RelatedPage["status"] = "available";
        if (registeredPages.has(link)) {
          status = "registered";
        } else if (skippedPages.has(link)) {
          status = "skipped";
        }

        const filePath = path.join(pagesDir, `${link}.md`);

        // Check if markdown file exists
        if (!fs.existsSync(filePath)) {
          return;
        }

        const fileContent = fs.readFileSync(filePath, "utf-8");
        const { data, content } = matter(fileContent);

        // Check for Gyazo image
        const gyazoPattern =
          /!\[.*?\]\((https:\/\/gyazo\.com\/[a-f0-9]+(?:\/thumb\/\d+)?)\)/i;
        const imageMatch = content.match(gyazoPattern);

        if (imageMatch) {
          results.push({
            pageName: link,
            title: data.title || link,
            imageUrl: imageMatch[1],
            linkType,
            status,
          });
          processedPages.add(link); // Mark as processed
        }
      });
    };

    // Process all link types (priority order: forward > backward > 2hop)
    processLinks(forelinks, "forward");
    processLinks(backlinks, "backward");
    processLinks(links2hopOnly, "2hop");

    return res.status(200).json({
      success: true,
      sourcePageName: decodedPageName,
      results,
      stats: {
        forward: Array.from(forelinks).filter(
          (l) => !registeredPages.has(l) && !skippedPages.has(l)
        ).length,
        backward: Array.from(backlinks).filter(
          (l) => !registeredPages.has(l) && !skippedPages.has(l)
        ).length,
        "2hop": Array.from(links2hopOnly).filter(
          (l) => !registeredPages.has(l) && !skippedPages.has(l)
        ).length,
      },
    });
  } catch (error) {
    console.error("Error fetching related pages:", error);
    return res.status(500).json({
      error: "Failed to fetch related pages",
      details: error instanceof Error ? error.message : String(error),
    });
  }
}
