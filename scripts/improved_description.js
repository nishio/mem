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

console.log("Improved Description Extraction\n");
console.log("ID | Page Name | Description");
console.log("---|-----------|------------");

for (const item of config.illusts) {
  const pageName = item.page_ja;
  const filePath = path.join(__dirname, '../data/ja/pages', `${pageName}.md`);

  if (!fs.existsSync(filePath)) {
    console.log(`${item.id} | ${pageName} | [FILE NOT FOUND]`);
    continue;
  }

  const fileContent = fs.readFileSync(filePath, 'utf-8');
  const { content } = matter(fileContent);

  const description = extractImprovedDescription(content);

  // Truncate for display
  const display = description.substring(0, 80).replace(/\n/g, ' ');

  console.log(`${item.id} | ${pageName} | ${display || '[EMPTY]'}`);
}
