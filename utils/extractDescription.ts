/**
 * Extract description from markdown content for Visual Thinking pages.
 *
 * This function handles two patterns:
 * - Pattern A: Image first, description after (non-indented image)
 * - Pattern B: Description first, indented image after (Scrapbox nested style)
 *
 * @param markdown The markdown content (without frontmatter is preferred)
 * @returns Extracted description text, or empty string if none found
 */
export function extractDescription(markdown: string): string {
  // Remove frontmatter if present
  let text = markdown.replace(/^---[\s\S]*?---\n/, "");

  // Remove footer section (anything after horizontal rule ---)
  // This removes translation attribution like "This page is a high-quality translation from..."
  const hrIndex = text.indexOf("\n---\n");
  if (hrIndex !== -1) {
    text = text.substring(0, hrIndex);
  }

  const lines = text.split("\n");

  // Pattern B: Check for indented image (説明 → インデント画像)
  // In Scrapbox, even 1 space is indentation, but after Markdown conversion
  // it becomes at least 2 spaces or a tab
  let indentedImageIndex = -1;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // Image line that starts with whitespace (at least 2 spaces or 1 tab)
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

      // Remove list markers (-, *, numbers)
      processedLine = processedLine.replace(/^[-*]\s+/, '');
      processedLine = processedLine.replace(/^\d+\.\s+/, '');

      // Skip metadata links (from, next, prev)
      if (processedLine.match(/^from\s+\[\[/) ||
          processedLine.match(/^next:\s+\[\[/) ||
          processedLine.match(/^prev\s+\[\[/)) {
        continue;
      }

      if (processedLine.length > 0) {
        result += processedLine + "\n";
        paragraphCount++;

        // Stop after 2 paragraphs or 300 chars
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
    // Non-indented Gyazo image (starts at column 0)
    if (line.match(/^!\[.*?\]\(https:\/\/gyazo\.com/) && !line.match(/^\s/)) {
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

      // Remove list markers (-, *, numbers)
      processedLine = processedLine.replace(/^[-*]\s+/, '');
      processedLine = processedLine.replace(/^\d+\.\s+/, '');

      // Skip metadata links (from, next, prev)
      if (processedLine.match(/^from\s+\[\[/) ||
          processedLine.match(/^next:\s+\[\[/) ||
          processedLine.match(/^prev\s+\[\[/)) {
        continue;
      }

      if (processedLine.length > 0) {
        result += processedLine + "\n";
        paragraphCount++;

        // Stop after 2 paragraphs or 300 chars
        if (paragraphCount >= 2 || result.length > 300) {
          break;
        }
      }
    }

    return result.trim();
  }

  return "";
}
