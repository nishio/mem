const fs = require('fs');
const path = require('path');

// 欠番を検出する関数
function findGaps(illusts) {
  const ids = illusts.map(i => i.id).sort((a, b) => a - b);
  const gaps = [];
  const maxId = ids[ids.length - 1];

  for (let i = 1; i < maxId; i++) {
    if (!ids.includes(i)) {
      gaps.push(i);
    }
  }

  return gaps;
}

// Read add_new_vt.txt
const addNewVtPath = path.join(__dirname, '../../../add_new_vt.txt');
const addNewVtContent = fs.readFileSync(addNewVtPath, 'utf-8');

// Read vt_config.json
const configPath = path.join(__dirname, '../vt_config.json');
const configContent = fs.readFileSync(configPath, 'utf-8');
const config = JSON.parse(configContent);

// Parse add_new_vt.txt
const lines = addNewVtContent.trim().split('\n').filter(line => line.trim());
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

console.log(`Found ${pageNames.length} pages in add_new_vt.txt`);

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

// 欠番リストを取得
const gaps = findGaps(config.illusts);
if (gaps.length > 0) {
  console.log(`Found ${gaps.length} gap(s): ${gaps.join(', ')}\n`);
}

// Add new pages
for (const pageName of newPages) {
  let nextId;

  if (gaps.length > 0) {
    // 欠番があればそこを使う
    nextId = gaps.shift();
    console.log(`  [${nextId}] ${pageName} (filling gap)`);
  } else {
    // 欠番がなければ最大ID+1を使う
    nextId = Math.max(...config.illusts.map(i => i.id), 0) + 1;
    console.log(`  [${nextId}] ${pageName}`);
  }

  config.illusts.push({
    id: nextId,
    page_ja: pageName,
    page_en: null,
    tags: []
  });
}

// IDでソート
config.illusts.sort((a, b) => a.id - b.id);

// Save vt_config.json
fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8');
console.log(`\nSuccessfully added ${newPages.length} pages!`);
console.log(`Total pages: ${config.illusts.length}`);

// 最終確認：欠番がないかチェック
const finalGaps = findGaps(config.illusts);
if (finalGaps.length === 0) {
  console.log('No gaps remaining - ID sequence is continuous!');
} else {
  console.log(`Warning: ${finalGaps.length} gap(s) still remaining: ${finalGaps.join(', ')}`);
}
