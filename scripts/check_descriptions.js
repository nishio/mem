const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');

// Read vt_config.json
const configPath = path.join(__dirname, '../vt_config.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

function extractShortDescription(markdown) {
  // Remove frontmatter
  let text = markdown.replace(/^---[\s\S]*?---\n/, "");
  // Remove image links
  text = text.replace(/!\[.*?\]\(.*?\)/g, "");

  const lines = text.split("\n").filter((line) => line.trim().length > 0);
  let description = "";
  let paragraphCount = 0;

  for (const line of lines) {
    // Skip headers and list items
    if (line.startsWith("#") || line.startsWith("-") || line.startsWith("*")) {
      continue;
    }
    description += line + "\n";
    if (line.trim().length > 0) {
      paragraphCount++;
    }
    // Get first 2 paragraphs or 300 chars
    if (paragraphCount >= 2 || description.length > 300) {
      break;
    }
  }

  return description.trim();
}

function extractIndentedAfterImage(markdown) {
  // Remove frontmatter
  let text = markdown.replace(/^---[\s\S]*?---\n/, "");

  const lines = text.split("\n");
  let result = "";

  for (let i = 0; i < lines.length - 1; i++) {
    // Find image line
    if (lines[i].match(/!\[.*?\]\(https:\/\/gyazo\.com/)) {
      const nextLine = lines[i + 1];
      // Check if next line is indented (starts with space or tab)
      if (nextLine && (nextLine.startsWith(' ') || nextLine.startsWith('\t'))) {
        result = nextLine.trim();
        break;
      }
    }
  }

  return result;
}

console.log("ID | Page Name | Current Method | Indented After Image");
console.log("---|-----------|----------------|---------------------");

for (const item of config.illusts) {
  const pageName = item.page_ja;
  const filePath = path.join(__dirname, '../data/ja/pages', `${pageName}.md`);

  if (!fs.existsSync(filePath)) {
    console.log(`${item.id} | ${pageName} | [FILE NOT FOUND] | [FILE NOT FOUND]`);
    continue;
  }

  const fileContent = fs.readFileSync(filePath, 'utf-8');
  const { content } = matter(fileContent);

  const currentMethod = extractShortDescription(content);
  const indentedMethod = extractIndentedAfterImage(content);

  // Truncate for display
  const currentDisplay = currentMethod.substring(0, 60).replace(/\n/g, ' ');
  const indentedDisplay = indentedMethod.substring(0, 60).replace(/\n/g, ' ');

  console.log(`${item.id} | ${pageName} | ${currentDisplay || '[EMPTY]'} | ${indentedDisplay || '[EMPTY]'}`);
}
