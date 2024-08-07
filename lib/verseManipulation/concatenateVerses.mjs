import { readFileSync } from "fs";
import { mapVersesToArray } from "./mapVersesToArray.mjs";
import { basename } from "path";

/**
 * Concatenates the contents of multiple verse files into a single string, separated by newlines and indicating chapter numbers.
 * 
 * @param {string[]} filePaths An array of paths to the files containing the verse content.
 * @returns {string} A string containing the concatenated verses with chapter numbers. 
 */
export function concatenateVerses(filePaths) {
  const fileContents = filePaths.map(filePath => ({
    name: basename(filePath).replace(/\.[^/.]+$/, ""), // Extract filename without any extension
    content: readFileSync(filePath, 'utf8')
  }));
  return concatenateVerseContents(fileContents);
}

/**
 * Concatenates the verse contents of multiple files into a single string.
 * The string is separated by newlines and indicates chapter numbers for each verse.
 * The function will attempt to consolidate verses with the same sentence, if possible.
 * 
 * @param {Array<{name: string, content: string}>} fileContents - An array of objects, each representing a file:
 *   - name: A string identifying the file (e.g., "filename1").
 *   - content: A string containing the file's content.
 * @returns {string} A single string containing the concatenated verses.
 */
export function concatenateVerseContents(fileContents) {
  // Map to organize and consolidate verses by sentence
  const mappedVerses = mapVersesToArray(fileContents);

  let result = ''; // Initialize the result string

  mappedVerses.forEach((versions, index) => {
    if (versions && versions.length > 0) {
      result += `[${index}.]`;
      if (versions.every(v => v.sentence === '---')) {
        result += ' ---\n';
      } else {
        let uniqueSentences = new Map();

        versions.forEach(v => {
          if (!uniqueSentences.has(v.sentence)) {
            uniqueSentences.set(v.sentence, [v.name]);
          } else {
            uniqueSentences.get(v.sentence).push(v.name);
          }
        });

        if (uniqueSentences.size === 1 && versions.length > 1) {
          // All sentences are the same
          result += ` ${versions[0].sentence}\n`;
        } else if (uniqueSentences.size > 1) {
          // More than one sentence
          result += '\n';
          for (let [sentence, names] of uniqueSentences) {
            if (names.length > 1) {
              result += `[${names.join(' ')}] ${sentence}\n`;
            } else {
              result += `[${names[0]}] ${sentence}\n`;
            }
          }
        } else {
          // Only one version
          result += ` ${versions[0].sentence}\n`;
        }
      }
      result += '\n';
    }
  });

  return result.trim();
}
