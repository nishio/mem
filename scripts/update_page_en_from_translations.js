#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const configPath = path.join(__dirname, '../vt_config.json');
const translationsDir = path.join(__dirname, '../translations/vt');

// Load vt_config.json
const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

// Get all translation files
const files = fs.readdirSync(translationsDir).filter(f => f.endsWith('.md'));

console.log(`Found ${files.length} translation files\n`);

let updatedCount = 0;

for (const file of files) {
  // Extract ID from filename (e.g., "13_改善の解像度.md" -> 13)
  const match = file.match(/^(\d+)_(.+)\.md$/);
  if (!match) continue;

  const id = parseInt(match[1]);
  const pageJa = match[2];

  // Find the corresponding entry in vt_config.json
  const entry = config.illusts.find(i => i.id === id);
  if (!entry) {
    console.log(`⚠️  ID ${id} not found in vt_config.json`);
    continue;
  }

  // Read the translation file to extract the title
  const filePath = path.join(translationsDir, file);
  const content = fs.readFileSync(filePath, 'utf-8');

  // Extract title from frontmatter (title: "...")
  const titleMatch = content.match(/^title:\s*"(.+)"$/m);
  if (!titleMatch) {
    console.log(`⚠️  ID ${id}: No title found in ${file}`);
    continue;
  }

  const englishTitle = titleMatch[1];

  // Update page_en if it's currently null
  if (entry.page_en === null) {
    entry.page_en = englishTitle;
    updatedCount++;
    console.log(`✅ ID ${id}: ${entry.page_ja} → "${englishTitle}"`);
  } else {
    console.log(`⏭️  ID ${id}: Already has page_en = "${entry.page_en}"`);
  }
}

// Save updated vt_config.json
fs.writeFileSync(configPath, JSON.stringify(config, null, 2) + '\n', 'utf-8');

console.log(`\n✅ Updated ${updatedCount} entries in vt_config.json`);
