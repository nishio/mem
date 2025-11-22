/**
 * Fast English page detection for Visual Thinking
 * Only scans files that might match VT config pages
 */

const fs = require('fs').promises;
const path = require('path');
const matter = require('gray-matter');

// Paths
const ENGLISH_PAGES_DIR = path.join(__dirname, '../../external_brain_in_markdown_english/pages');
const VT_CONFIG_PATH = path.join(__dirname, '../vt_config.json');

// Regex to extract Japanese page name from footer
const FOOTER_PATTERN = /\[\/nishio\/([^\]]+)\]\(https:\/\/scrapbox\.io\/nishio\//;

async function findEnglishPage(japanesePage) {
  /**
   * Search for English version of a Japanese page
   * by checking potential file names
   */

  // Try common patterns for file names
  const candidates = [
    `${japanesePage}.md`,
    `${japanesePage.toLowerCase()}.md`,
  ];

  // Scan all files (this is unavoidable for fuzzy matching)
  // But we optimize by only reading files that match footer pattern
  const files = await fs.readdir(ENGLISH_PAGES_DIR);

  for (const file of files) {
    if (!file.endsWith('.md')) continue;

    const filePath = path.join(ENGLISH_PAGES_DIR, file);

    try {
      const content = await fs.readFile(filePath, 'utf-8');

      // Quick check: does this file reference our Japanese page?
      if (!content.includes(`[/nishio/${japanesePage}]`)) {
        continue;
      }

      // Parse frontmatter to get title
      const { data: frontmatter } = matter(content);
      const englishTitle = frontmatter.title;

      if (englishTitle) {
        return englishTitle;
      }
    } catch (err) {
      // Skip files that can't be read
      continue;
    }
  }

  return null;
}

async function updateVtConfig() {
  console.log('Loading vt_config.json...');
  const configContent = await fs.readFile(VT_CONFIG_PATH, 'utf-8');
  const config = JSON.parse(configContent);

  console.log(`Found ${config.illusts.length} illustrations to check\n`);

  let updateCount = 0;
  let notFoundCount = 0;

  for (const illust of config.illusts) {
    const pageJa = illust.page_ja;
    process.stdout.write(`ID ${illust.id}: ${pageJa} ... `);

    const pageEn = await findEnglishPage(pageJa);

    if (pageEn) {
      illust.page_en = pageEn;
      console.log(`✓ ${pageEn}`);
      updateCount++;
    } else {
      console.log(`✗ not found`);
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
  console.log(`✓ Updated: ${updateCount}`);
  console.log(`✗ Not found: ${notFoundCount}`);
  console.log(`Total: ${config.illusts.length}`);
  console.log('\nvt_config.json has been updated.');

  return { updateCount, notFoundCount };
}

async function main() {
  try {
    await updateVtConfig();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main();
