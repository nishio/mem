/**
 * Utility functions for building and querying the VT link graph
 */

import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { parseWikiLinks } from "./vt_links";

export type IllustConfig = {
  illusts: Array<{
    id: number;
    page_ja: string;
    page_en: string | null;
    tags: string[];
  }>;
  skipped?: string[];
};

export type VtGraph = {
  idToPageJa: Map<number, string>;
  pageJaToId: Map<string, number>;
  idToLinkTargets: Map<number, Set<string>>;
  linkTargetToVtIds: Map<string, Set<number>>;
};

export type VtLinkType = "mutual" | "outgoing" | "incoming";

export type DirectVtLink = {
  id: number;
  linkType: VtLinkType;
};

export type SharedRefGroup = {
  via: string;
  vtIds: number[];
};

/**
 * Load VT configuration from vt_config.json
 */
export function loadVtConfig(): IllustConfig {
  const configPath = path.join(process.cwd(), "vt_config.json");
  const configContent = fs.readFileSync(configPath, "utf-8");
  return JSON.parse(configContent);
}

/**
 * Read Japanese markdown file for a given page name
 * @param page_ja Japanese page name
 * @returns Markdown content, or empty string if file doesn't exist
 */
export function readJaMarkdown(page_ja: string): string {
  const filePath = path.join(
    process.cwd(),
    "data",
    "ja",
    "pages",
    `${page_ja}.md`
  );
  
  if (!fs.existsSync(filePath)) {
    return "";
  }
  
  try {
    return fs.readFileSync(filePath, "utf-8");
  } catch (error) {
    console.error(`Error reading ${filePath}:`, error);
    return "";
  }
}

/**
 * Build VT link graph from illusts configuration
 * @param illusts Array of VT illustration configurations
 * @returns VtGraph containing all link relationships
 */
export function buildVtGraph(illusts: IllustConfig["illusts"]): VtGraph {
  const idToPageJa = new Map<number, string>();
  const pageJaToId = new Map<string, number>();
  const idToLinkTargets = new Map<number, Set<string>>();
  const linkTargetToVtIds = new Map<string, Set<number>>();

  for (const illust of illusts) {
    idToPageJa.set(illust.id, illust.page_ja);
    pageJaToId.set(illust.page_ja, illust.id);

    const markdown = readJaMarkdown(illust.page_ja);
    const links = parseWikiLinks(markdown);
    const linkSet = new Set(links);
    
    idToLinkTargets.set(illust.id, linkSet);

    for (const linkTarget of Array.from(linkSet)) {
      if (!linkTargetToVtIds.has(linkTarget)) {
        linkTargetToVtIds.set(linkTarget, new Set());
      }
      linkTargetToVtIds.get(linkTarget)!.add(illust.id);
    }
  }

  return {
    idToPageJa,
    pageJaToId,
    idToLinkTargets,
    linkTargetToVtIds,
  };
}

/**
 * Get direct VT links from the current VT page
 * Returns links sorted by type: mutual, outgoing, incoming
 * @param currentId Current VT page ID
 * @param graph VT link graph
 * @returns Array of direct VT links with their types
 */
export function getDirectVtLinks(
  currentId: number,
  graph: VtGraph
): DirectVtLink[] {
  const currentPageJa = graph.idToPageJa.get(currentId);
  if (!currentPageJa) {
    return [];
  }

  const currentLinks = graph.idToLinkTargets.get(currentId) || new Set();
  const directLinks: DirectVtLink[] = [];

  for (const [otherPageJa, otherId] of Array.from(graph.pageJaToId.entries())) {
    if (otherId === currentId) {
      continue;
    }

    const otherLinks = graph.idToLinkTargets.get(otherId) || new Set();
    
    const currentLinksToOther = currentLinks.has(otherPageJa);
    const otherLinksToCurrent = otherLinks.has(currentPageJa);

    if (currentLinksToOther && otherLinksToCurrent) {
      directLinks.push({ id: otherId, linkType: "mutual" });
    } else if (currentLinksToOther) {
      directLinks.push({ id: otherId, linkType: "outgoing" });
    } else if (otherLinksToCurrent) {
      directLinks.push({ id: otherId, linkType: "incoming" });
    }
  }

  const typePriority: Record<VtLinkType, number> = {
    mutual: 0,
    outgoing: 1,
    incoming: 2,
  };

  directLinks.sort((a, b) => {
    const priorityDiff = typePriority[a.linkType] - typePriority[b.linkType];
    if (priorityDiff !== 0) {
      return priorityDiff;
    }
    return a.id - b.id;
  });

  return directLinks;
}

/**
 * Get VT pages connected via shared references (non-VT pages)
 * Note: Initial implementation excludes VT pages as shared references (low priority)
 * @param currentId Current VT page ID
 * @param graph VT link graph
 * @returns Array of shared reference groups
 */
export function getSharedReferenceVtLinks(
  currentId: number,
  graph: VtGraph
): SharedRefGroup[] {
  const currentLinks = graph.idToLinkTargets.get(currentId) || new Set();
  const sharedGroups: SharedRefGroup[] = [];

  for (const linkTarget of Array.from(currentLinks)) {
    if (graph.pageJaToId.has(linkTarget)) {
      continue;
    }

    const vtIdsLinkingToTarget = graph.linkTargetToVtIds.get(linkTarget);
    if (!vtIdsLinkingToTarget) {
      continue;
    }

    const otherVtIds = Array.from(vtIdsLinkingToTarget).filter(
      (id) => id !== currentId
    );

    if (otherVtIds.length > 0) {
      sharedGroups.push({
        via: linkTarget,
        vtIds: otherVtIds.sort((a, b) => a - b), // Sort by ID
      });
    }
  }

  sharedGroups.sort((a, b) => {
    const sizeDiff = b.vtIds.length - a.vtIds.length;
    if (sizeDiff !== 0) {
      return sizeDiff;
    }
    return a.via.localeCompare(b.via);
  });

  return sharedGroups;
}
