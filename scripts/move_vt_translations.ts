#!/usr/bin/env tsx

import fs from "fs";
import path from "path";
import matter from "gray-matter";

const TRANSLATIONS_DIR = path.join(
  process.cwd(),
  "translations",
  "vt"
);
const TARGET_DIR = path.join(
  process.cwd(),
  "..",
  "external_brain_in_markdown_english",
  "pages"
);

// Get all translated files
const files = fs
  .readdirSync(TRANSLATIONS_DIR)
  .filter((f) => f.endsWith(".md"));

console.log(`Found ${files.length} translated files\n`);

for (const file of files) {
  const sourcePath = path.join(TRANSLATIONS_DIR, file);
  const content = fs.readFileSync(sourcePath, "utf-8");
  const { data } = matter(content);

  if (!data.title) {
    console.log(`❌ ${file}: No title in frontmatter`);
    continue;
  }

  // Sanitize filename - replace / with _ since it's a path separator
  const sanitizedTitle = data.title.replace(/\//g, "_");
  const targetFileName = `${sanitizedTitle}.md`;
  const targetPath = path.join(TARGET_DIR, targetFileName);

  // Copy file
  fs.copyFileSync(sourcePath, targetPath);
  console.log(`✅ ${file}`);
  console.log(`   → ${targetFileName}\n`);
}

console.log("Done! All files moved to external_brain_in_markdown_english/pages/");
