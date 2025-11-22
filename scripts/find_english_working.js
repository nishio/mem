/**
 * Working version using exec with proper PATH
 */

const fs = require('fs').promises;
const path = require('path');
const matter = require('gray-matter');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

const ENGLISH_PAGES_DIR = '/Users/nishio/external_brain_management/modules/external_brain_in_markdown_english/pages';
const VT_CONFIG_PATH = path.join(__dirname, '../vt_config.json');

async function findEnglishPage(japanesePage) {
  try {
    // Search for the pattern in markdown files
    const pattern = `/nishio/${japanesePage}`;
    const cmd = `grep -l "${pattern}" "${ENGLISH_PAGES_DIR}"/*.md 2>/dev/null | head -1`;

    const { stdout } = await execPromise(cmd);
    const filePath = stdout.trim();

    if (!filePath) return null;

    // Read frontmatter
    const content = await fs.readFile(filePath, 'utf-8');
    const { data: frontmatter } = matter(content);

    return frontmatter.title || null;
  } catch (err) {
    // No match found or error
    return null;
  }
}

async function main() {
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

  if (notFoundCount > 0) {
    console.log('\n⚠️  Pages not found need English translation.');
  }
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
