/**
 * Check actual page data by simulating getStaticProps
 * Run with: pnpm tsx scripts/check_page_data.ts [page_id]
 */

import fs from 'fs';
import path from 'path';
import { buildVtGraph, getSharedReferenceVtLinks, loadVtConfig } from '../utils/vt_graph';

const testId = parseInt(process.argv[2] || '192', 10);

console.log(`\n=== Checking actual page data for VT ID ${testId} ===\n`);

const config = loadVtConfig();
const illustItem = config.illusts.find((item) => item.id === testId);

if (!illustItem) {
  console.log('❌ Illust not found');
  process.exit(1);
}

const vtGraph = buildVtGraph(config.illusts);
const sharedGroups = getSharedReferenceVtLinks(illustItem.id, vtGraph);

console.log(`Total shared groups: ${sharedGroups.length}\n`);

sharedGroups.forEach((group, index) => {
  console.log(`Group ${index}: via "${group.via}"`);
  console.log(`  vtIds: [${group.vtIds.join(', ')}]`);

  // Check for duplicates within this group
  const uniqueIds = new Set(group.vtIds);
  if (uniqueIds.size !== group.vtIds.length) {
    console.log(`  ⚠️  DUPLICATES FOUND IN THIS GROUP!`);
    const counts = new Map<number, number>();
    group.vtIds.forEach(id => {
      counts.set(id, (counts.get(id) || 0) + 1);
    });
    counts.forEach((count, id) => {
      if (count > 1) {
        console.log(`    ID ${id} appears ${count} times`);
      }
    });
  }
  console.log('');
});

// Also check for inter-group duplicates
const allVtIdsKeys = sharedGroups.map(g => g.vtIds.join(','));
const uniqueKeys = new Set(allVtIdsKeys);

if (allVtIdsKeys.length !== uniqueKeys.size) {
  console.log('⚠️  DUPLICATE GROUPS (same vtIds):');
  const seen = new Map<string, number[]>();
  allVtIdsKeys.forEach((key, index) => {
    if (!seen.has(key)) {
      seen.set(key, []);
    }
    seen.get(key)!.push(index);
  });

  seen.forEach((indices, key) => {
    if (indices.length > 1) {
      console.log(`  vtIds [${key}] appears in groups: ${indices.join(', ')}`);
      indices.forEach(i => {
        console.log(`    Group ${i}: via "${sharedGroups[i].via}"`);
      });
    }
  });
} else {
  console.log('✅ No inter-group duplicates');
}
