#!/usr/bin/env node
/**
 * Fast version: Build index first, then search
 */

const fs = require('fs').promises;
const path = require('path');
const matter = require('gray-matter');

const ENGLISH_PAGES_DIR = '/Users/nishio/external_brain_management/modules/external_brain_in_markdown_english/pages';
const VT_CONFIG_PATH = path.join(__dirname, '../vt_config.json');

async function buildIndex() {
  console.log('Building index from English markdown files...');

  const files = await fs.readdir(ENGLISH_PAGES_DIR);
  const mdFiles = files.filter(f => f.endsWith('.md'));

  console.log(`Found ${mdFiles.length} markdown files. Reading...`);

  const index = new Map(); // Japanese page name -> { title, file }

  let processed = 0;
  for (const file of mdFiles) {
    const filePath = path.join(ENGLISH_PAGES_DIR, file);

    try {
      const content = await fs.readFile(filePath, 'utf-8');

      // Quick check: does this file have a footer reference?
      const match = content.match(/\[\/nishio\/([^\]]+)\]\(https:\/\/scrapbox\.io\/nishio\//);

      if (match) {
        const japanesePage = match[1];
        const { data: frontmatter } = matter(content);

        if (frontmatter.title) {
          if (!index.has(japanesePage)) {
            index.set(japanesePage, []);
          }
          index.get(japanesePage).push({
            title: frontmatter.title,
            file: file
          });
        }
      }

      processed++;
      if (processed % 5000 === 0) {
        process.stdout.write(`\rProcessed ${processed}/${mdFiles.length} files...`);
      }
    } catch (err) {
      // Skip files that can't be read
    }
  }

  console.log(`\rProcessed ${processed}/${mdFiles.length} files. Index built.`);
  console.log(`Found references for ${index.size} Japanese pages.\n`);

  return index;
}

async function main() {
  const index = await buildIndex();

  console.log('Loading vt_config.json...\n');
  const configContent = await fs.readFile(VT_CONFIG_PATH, 'utf-8');
  const config = JSON.parse(configContent);

  const autoUpdated = [];
  const notFound = [];
  const multipleMatches = [];

  for (const illust of config.illusts) {
    const pageJa = illust.page_ja;
    process.stdout.write(`[ID ${illust.id}] ${pageJa} ... `);

    const results = index.get(pageJa);

    if (!results || results.length === 0) {
      console.log('✗ NOT FOUND (needs translation)');
      notFound.push({ id: illust.id, pageJa });
    } else if (results.length === 1) {
      illust.page_en = results[0].title;
      console.log(`✓ ${results[0].title}`);
      autoUpdated.push({ id: illust.id, pageJa, pageEn: results[0].title });
    } else {
      console.log(`⚠️  MULTIPLE MATCHES (${results.length})`);
      multipleMatches.push({ id: illust.id, pageJa, results });
    }
  }

  // Write updated config
  await fs.writeFile(
    VT_CONFIG_PATH,
    JSON.stringify(config, null, 2) + '\n',
    'utf-8'
  );

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('SUMMARY');
  console.log('='.repeat(60));
  console.log(`✓ Auto-updated: ${autoUpdated.length}`);
  console.log(`✗ Not found: ${notFound.length}`);
  console.log(`⚠️  Multiple matches: ${multipleMatches.length}`);
  console.log(`Total: ${config.illusts.length}`);

  // Details for human review
  if (notFound.length > 0) {
    console.log('\n' + '-'.repeat(60));
    console.log('NOT FOUND (needs translation):');
    console.log('-'.repeat(60));
    notFound.forEach(({ id, pageJa }) => {
      console.log(`  [${id}] ${pageJa}`);
    });
  }

  if (multipleMatches.length > 0) {
    console.log('\n' + '-'.repeat(60));
    console.log('MULTIPLE MATCHES (please choose):');
    console.log('-'.repeat(60));
    multipleMatches.forEach(({ id, pageJa, results }) => {
      console.log(`\n  [${id}] ${pageJa}`);
      results.forEach((r, i) => {
        console.log(`    ${i + 1}. "${r.title}" (${r.file})`);
      });
    });
  }

  console.log('\n' + '='.repeat(60));
  console.log('vt_config.json has been updated with auto-detected mappings.');
  if (notFound.length > 0 || multipleMatches.length > 0) {
    console.log('⚠️  Please review the cases above and update manually if needed.');
  }
  console.log('='.repeat(60));
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
