const fs = require('fs');
const path = require('path');

// Read vt_config.json
const configPath = path.join(__dirname, '../vt_config.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

// IDs added today (2025-12-02) - these are in wrong positions
const todayAddedIds = [100, 121, 190, 197, 199, 205, 208, 209, 215, 217, 230, 235, 236, 237];

console.log(`Fixing array order for ${todayAddedIds.length} pages added today\n`);

// Extract pages added today
const todayPages = [];
const remainingPages = [];

for (const item of config.illusts) {
  if (todayAddedIds.includes(item.id)) {
    todayPages.push(item);
    console.log(`Moving ID ${item.id}: ${item.page_ja}`);
  } else {
    remainingPages.push(item);
  }
}

// Reconstruct array: old pages + today's pages at the end
config.illusts = [...remainingPages, ...todayPages];

console.log(`\nArray reconstructed:`);
console.log(`  - Old pages (ID 1-250 except today's): ${remainingPages.length} items`);
console.log(`  - Today's pages (appended to end): ${todayPages.length} items`);
console.log(`  - Total: ${config.illusts.length} items`);

// Verify last 14 entries
console.log(`\nLast 14 entries (should be today's additions):`);
const lastEntries = config.illusts.slice(-14);
lastEntries.forEach((item, index) => {
  console.log(`  ${index + 1}. ID ${item.id}: ${item.page_ja}`);
});

// Save
fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8');
console.log(`\n✅ Saved to vt_config.json`);
