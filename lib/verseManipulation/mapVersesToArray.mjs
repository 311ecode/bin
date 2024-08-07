/**
 * Maps verses from multiple file contents into a structured array.
 * 
 * @param {Array<{name: string, content: string}>} fileContents - An array of objects, each representing a file:
 *   - name: A string identifying the file (e.g., "filename1").
 *   - content: A string containing the file's content.
 * 
 * @returns {Array<Array<{name: string, sentence: string}>>} An array where:
 *   - The index corresponds to the verse number.
 *   - Each element is an array of objects, where each object represents a version of the verse and contains:
 *     - name: A string identifying the source file.
 *     - sentence: The text content of the verse.
 * 
 * @description
 * This function processes multiple file contents, each potentially containing verses in the format "|number.| text".
 * It creates a structured array where each verse number maps to an array of all versions of that verse found across the input files.
 * This allows for easy comparison and analysis of verses across multiple sources.
 * 
 * @example
 * const fileContents = [
 *   { name: "filename1", content: "|1.| First verse from file 1\n|2.| Second verse from file 1" },
 *   { name: "filename2", content: "|1.| First verse from file 2\n|2.| Second verse from file 2" }
 * ];
 * const result = mapVersesToArray(fileContents);
 * // result[1] would be:
 * // [
 * //   { name: "filename1", sentence: "First verse from file 1" },
 * //   { name: "filename2", sentence: "First verse from file 2" }
 * // ]
 */
export function mapVersesToArray(fileContents) {
  let allVerses = [];

  fileContents.forEach((file) => {
    let lines = file.content.split('\n');
    lines.forEach(line => {
      let match = line.match(/^\|(\d+)\.\|\s*(.*)/);
      if (match) {
        let lineNumber = parseInt(match[1]);
        let sentence = match[2].trim();
        if (!allVerses[lineNumber]) {
          allVerses[lineNumber] = [];
        }
        allVerses[lineNumber].push({
          name: file.name,
          sentence: sentence
        });
      }
    });
  });

  return allVerses;
}