/**
 * Utility functions for extracting and processing wiki-style links from markdown content
 */

/**
 * Extract wiki-style links [[...]] from markdown text
 * @param markdown Markdown text content
 * @returns Array of link titles (deduplicated and trimmed)
 */
export function parseWikiLinks(markdown: string): string[] {
  const wikiLinkPattern = /\[\[([^\]]+)\]\]/g;
  const links = new Set<string>();
  
  let match;
  while ((match = wikiLinkPattern.exec(markdown)) !== null) {
    const linkText = match[1].trim();
    if (linkText) {
      links.add(linkText);
    }
  }
  
  return Array.from(links);
}
