/**
 * Simple approach: Read all VT pages from English markdown dir
 */

const fs = require('fs').promises;
const path = require('path');
const matter = require('gray-matter');

const VT_CONFIG_PATH = path.join(__dirname, '../vt_config.json');
const ENGLISH_DATA_DIR = path.join(__dirname, '../data/en/pages');

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

    // Try to find English page in data/en/pages
    const possibleFiles = [
      `${pageJa}.md`,
      // Add more patterns if needed
    ];

    let found = false;
    for (const fileName of possibleFiles) {
      const filePath = path.join(ENGLISH_DATA_DIR, fileName);

      try {
        const content = await fs.readFile(filePath, 'utf-8');
        const { data: frontmatter } = matter(content);

        if (frontmatter.title) {
          illust.page_en = frontmatter.title;
          console.log(`✓ ${frontmatter.title}`);
          updateCount++;
          found = true;
          break;
        }
      } catch (err) {
        // File doesn't exist, try next pattern
        continue;
      }
    }

    if (!found) {
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
    console.log('\n⚠️  Pages not found need to be translated first.');
    console.log('Consider running the etude-github-actions translation pipeline.');
  }
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
