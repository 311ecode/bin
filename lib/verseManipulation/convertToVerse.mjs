/**
 * Converts a text to verse format. 
 * 
 * @param {string} text The text to convert.
 * @returns {string} The text in verse format.
 */
export function convertToVerse(text) {
  return text
    .split('\n')
    .flatMap(line => 
      line.split(/([.!?]+(?:\s+|$))/).reduce((acc, part, i, arr) => {
        if (i % 2 === 0) {
          // Even indexes are sentence content
          acc.push(part.trim());
        } else {
          // Odd indexes are punctuation
          if (arr[i - 1].trim()) { 
            // If previous part wasn't empty, append punctuation to it
            acc[acc.length - 1] += part.trim();
          } else if (arr[i + 1] && arr[i + 1].trim()) { 
            // If next part isn't empty, create new sentence with punctuation
            acc.push(part.trim() + arr[i + 1].trim());
            arr[i + 1] = ''; // Clear next part to avoid duplication
          } else {
            // Handle case where punctuation is at the end of a line
            acc[acc.length - 1] += part.trim();
          }
        }
        return acc;
      }, [])
    )
    .map(e => e === '' ? '' : e.trim())
    .filter((e, i, arr) => i !== arr.length - 1 || e !== '')
    .map((e, i) => `|${i + 1}.| ${e.length ? e : '---'}`)
    .join('\n');
}