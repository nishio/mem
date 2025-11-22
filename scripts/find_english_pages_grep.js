/**
 * Ultra-fast English page detection using grep
 */

const fs = require('fs').promises;
const path = require('path');
const matter = require('gray-matter');
const { execSync } = require('child_process');

const ENGLISH_PAGES_DIR = path.join(__dirname, '../../external_brain_in_markdown_english/pages');
const VT_CONFIG_PATH = path.join(__dirname, '../vt_config.json');

async function findEnglishPageWithGrep(japanesePage) {
  try {
    // Use grep to find files containing the Japanese page reference
    const pattern = `\\[/nishio/${japanesePage}\\]`;
    const cmd = `grep -l "${pattern}" "${ENGLISH_PAGES_DIR}"/*.md`;

    const output = execSync(cmd, { encoding: 'utf-8' }).trim();

    if (!output) return null;

    // grep -l returns file paths, get the first one
    const filePath = output.split('\n')[0];

    // Read frontmatter to get title
    const content = await fs.readFile(filePath, 'utf-8');
    const { data: frontmatter } = matter(content);

    return frontmatter.title || null;
  } catch (err) {
    // grep returns exit code 1 if no match found
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

    const pageEn = await findEnglishPageWithGrep(pageJa);

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
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
