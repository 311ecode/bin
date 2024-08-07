export function convertFromVerse(input) {
  // Split the input into lines
  let lines = input.trim().split('\n');
  
  let resultingArray = lines.map(line => {
    // Check if the line is a separator
    if (line.trim().endsWith('|---')) {
      return '\n';
    } else {
      // Remove verse numbers and trim
      return line.replace(/^\s*\|\d+\.\|\s*/, '').trim();
    }
  });

  let resultingString = ''; // Initialize as an empty string

  // We cannot use join here because the join method will not add the new line character.
  resultingArray.forEach((element, index) => {
    if (element === '\n') {
      resultingString += element;
    } else {
      resultingString += (index > 0 ? ' ' : '') + element;
    }
  });
  
  resultingString = resultingString.split('\n').map(line => line.trim()).join('\n');
  // Trim any leading or trailing whitespace
  return resultingString.trim();
}