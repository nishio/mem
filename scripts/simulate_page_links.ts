/**
 * Simulate the page link filtering logic
 * Run with: pnpm tsx scripts/simulate_page_links.ts [page_id]
 */

import { buildVtGraph, getSharedReferenceVtLinks, getDirectVtLinks, loadVtConfig } from '../utils/vt_graph';

const config = loadVtConfig();
const graph = buildVtGraph(config.illusts);

const testId = parseInt(process.argv[2] || '192', 10);

console.log(`\n=== Simulating page ${testId} link display ===\n`);

// Get direct links
const directLinks = getDirectVtLinks(testId, graph);
const directLinkIds = new Set(directLinks.map(link => link.id));

console.log(`Direct links (${directLinks.length}):`);
console.log(`  IDs: [${directLinks.map(l => l.id).join(', ')}]`);
console.log('');

// Get shared reference groups
const sharedGroups = getSharedReferenceVtLinks(testId, graph);

console.log(`Shared reference groups (before filtering): ${sharedGroups.length}`);
console.log('');

// Filter out direct link IDs from shared groups
const filteredGroups = sharedGroups
  .map((group) => {
    const filteredVtIds = group.vtIds.filter(vtId => !directLinkIds.has(vtId));

    if (filteredVtIds.length === 0) {
      return null;
    }

    return {
      via: group.via,
      vtIds: filteredVtIds,
    };
  })
  .filter((group): group is NonNullable<typeof group> => group !== null);

console.log(`Shared reference groups (after filtering): ${filteredGroups.length}`);
console.log('');

filteredGroups.forEach((group, index) => {
  console.log(`Group ${index}: via "${group.via}"`);
  console.log(`  IDs: [${group.vtIds.join(', ')}]`);
  console.log('');
});

// Show what was filtered out
console.log('=== Filtered out groups ===\n');

let filteredCount = 0;
sharedGroups.forEach((group) => {
  const filteredVtIds = group.vtIds.filter(vtId => !directLinkIds.has(vtId));

  if (filteredVtIds.length === 0) {
    console.log(`❌ Group via "${group.via}" completely filtered out`);
    console.log(`   Original IDs: [${group.vtIds.join(', ')}]`);
    console.log(`   (All IDs are in direct links)`);
    console.log('');
    filteredCount++;
  } else if (filteredVtIds.length < group.vtIds.length) {
    const removedIds = group.vtIds.filter(vtId => directLinkIds.has(vtId));
    console.log(`⚠️  Group via "${group.via}" partially filtered`);
    console.log(`   Original IDs: [${group.vtIds.join(', ')}]`);
    console.log(`   Removed IDs: [${removedIds.join(', ')}]`);
    console.log(`   Remaining IDs: [${filteredVtIds.join(', ')}]`);
    console.log('');
  }
});

if (filteredCount === 0 && sharedGroups.length === filteredGroups.length) {
  console.log('✅ No groups were filtered out');
}
