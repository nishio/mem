/**
 * Remove duplicate VT entries from vt_config.json
 * - Detects pages with same page_ja
 * - Keeps the one with lower ID (earlier entry)
 * - Removes the duplicate(s)
 *
 * Run with: node scripts/remove_duplicate_vt.js [--dry-run]
 */

const fs = require('fs');
const path = require('path');

const dryRun = process.argv.includes('--dry-run');

const configPath = path.join(__dirname, '../vt_config.json');
const configContent = fs.readFileSync(configPath, 'utf-8');
const config = JSON.parse(configContent);

console.log(`\n=== Checking for duplicate VT entries ===\n`);
console.log(`Total entries: ${config.illusts.length}`);

// Group by page_ja
const pageGroups = new Map();

config.illusts.forEach(item => {
  if (!pageGroups.has(item.page_ja)) {
    pageGroups.set(item.page_ja, []);
  }
  pageGroups.get(item.page_ja).push(item);
});

// Find duplicates
const duplicates = [];

pageGroups.forEach((items, pageName) => {
  if (items.length > 1) {
    duplicates.push({ pageName, items });
  }
});

if (duplicates.length === 0) {
  console.log('✅ No duplicates found!');
  process.exit(0);
}

console.log(`\n⚠️  Found ${duplicates.length} duplicate page(s):\n`);

const idsToRemove = [];

duplicates.forEach(({ pageName, items }) => {
  // Sort by ID (keep lowest)
  items.sort((a, b) => a.id - b.id);

  console.log(`Page: "${pageName}"`);
  console.log(`  Entries: ${items.map(i => `ID ${i.id}`).join(', ')}`);
  console.log(`  Keeping: ID ${items[0].id}`);
  console.log(`  Removing: ${items.slice(1).map(i => `ID ${i.id}`).join(', ')}`);
  console.log('');

  // Mark all except first for removal
  items.slice(1).forEach(item => {
    idsToRemove.push(item.id);
  });
});

console.log(`\nTotal IDs to remove: ${idsToRemove.length}`);
console.log(`IDs: ${idsToRemove.join(', ')}`);

if (dryRun) {
  console.log('\n--dry-run mode: No changes made');
  process.exit(0);
}

// Remove duplicates
const originalCount = config.illusts.length;
config.illusts = config.illusts.filter(item => !idsToRemove.includes(item.id));

console.log(`\nRemoved ${originalCount - config.illusts.length} entries`);
console.log(`Remaining entries: ${config.illusts.length}`);

// Save
fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8');
console.log('\n✅ vt_config.json updated successfully!');
