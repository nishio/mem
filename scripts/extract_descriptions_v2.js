const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');

// Read vt_config.json
const configPath = path.join(__dirname, '../vt_config.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

function extractDescription(markdown) {
  // Remove frontmatter
  let text = markdown.replace(/^---[\s\S]*?---\n/, "");

  const lines = text.split("\n");

  // Pattern B: Check for indented image (説明 → インデント画像)
  let indentedImageIndex = -1;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // Image line that starts with whitespace (at least 2 spaces or 1 tab) AND contains image
    if (line.match(/^[ ]{2,}.*!\[.*?\]\(https:\/\/gyazo\.com/) ||
        line.match(/^\t.*!\[.*?\]\(https:\/\/gyazo\.com/)) {
      indentedImageIndex = i;
      break;
    }
  }

  if (indentedImageIndex !== -1) {
    // Pattern B found: Extract text BEFORE indented image
    let result = "";
    let paragraphCount = 0;

    for (let i = 0; i < indentedImageIndex; i++) {
      const line = lines[i];

      // Skip empty lines
      if (line.trim() === '') {
        continue;
      }

      // Skip headers
      if (line.match(/^#+\s/)) {
        continue;
      }

      let processedLine = line.trim();

      // Remove list markers
      processedLine = processedLine.replace(/^[-*]\s+/, '');
      processedLine = processedLine.replace(/^\d+\.\s+/, '');

      // Skip metadata links
      if (processedLine.match(/^from\s+\[\[/) ||
          processedLine.match(/^next:\s+\[\[/) ||
          processedLine.match(/^prev\s+\[\[/)) {
        continue;
      }

      if (processedLine.length > 0) {
        result += processedLine + "\n";
        paragraphCount++;

        if (paragraphCount >= 2 || result.length > 300) {
          break;
        }
      }
    }

    if (result.trim()) {
      return result.trim();
    }
  }

  // Pattern A: Look for non-indented image, then extract text AFTER it
  let imageIndex = -1;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // Non-indented Gyazo image
    if (line.match(/^!\[.*?\]\(https:\/\/gyazo\.com/) && !line.match(/^\s+/)) {
      imageIndex = i;
      break;
    }
  }

  if (imageIndex !== -1) {
    // Pattern A: Extract text AFTER image
    let result = "";
    let paragraphCount = 0;

    for (let i = imageIndex + 1; i < lines.length; i++) {
      const line = lines[i];

      // Skip empty lines
      if (line.trim() === '') {
        continue;
      }

      // Skip headers
      if (line.match(/^#+\s/)) {
        continue;
      }

      let processedLine = line.trim();

      // Remove list markers
      processedLine = processedLine.replace(/^[-*]\s+/, '');
      processedLine = processedLine.replace(/^\d+\.\s+/, '');

      // Skip metadata links
      if (processedLine.match(/^from\s+\[\[/) ||
          processedLine.match(/^next:\s+\[\[/) ||
          processedLine.match(/^prev\s+\[\[/)) {
        continue;
      }

      if (processedLine.length > 0) {
        result += processedLine + "\n";
        paragraphCount++;

        if (paragraphCount >= 2 || result.length > 300) {
          break;
        }
      }
    }

    return result.trim();
  }

  return "";
}

let output = "# Visual Thinking - Description Extraction v2\n\n";
output += "Generated: " + new Date().toISOString() + "\n\n";
output += "## Pattern Detection\n\n";
output += "- **Pattern A**: Image first, description after (most common)\n";
output += "- **Pattern B**: Description first, indented image after\n\n";
output += "---\n\n";

for (const item of config.illusts) {
  const pageName = item.page_ja;
  const filePath = path.join(__dirname, '../data/ja/pages', `${pageName}.md`);

  output += `## ID ${item.id}: ${pageName}\n\n`;

  if (!fs.existsSync(filePath)) {
    output += "**Status**: ❌ File not found\n\n";
    output += "---\n\n";
    continue;
  }

  const fileContent = fs.readFileSync(filePath, 'utf-8');
  const { content } = matter(fileContent);

  // Detect pattern
  const lines = content.split('\n');
  let hasIndentedImage = false;
  for (const line of lines) {
    if (line.match(/^[ ]{2,}.*!\[.*?\]\(https:\/\/gyazo\.com/) ||
        line.match(/^\t.*!\[.*?\]\(https:\/\/gyazo\.com/)) {
      hasIndentedImage = true;
      break;
    }
  }
  const pattern = hasIndentedImage ? "B (説明→画像)" : "A (画像→説明)";

  const description = extractDescription(content);

  output += `**Pattern**: ${pattern}\n\n`;

  if (description) {
    output += "**Status**: ✅ Description extracted\n\n";
    output += "**Description**:\n\n";
    output += "> " + description.replace(/\n/g, '\n> ') + "\n\n";
  } else {
    output += "**Status**: ⚠️ No description found\n\n";
  }

  output += `**URL**: https://mem.nhiro.org/ja/vt/${item.id}\n\n`;
  output += "---\n\n";
}

const outputPath = path.join(__dirname, '../../../docs/vt_descriptions_v2.md');
fs.writeFileSync(outputPath, output, 'utf-8');

console.log(`Output written to: ${outputPath}`);
console.log(`Total pages: ${config.illusts.length}`);

// Summary statistics
let successCount = 0;
let patternACount = 0;
let patternBCount = 0;

for (const item of config.illusts) {
  const pageName = item.page_ja;
  const filePath = path.join(__dirname, '../data/ja/pages', `${pageName}.md`);

  if (!fs.existsSync(filePath)) continue;

  const fileContent = fs.readFileSync(filePath, 'utf-8');
  const { content } = matter(fileContent);

  const hasIndentedImage = content.match(/^\s+.*!\[.*?\]\(https:\/\/gyazo\.com/m);
  if (hasIndentedImage) {
    patternBCount++;
  } else {
    patternACount++;
  }

  const description = extractDescription(content);
  if (description) successCount++;
}

console.log(`\nSuccess: ${successCount}/${config.illusts.length}`);
console.log(`Pattern A (画像→説明): ${patternACount}`);
console.log(`Pattern B (説明→画像): ${patternBCount}`);
