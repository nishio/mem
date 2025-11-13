const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');

// Read vt_config.json
const configPath = path.join(__dirname, '../vt_config.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

function extractImprovedDescription(markdown) {
  // Remove frontmatter
  let text = markdown.replace(/^---[\s\S]*?---\n/, "");

  const lines = text.split("\n");
  let foundImage = false;
  let result = "";
  let paragraphCount = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Find first Gyazo image
    if (!foundImage && line.match(/!\[.*?\]\(https:\/\/gyazo\.com/)) {
      foundImage = true;
      continue;
    }

    // After finding image, collect text
    if (foundImage) {
      // Skip empty lines
      if (line.trim() === '') {
        continue;
      }

      // Skip headers
      if (line.match(/^#+\s/)) {
        continue;
      }

      // Process the line
      let processedLine = line.trim();

      // Remove list markers (-, *, numbers)
      processedLine = processedLine.replace(/^[-*]\s+/, '');
      processedLine = processedLine.replace(/^\d+\.\s+/, '');

      // Skip if it's just a link reference without text
      if (processedLine.match(/^from\s+\[\[/) || processedLine.match(/^next:\s+\[\[/) || processedLine.match(/^prev\s+\[\[/)) {
        continue;
      }

      // Add the line
      if (processedLine.length > 0) {
        result += processedLine + "\n";
        paragraphCount++;

        // Stop after 2 paragraphs or 300 chars
        if (paragraphCount >= 2 || result.length > 300) {
          break;
        }
      }
    }
  }

  return result.trim();
}

let output = "# Visual Thinking - Description Extraction Results\n\n";
output += "Generated: " + new Date().toISOString() + "\n\n";
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

  const description = extractImprovedDescription(content);

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

const outputPath = path.join(__dirname, '../../../docs/vt_descriptions_improved.md');
fs.writeFileSync(outputPath, output, 'utf-8');

console.log(`Output written to: ${outputPath}`);
console.log(`Total pages: ${config.illusts.length}`);
