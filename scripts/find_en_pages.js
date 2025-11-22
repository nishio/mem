#!/usr/bin/env node
/**
 * Find English pages for Visual Thinking
 *
 * Strategy:
 * - 1 match: auto-update
 * - 0 matches: report to user (needs translation)
 * - 2+ matches: ask user to choose
 */

const fs = require('fs').promises;
const path = require('path');
const matter = require('gray-matter');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

const ENGLISH_PAGES_DIR = '/Users/nishio/external_brain_management/modules/external_brain_in_markdown_english/pages';
const VT_CONFIG_PATH = path.join(__dirname, '../vt_config.json');

async function findEnglishPages(japanesePage) {
  try {
    const pattern = `/nishio/${japanesePage}`;
    // Use find + grep to avoid "argument list too long"
    const cmd = `find "${ENGLISH_PAGES_DIR}" -name "*.md" -type f -exec grep -l "${pattern}" {} \\; 2>/dev/null`;

    const { stdout } = await execPromise(cmd, { maxBuffer: 10 * 1024 * 1024 });
    const files = stdout.trim().split('\n').filter(f => f);

    if (files.length === 0) {
      return { status: 'not_found', files: [] };
    }

    // Read titles from all matched files
    const results = [];
    for (const filePath of files) {
      const content = await fs.readFile(filePath, 'utf-8');
      const { data: frontmatter } = matter(content);
      if (frontmatter.title) {
        results.push({
          file: path.basename(filePath),
          title: frontmatter.title,
          path: filePath
        });
      }
    }

    if (results.length === 0) {
      return { status: 'no_title', files };
    } else if (results.length === 1) {
      return { status: 'single', result: results[0] };
    } else {
      return { status: 'multiple', results };
    }
  } catch (err) {
    return { status: 'error', error: err.message };
  }
}

async function main() {
  console.log('Loading vt_config.json...\n');
  const configContent = await fs.readFile(VT_CONFIG_PATH, 'utf-8');
  const config = JSON.parse(configContent);

  const autoUpdated = [];
  const notFound = [];
  const multipleMatches = [];
  const errors = [];

  for (const illust of config.illusts) {
    const pageJa = illust.page_ja;
    process.stdout.write(`[ID ${illust.id}] ${pageJa} ... `);

    const result = await findEnglishPages(pageJa);

    switch (result.status) {
      case 'single':
        illust.page_en = result.result.title;
        console.log(`✓ ${result.result.title}`);
        autoUpdated.push({ id: illust.id, pageJa, pageEn: result.result.title });
        break;

      case 'not_found':
        console.log('✗ NOT FOUND (needs translation)');
        notFound.push({ id: illust.id, pageJa });
        break;

      case 'multiple':
        console.log(`⚠️  MULTIPLE MATCHES (${result.results.length})`);
        multipleMatches.push({ id: illust.id, pageJa, results: result.results });
        break;

      case 'no_title':
        console.log('✗ Found files but no title in frontmatter');
        errors.push({ id: illust.id, pageJa, reason: 'no_title' });
        break;

      case 'error':
        console.log(`✗ ERROR: ${result.error}`);
        errors.push({ id: illust.id, pageJa, reason: result.error });
        break;
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
  console.log(`✗ Errors: ${errors.length}`);
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

  if (errors.length > 0) {
    console.log('\n' + '-'.repeat(60));
    console.log('ERRORS:');
    console.log('-'.repeat(60));
    errors.forEach(({ id, pageJa, reason }) => {
      console.log(`  [${id}] ${pageJa}: ${reason}`);
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
