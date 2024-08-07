/**
 * @typedef {Object} Range
 *   The range object will contain the start and end values of a given interval. 
 */

/**
 * Parses a range string into a numeric start and end value.
 * @param {string} range - The range in the format 'start-end' (e.g., '5-10').
 * @returns {Object} An object containing the start, end values, and an error message if the input is invalid. 
 *   If there are 2 numbers separated by a hyphen, the output will be two number values.
 */
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

/**
 * Extracts verse ranges from the provided content. 
 * @param {string} content - The content to extract verses from.
 * @param {Array<Object>} ranges - An array of range objects, defining the start and end values for each verse range. 
 * @returns {Object} An object containing the extracted verse lines for each identified verse number.
 */
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