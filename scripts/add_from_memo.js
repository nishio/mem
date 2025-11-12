const fs = require('fs');
const path = require('path');

// Read memo.txt
const memoPath = path.join(__dirname, '../../../memo.txt');
const memoContent = fs.readFileSync(memoPath, 'utf-8');

// Read vt_config.json
const configPath = path.join(__dirname, '../vt_config.json');
const configContent = fs.readFileSync(configPath, 'utf-8');
const config = JSON.parse(configContent);

// Parse memo.txt
const lines = memoContent.trim().split('\n').filter(line => line.trim());
const pageNames = [];

for (const line of lines) {
  // Format: "タイトル https://scrapbox.io/nishio/エンコード済みページ名"
  const match = line.match(/https:\/\/scrapbox\.io\/nishio\/([^\s]+)$/);
  if (match) {
    const encodedPageName = match[1];
    const pageName = decodeURIComponent(encodedPageName);
    pageNames.push(pageName);
  }
}

console.log(`Found ${pageNames.length} pages in memo.txt`);

// Check for existing pages
const existingPages = new Set(config.illusts.map(i => i.page_ja));
const newPages = pageNames.filter(name => !existingPages.has(name));
const duplicates = pageNames.filter(name => existingPages.has(name));

if (duplicates.length > 0) {
  console.log(`\nSkipping ${duplicates.length} duplicate pages:`);
  duplicates.forEach(name => console.log(`  - ${name}`));
}

if (newPages.length === 0) {
  console.log('\nNo new pages to add.');
  process.exit(0);
}

console.log(`\nAdding ${newPages.length} new pages...`);

// Get next ID
let nextId = Math.max(...config.illusts.map(i => i.id), 0) + 1;

// Add new pages
for (const pageName of newPages) {
  console.log(`  [${nextId}] ${pageName}`);
  config.illusts.push({
    id: nextId,
    page_ja: pageName,
    page_en: null,
    tags: []
  });
  nextId++;
}

// Save vt_config.json
fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8');
console.log(`\nSuccessfully added ${newPages.length} pages!`);
console.log(`Total pages: ${config.illusts.length}`);
