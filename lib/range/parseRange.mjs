export function parseRange(range) {
  const parts = range.split('-').map(Number);
  if (parts.some(isNaN)) {
    return { start: NaN, end: NaN, error: "Invalid range format: must be numbers separated by a hyphen" };
  }
  if (parts.length === 1) {
    const number = parts[0];
    return { start: number, end: number };
  }
  if (parts.length !== 2) {
    return { start: NaN, end: NaN, error: "Invalid range format: use either a single number or two numbers separated by a hyphen" };
  }
  const [a, b] = parts;
  return { start: Math.min(a, b), end: Math.max(a, b) };
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
