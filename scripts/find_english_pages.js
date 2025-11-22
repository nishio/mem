/**
 * English page detection script for Visual Thinking
 *
 * Scans external_brain_in_markdown_english to find English versions
 * of Japanese pages by checking footer references.
 */

const fs = require('fs').promises;
const path = require('path');
const matter = require('gray-matter');

// Paths
const ENGLISH_PAGES_DIR = path.join(__dirname, '../../external_brain_in_markdown_english/pages');
const VT_CONFIG_PATH = path.join(__dirname, '../vt_config.json');

// Regex to extract Japanese page name from footer
// Pattern: [/nishio/日本語ページ名](https://scrapbox.io/nishio/...)
const FOOTER_PATTERN = /\[\/nishio\/([^\]]+)\]\(https:\/\/scrapbox\.io\/nishio\//;

async function scanEnglishPages() {
  console.log('Scanning English pages directory:', ENGLISH_PAGES_DIR);

  const files = await fs.readdir(ENGLISH_PAGES_DIR);
  const mdFiles = files.filter(f => f.endsWith('.md'));

  console.log(`Found ${mdFiles.length} markdown files`);

  const mapping = new Map(); // Japanese page name -> English page name (title)

  for (const file of mdFiles) {
    const filePath = path.join(ENGLISH_PAGES_DIR, file);
    const content = await fs.readFile(filePath, 'utf-8');

    // Parse frontmatter
    const { data: frontmatter, content: body } = matter(content);
    const englishTitle = frontmatter.title;

    if (!englishTitle) {
      console.warn(`No title in frontmatter: ${file}`);
      continue;
    }

    // Extract Japanese page name from footer
    const match = body.match(FOOTER_PATTERN);
    if (match) {
      const japanesePage = match[1];
      mapping.set(japanesePage, englishTitle);
      console.log(`✓ ${japanesePage} -> ${englishTitle}`);
    } else {
      console.log(`  (no footer reference in ${file})`);
    }
  }

  return mapping;
}

async function updateVtConfig(mapping) {
  console.log('\n--- Updating vt_config.json ---');

  const configContent = await fs.readFile(VT_CONFIG_PATH, 'utf-8');
  const config = JSON.parse(configContent);

  let updateCount = 0;
  let notFoundCount = 0;

  for (const illust of config.illusts) {
    const pageJa = illust.page_ja;

    if (mapping.has(pageJa)) {
      const pageEn = mapping.get(pageJa);
      illust.page_en = pageEn;
      console.log(`✓ ID ${illust.id}: ${pageJa} -> ${pageEn}`);
      updateCount++;
    } else {
      console.log(`✗ ID ${illust.id}: ${pageJa} (not found)`);
      notFoundCount++;
    }
  }

  // Write updated config
  await fs.writeFile(
    VT_CONFIG_PATH,
    JSON.stringify(config, null, 2) + '\n',
    'utf-8'
  );

  console.log('\n--- Summary ---');
  console.log(`Updated: ${updateCount}`);
  console.log(`Not found: ${notFoundCount}`);
  console.log(`Total: ${config.illusts.length}`);

  return { updateCount, notFoundCount };
}

async function main() {
  try {
    // Scan English pages
    const mapping = await scanEnglishPages();
    console.log(`\nTotal mappings found: ${mapping.size}`);

    // Update vt_config.json
    const result = await updateVtConfig(mapping);

    if (result.notFoundCount > 0) {
      console.log('\n⚠️  Some pages do not have English versions yet.');
      console.log('You may need to run the translation pipeline (etude-github-actions).');
    }

  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main();
