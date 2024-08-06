export function convertFromVerse(text) {
  let verses = text.split('\n');
  let result = [];
  let emptyLineCount = 0;

  for (let verse of verses) {
    verse = verse.trim();
    if (verse.endsWith('|---')) {
      emptyLineCount++;
    } else {
      if (emptyLineCount > 0) {
        result.push(...Array(emptyLineCount).fill(''));
        emptyLineCount = 0;
      }
      let content = verse.replace(/^\|\d+\.\|\s*/, '').trim();
      result.push(content);
    }
  }

  // Add empty lines at the end
  if (emptyLineCount > 0) {
    result.push(...Array(emptyLineCount).fill(''));
  }

  return result.join('\n') + '\n';
}