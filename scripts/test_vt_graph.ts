/**
 * Test script for vt_graph functions
 * Run with: pnpm tsx scripts/test_vt_graph.ts [page_id]
 */

import { buildVtGraph, getSharedReferenceVtLinks, loadVtConfig } from '../utils/vt_graph';

const config = loadVtConfig();
const graph = buildVtGraph(config.illusts);

// Get test ID from command line args, default to 192
const testId = parseInt(process.argv[2] || '192', 10);

console.log(`\n=== Testing VT page ID ${testId} ===\n`);

const groups = getSharedReferenceVtLinks(testId, graph);
console.log(`Total groups: ${groups.length}\n`);

groups.forEach((group, index) => {
  console.log(`Group ${index}:`);
  console.log(`  via: "${group.via}"`);
  console.log(`  vtIds: [${group.vtIds.join(', ')}]`);
  console.log('');
});

// Check for vtIds duplicates
const vtIdsKeys = groups.map(g => g.vtIds.join(','));
const uniqueVtIdsKeys = new Set(vtIdsKeys);

if (vtIdsKeys.length !== uniqueVtIdsKeys.size) {
  console.log('⚠️  DUPLICATE vtIds FOUND!');
  console.log('vtIds keys:', vtIdsKeys);
  const duplicates = vtIdsKeys.filter((key, index) => vtIdsKeys.indexOf(key) !== index);
  console.log('Duplicate keys:', [...new Set(duplicates)]);
} else {
  console.log('✅ No duplicate vtIds found');
}

// Check for via name duplicates (informational only)
const viaNames = groups.map(g => g.via);
const uniqueViaNames = new Set(viaNames);

if (viaNames.length !== uniqueViaNames.size) {
  console.log('ℹ️  Duplicate via names (different vtIds):');
  const duplicates = viaNames.filter((name, index) => viaNames.indexOf(name) !== index);
  console.log('  ', [...new Set(duplicates)]);
}
