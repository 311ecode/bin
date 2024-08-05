
export function parseRange(range) {
  const [start, end] = range.split('-').map(Number);
  return { start, end };
}

export function extractVerseRanges(content, ranges) {
  const lines = content.split('\n');
  const extractedVerses = {};

  ranges.forEach(range => {
    for (let i = range.start; i <= range.end; i++) {
      const verseLine = lines.find(line => line.startsWith(`|${i}.|`));
      if (verseLine) {
        extractedVerses[i] = verseLine;
      }
    }
  });

  return extractedVerses;
}
