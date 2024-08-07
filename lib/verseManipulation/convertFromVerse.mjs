export function convertFromVerse(text) {
  let verses = text.split('\n');
  let result = '';
  let consecutiveNewlines = 0;
  let lastLineWasContent = false;

  for (let verse of verses) {
    verse = verse.trim();
    if (verse.endsWith('|---')) {
      consecutiveNewlines++;
    } else {
      if (lastLineWasContent) {
        result += '\n'.repeat(Math.max(consecutiveNewlines, 1));
      } else if (consecutiveNewlines > 0) {
        result += '\n'.repeat(consecutiveNewlines);
      }
      result += verse.replace(/^\|\d+\.\|\s*/, '');
      consecutiveNewlines = 0;
      lastLineWasContent = true;
    }
  }

  return result.trim();
}