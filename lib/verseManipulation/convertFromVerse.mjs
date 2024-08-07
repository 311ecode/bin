/**
 * Converts a verse string with separators into a formatted array of verses.
 * 
 * @param {string} input The verse string to convert.
 * @returns {string} A formatted string of verses separated by newlines.
 */

export function convertFromVerse(input) {
  // Split the input into lines
  let lines = input.trim().split('\n'); 
  
  // Map each line to transform it based on separator pattern
  let resultingArray = lines.map(line => {
    if (line.trim().endsWith('|---')) { // Check for separators using a specific end pattern
      return '\n'; // Replace with new line character if a separator is found. 
    } else {
      // Remove verse numbers and trim
      return line.replace(/^\s*\|\d+\.\|\s*/, '').trim();
    }
  });

  let resultingString = '';  
  // We cannot use join here because the join method will not add the new line character.
  resultingArray.forEach((element, index) => {
    if (element === '\n') { // Adding new line to the string if a separator is encountered. 
      resultingString += element; 
    } else {
      resultingString += (index > 0 ? ' ' : '') + element;
    }
  });

  // Trim leading/trailing whitespace from resultingString.
  resultingString = resultingString.split('\n').map(line => line.trim()).join('\n');
  // Return the resulting formatted string after trimming.
  return resultingString.trim();
}