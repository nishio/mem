/**
 * Check if VT pages share the same images
 * Run with: pnpm tsx scripts/check_duplicate_images.ts [id1] [id2] [id3] ...
 */

import fs from 'fs';
import path from 'path';

function extractGyazoImage(markdown: string): string | null {
  const gyazoPattern = /!\[.*?\]\((https:\/\/gyazo\.com\/[a-f0-9]+(?:\/thumb\/\d+)?)\)/i;
  const match = markdown.match(gyazoPattern);
  return match ? match[1] : null;
}

const config = JSON.parse(fs.readFileSync('vt_config.json', 'utf-8'));

// Get IDs from command line, default to [156, 209, 76, 190]
const ids = process.argv.slice(2).length > 0
  ? process.argv.slice(2).map(arg => parseInt(arg, 10))
  : [156, 209, 76, 190];

console.log(`\n=== Checking images for VT IDs: ${ids.join(', ')} ===\n`);

const results: Array<{ id: number; pageName: string; imageUrl: string | null }> = [];

ids.forEach(id => {
  const item = config.illusts.find((i: any) => i.id === id);
  if (!item) {
    console.log(`ID ${id}: Not found in config`);
    return;
  }

  const filePath = path.join('data/ja/pages', item.page_ja + '.md');
  if (!fs.existsSync(filePath)) {
    console.log(`ID ${id} (${item.page_ja}): File not found`);
    return;
  }

  const content = fs.readFileSync(filePath, 'utf-8');
  const imageUrl = extractGyazoImage(content);

  results.push({
    id,
    pageName: item.page_ja,
    imageUrl,
  });

  console.log(`ID ${id}: ${item.page_ja}`);
  console.log(`  Image: ${imageUrl}`);
  console.log('');
});

// Check for duplicate images
console.log('=== Checking for duplicate images ===\n');

const imageMap = new Map<string, number[]>();

results.forEach(result => {
  if (result.imageUrl) {
    if (!imageMap.has(result.imageUrl)) {
      imageMap.set(result.imageUrl, []);
    }
    imageMap.get(result.imageUrl)!.push(result.id);
  }
});

imageMap.forEach((ids, imageUrl) => {
  if (ids.length > 1) {
    console.log(`⚠️  Same image used by multiple VT pages:`);
    console.log(`   Image: ${imageUrl}`);
    console.log(`   IDs: ${ids.join(', ')}`);
    ids.forEach(id => {
      const result = results.find(r => r.id === id);
      if (result) {
        console.log(`     - ID ${id}: ${result.pageName}`);
      }
    });
    console.log('');
  }
});

if (imageMap.size === results.length) {
  console.log('✅ All images are unique');
}
