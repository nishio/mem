#!/usr/bin/env tsx

import dotenv from "dotenv";
import OpenAI from "openai";
import fs from "fs";
import path from "path";
import matter from "gray-matter";

// Load .env from parent directory
dotenv.config({ path: path.join(process.cwd(), "..", "..", ".env") });

// Configuration
const VT_CONFIG_PATH = path.join(process.cwd(), "vt_config.json");
const JA_PAGES_DIR = path.join(process.cwd(), "data", "ja", "pages");
const OUTPUT_DIR = path.join(process.cwd(), "translations", "vt");

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Types
type IllustConfig = {
  illusts: Array<{
    id: number;
    page_ja: string;
    page_en: string | null;
    tags: string[];
  }>;
  skipped: string[];
};

type TranslationResult = {
  id: number;
  jaTitle: string;
  enTitle: string;
  enContent: string;
};

// Get untranslated pages from vt_config.json
function getUntranslatedPages(): Array<{ id: number; page_ja: string }> {
  const configContent = fs.readFileSync(VT_CONFIG_PATH, "utf-8");
  const config: IllustConfig = JSON.parse(configContent);

  return config.illusts
    .filter((item) => item.page_en === null)
    .map((item) => ({ id: item.id, page_ja: item.page_ja }));
}

// Read Japanese markdown file
function readJapanesePage(pageName: string): {
  frontmatter: { title?: string };
  content: string;
} {
  const filePath = path.join(JA_PAGES_DIR, `${pageName}.md`);

  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }

  const fileContent = fs.readFileSync(filePath, "utf-8");
  const { data, content } = matter(fileContent);

  return {
    frontmatter: data,
    content,
  };
}

// Translate using OpenAI API
async function translateWithOpenAI(
  jaContent: string,
  jaTitle: string
): Promise<{ title: string; content: string }> {
  const systemPrompt = `You are a professional translator specializing in Visual Thinking diagram explanations.

Context:
- Visual Thinking is a collection of diagrams by NISHIO Hirokazu that explain concepts visually
- These are thoughtful explanations of what diagrams represent
- The audience is international readers interested in philosophy, systems thinking, and knowledge work

Your task:
1. Generate a clear, natural English title (max 80 chars, capitalize first letters)
2. Translate the content accurately while:
   - Preserving [[wiki-style links]] (keep brackets, translate content)
   - Preserving Gyazo image URLs exactly as-is
   - Accurately translating technical and philosophical terms
   - Making text accessible to international readers
   - Maintaining markdown formatting
3. Add a footer with link to original Japanese page

Output format:
---
title: "English Title Here"
---

[Translated content with preserved images and links]

---
This page is a high-quality translation from [/nishio/{japanese_page_name}](https://scrapbox.io/nishio/{japanese_page_name}). The original content is maintained by NISHIO Hirokazu.`;

  const userPrompt = `Japanese page title: ${jaTitle}

Japanese content:
${jaContent}

Please translate this to English following the format specified in the system prompt.`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.3,
  });

  const translatedContent = completion.choices[0].message.content || "";

  // Parse title from the translated content
  const titleMatch = translatedContent.match(/^---\s*\ntitle:\s*"([^"]+)"/);
  const title = titleMatch ? titleMatch[1] : jaTitle;

  return {
    title,
    content: translatedContent,
  };
}

// Save translation to output directory
function saveTranslation(
  id: number,
  jaTitle: string,
  translation: string
): void {
  // Create output directory if it doesn't exist
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const filename = `${id}_${jaTitle}.md`;
  const filePath = path.join(OUTPUT_DIR, filename);

  fs.writeFileSync(filePath, translation, "utf-8");
}

// Main function
async function main() {
  console.log("Translating Visual Thinking pages with OpenAI...\n");

  // Check for API key
  if (!process.env.OPENAI_API_KEY) {
    console.error("Error: OPENAI_API_KEY environment variable is not set");
    console.error("Please set it with: export OPENAI_API_KEY='your-key-here'");
    process.exit(1);
  }

  // Get untranslated pages
  const pages = getUntranslatedPages();

  if (pages.length === 0) {
    console.log("No untranslated pages found!");
    return;
  }

  console.log(`Found ${pages.length} untranslated pages:\n`);
  pages.forEach((p) => console.log(`  ID ${p.id}: ${p.page_ja}`));
  console.log("");

  // Process each page
  const results: TranslationResult[] = [];
  let successCount = 0;
  let failCount = 0;

  for (const page of pages) {
    console.log(`Processing ID ${page.id}: ${page.page_ja}`);

    try {
      // Read Japanese page
      const { frontmatter, content } = readJapanesePage(page.page_ja);
      const jaTitle = frontmatter.title || page.page_ja;

      // Translate
      const translation = await translateWithOpenAI(content, jaTitle);

      // Save
      saveTranslation(page.id, page.page_ja, translation.content);

      console.log(`  ✓ Translated to: "${translation.title}"`);
      console.log(`  ✓ Saved to: translations/vt/${page.id}_${page.page_ja}.md\n`);

      results.push({
        id: page.id,
        jaTitle: page.page_ja,
        enTitle: translation.title,
        enContent: translation.content,
      });

      successCount++;
    } catch (error) {
      console.error(`  ✗ Failed: ${error}\n`);
      failCount++;
    }
  }

  // Summary
  console.log("─".repeat(60));
  console.log("\nSummary:");
  console.log(`  Total: ${pages.length} pages`);
  console.log(`  Success: ${successCount}`);
  console.log(`  Failed: ${failCount}`);

  if (successCount > 0) {
    console.log("\nTranslated pages:");
    results.forEach((r) => {
      console.log(`  ID ${r.id}: ${r.jaTitle} → "${r.enTitle}"`);
    });

    console.log("\nNext steps:");
    console.log("  1. Review translations in modules/mem/translations/vt/");
    console.log("  2. Edit if needed");
    console.log("  3. Move to ../external_brain_in_markdown_english/pages/");
    console.log("  4. Commit and push");
    console.log("  5. Run scripts/find_en_pages_fast.js to update vt_config.json");
  }
}

// Run
main().catch(console.error);
