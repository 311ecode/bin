/**
 * Converts a text to verse format. 
 * 
 * @param {string} text The text to convert.
 * @returns {string} The text in verse format.
 */
export function convertToVerse(text) {
  return text
    // Split the input text into an array of lines based on newline characters
    .split('\n')
    // Flatten each line using split, where we use a regular expression to split by punctuation marks like periods, question marks and exclamation marks
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
    // If the array is not empty, we map each line element to a string format:
    .map(e => e === '' ? '' : e.trim()) 
    // We remove any trailing empty elements from the verse text array by using filter and index
    .filter((e, i, arr) => i !== arr.length - 1 || e !== '') 
    // Map each element to a string format with line breaks and punctuation
    .map((e, i) => `|${i + 1}.| ${e.length ? e : '---'}`) 
    // Join the array of strings using newline characters for verse formatting
    .join('\n');
}