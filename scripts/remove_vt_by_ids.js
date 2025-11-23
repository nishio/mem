const fs = require('fs');
const path = require('path');

const configPath = path.join(__dirname, '../vt_config.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

// 削除するID
const idsToRemove = [174, 166, 182, 116, 88, 83, 84, 81];

console.log(`Removing ${idsToRemove.length} pages by ID...\n`);

const removed = [];

for (const id of idsToRemove) {
  const index = config.illusts.findIndex(i => i.id === id);
  
  if (index !== -1) {
    const page = config.illusts[index];
    console.log(`[${id}] ${page.page_ja}`);
    
    // illustsから削除
    config.illusts.splice(index, 1);
    
    // skippedに追加
    if (!config.skipped.includes(page.page_ja)) {
      config.skipped.push(page.page_ja);
    }
    
    removed.push(page);
  } else {
    console.log(`[${id}] NOT FOUND`);
  }
}

// skippedをソート
config.skipped.sort();

// 保存
fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8');

console.log(`\nSuccessfully removed ${removed.length} pages!`);
console.log(`Total pages: ${config.illusts.length}`);
console.log(`Skipped pages: ${config.skipped.length}`);
