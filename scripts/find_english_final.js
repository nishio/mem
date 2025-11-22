/**
 * Find English pages by searching for each Japanese page individually
 */

const fs = require('fs').promises;
const path = require('path');
const matter = require('gray-matter');
const { execSync } = require('child_process');

const ENGLISH_PAGES_DIR = path.join(__dirname, '../../external_brain_in_markdown_english/pages');
const VT_CONFIG_PATH = path.join(__dirname, '../vt_config.json');

async function findEnglishPage(japanesePage) {
  try {
    // Use fixed-string search (-F) to avoid regex escaping issues
    const pattern = `[/nishio/${japanesePage}]`;

    // Use ripgrep with -F (fixed string) flag
    const cmd = `cd "${ENGLISH_PAGES_DIR}" && rg -l -F "${pattern}" --glob '*.md'`;

    const output = execSync(cmd, { encoding: 'utf-8' }).trim();

    if (!output) return null;

    // Get the first matching file
    const relativeFile = output.split('\n')[0];
    const filePath = path.join(ENGLISH_PAGES_DIR, relativeFile);

    // Read frontmatter
    const content = await fs.readFile(filePath, 'utf-8');
    const { data: frontmatter } = matter(content);

    return frontmatter.title || null;
  } catch (err) {
    // No match found or other error
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
  console.log('\nvt_config.json has been updated.');
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
