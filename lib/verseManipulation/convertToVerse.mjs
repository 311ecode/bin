// converts a text to verse format
export function convertToVerse(text) {
  return text
    .split('\n')
    .flatMap(line => 
      line.split(/([.!?])/).reduce((acc, part, i, arr) => {
        if (i % 2 === 0) {
          // Even indexes are sentence content
          acc.push(part.trim());
        } else {
          // Odd indexes are punctuation
          if (arr[i - 1].trim()) {
            // If previous part wasn't empty, append punctuation to it
            acc[acc.length - 1] += part;
          } else if (arr[i + 1] && arr[i + 1].trim()) {
            // If next part isn't empty, create new sentence with punctuation
            acc.push(part + arr[i + 1].trim());
            arr[i + 1] = ''; // Clear next part to avoid duplication
          }
        }
        return acc;
      }, [])
    )
    .map(e => e === '' ? '' : e.trim()) // Trim non-empty elements
    .filter((e, i, arr) => i !== arr.length - 1 || e !== '') // Remove trailing empty element
    .map((e, i) => `|${i + 1}.| ${e.length ? e : '---'}`) // Format as verse
    .join('\n');
}
