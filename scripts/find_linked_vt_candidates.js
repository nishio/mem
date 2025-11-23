const fs = require('fs');
const path = require('path');

const JA_PAGES_DIR = path.join(__dirname, '../data/ja/pages');
const configPath = path.join(__dirname, '../vt_config.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

// 既存のVTページと skipped のセット
const existingPages = new Set(config.illusts.map(i => i.page_ja));
const skippedPages = new Set(config.skipped);

// ページからリンクを抽出
function extractLinks(content) {
  const linkPattern = /\[\[([^\]]+)\]\]/g;
  const links = [];
  let match;
  while ((match = linkPattern.exec(content)) !== null) {
    links.push(match[1]);
  }
  return [...new Set(links)]; // 重複除去
}

// Gyazo画像が含まれているかチェック
function hasGyazoImage(content) {
  return content.includes('gyazo.com');
}

// ページファイルが存在するかチェック
function pageFileExists(pageName) {
  const filePath = path.join(JA_PAGES_DIR, `${pageName}.md`);
  return fs.existsSync(filePath);
}

const candidates = [];

// パート1: 「盲点カード」からリンクされているページ
console.log('\n=== 盲点カード（からのリンク） ===');
const blindspotCardPath = path.join(JA_PAGES_DIR, '盲点カード.md');
if (fs.existsSync(blindspotCardPath)) {
  const content = fs.readFileSync(blindspotCardPath, 'utf-8');
  const links = extractLinks(content);
  console.log(`Found ${links.length} linked pages\n`);
  
  for (const linkedPage of links) {
    if (existingPages.has(linkedPage) || skippedPages.has(linkedPage)) {
      continue;
    }
    if (!pageFileExists(linkedPage)) {
      continue;
    }
    
    const linkedFilePath = path.join(JA_PAGES_DIR, `${linkedPage}.md`);
    const linkedContent = fs.readFileSync(linkedFilePath, 'utf-8');
    
    if (hasGyazoImage(linkedContent)) {
      console.log(`✓ ${linkedPage}`);
      candidates.push({
        page: linkedPage,
        source: '盲点カード（からのリンク）'
      });
    }
  }
}

// パート2: 「二人が違うことを言う絵のシリーズ」へのバックリンク
console.log('\n=== 二人が違うことを言う絵のシリーズ（へのバックリンク） ===');
const targetPageName = '二人が違うことを言う絵のシリーズ';
const allFiles = fs.readdirSync(JA_PAGES_DIR).filter(f => f.endsWith('.md'));

console.log(`Scanning ${allFiles.length} pages for backlinks...\n`);

for (const file of allFiles) {
  const pageName = file.replace('.md', '');
  
  // 既存ページまたはスキップ済みページはスキップ
  if (existingPages.has(pageName) || skippedPages.has(pageName)) {
    continue;
  }
  
  const filePath = path.join(JA_PAGES_DIR, file);
  const content = fs.readFileSync(filePath, 'utf-8');
  
  // このページが targetPageName へのリンクを含むかチェック
  const links = extractLinks(content);
  if (!links.includes(targetPageName)) {
    continue;
  }
  
  // Gyazo画像を含むかチェック
  if (hasGyazoImage(content)) {
    console.log(`✓ ${pageName}`);
    candidates.push({
      page: pageName,
      source: '二人が違うことを言う絵のシリーズ（へのバックリンク）'
    });
  }
}

console.log(`\n=== Summary ===`);
console.log(`Total candidates: ${candidates.length}`);

// 候補を出力
if (candidates.length > 0) {
  console.log(`\nAdd these to add_new_vt.txt:\n`);
  for (const candidate of candidates) {
    const encodedPageName = encodeURIComponent(candidate.page);
    console.log(`${candidate.page} https://scrapbox.io/nishio/${encodedPageName}`);
  }
}
