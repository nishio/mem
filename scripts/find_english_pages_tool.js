/**
 * Find English pages using ripgrep (via Grep tool output)
 */

const fs = require('fs').promises;
const path = require('path');
const matter = require('gray-matter');

const VT_CONFIG_PATH = path.join(__dirname, '../vt_config.json');
const ENGLISH_PAGES_DIR = path.join(__dirname, '../../external_brain_in_markdown_english/pages');

/**
 * Parse grep output to create mapping
 * Input should be from: rg -l "\[/nishio/" --glob "*.md"
 * followed by reading each file
 */
async function createMappingFromGrepOutput(grepOutputFile) {
  const content = await fs.readFile(grepOutputFile, 'utf-8');
  const files = content.trim().split('\n').filter(f => f);

  console.log(`Processing ${files.length} files with footer references...`);

  const mapping = new Map();

  for (const file of files) {
    try {
      const fileContent = await fs.readFile(file, 'utf-8');
      const { data: frontmatter } = matter(fileContent);

      // Extract Japanese page name from footer
      const match = fileContent.match(/\[\/nishio\/([^\]]+)\]\(https:\/\/scrapbox\.io\/nishio\//);

      if (match && frontmatter.title) {
        const japanesePage = match[1];
        const englishTitle = frontmatter.title;
        mapping.set(japanesePage, englishTitle);
        console.log(`✓ ${japanesePage} -> ${englishTitle}`);
      }
    } catch (err) {
      console.warn(`Error reading ${file}:`, err.message);
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

  await fs.writeFile(
    VT_CONFIG_PATH,
    JSON.stringify(config, null, 2) + '\n',
    'utf-8'
  );

  console.log('\n--- Summary ---');
  console.log(`✓ Updated: ${updateCount}`);
  console.log(`✗ Not found: ${notFoundCount}`);
  console.log(`Total: ${config.illusts.length}`);
}

async function main() {
  const grepOutputFile = process.argv[2];

  if (!grepOutputFile) {
    console.error('Usage: node find_english_pages_tool.js <grep_output_file>');
    console.error('');
    console.error('First, run:');
    console.error('  rg -l "\\[/nishio/" ../../external_brain_in_markdown_english/pages --glob "*.md" > /tmp/grep_files.txt');
    console.error('');
    console.error('Then run:');
    console.error('  node find_english_pages_tool.js /tmp/grep_files.txt');
    process.exit(1);
  }

  const mapping = await createMappingFromGrepOutput(grepOutputFile);
  console.log(`\nTotal mappings found: ${mapping.size}`);

  await updateVtConfig(mapping);
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
