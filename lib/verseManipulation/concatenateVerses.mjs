import { existsSync, readFileSync } from 'fs';
import { basename } from 'path';
import { logger } from '../logger.mjs';

const log = logger()();

/**
 * A higher-order function that creates a verse processing function.
 * 
 * @param {Function} processor - A function to process the verse contents.
 * @returns {Function} A function that takes file paths and processes their contents.
 */
export const createVerseProcessor = (processor) => (filePaths) => {
  const fileContents = filePaths
    .filter(filePath => {
      if (!existsSync(filePath)) {
        log(`File not found: ${filePath}`);
        return false;
      }
      return true;
    })
    .map(filePath => ({
      name: basename(filePath).replace(/\.[^/.]+$/, ""),
      content: readFileSync(filePath, 'utf8')
    }));

  return processor(fileContents);
};

/**
 * Concatenates verse contents from multiple files into a single string.
 * 
 * This function uses {@link mapVersesToArray} to structure the verses,
 * then processes them to create a formatted string output.
 * 
 * @param {Array<{name: string, content: string}>} fileContents - Array of file contents.
 * @returns {string} Concatenated verses with formatting.
 */
export const concatenateVerseContents = (fileContents) => {
  const mappedVerses = mapVersesToArray(fileContents);
  let result = '';

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
          result += ` ${versions[0].sentence}\n`;
        } else if (uniqueSentences.size > 1) {
          result += '\n';
          for (let [sentence, names] of uniqueSentences) {
            if (names.length > 1) {
              result += `[${names.join(' ')}] ${sentence}\n`;
            } else {
              result += `[${names[0]}] ${sentence}\n`;
            }
          }
        } else {
          result += ` ${versions[0].sentence}\n`;
        }
      }
      result += '\n';
    }
  });

  return result.trim();
};

/**
 * Creates a JSON structure from verse contents of multiple files.
 * 
 * This function uses {@link mapVersesToArray} to structure the verses,
 * then transforms them into a JSON-friendly format.
 * 
 * @param {Array<{name: string, content: string}>} fileContents - Array of file contents.
 * @returns {Array<Object>} Array of verse objects with translations.
 */
export const createVerseJsonStructure = (fileContents) => {
  const mappedVerses = mapVersesToArray(fileContents);
  const result = [];

  mappedVerses.forEach((versions, index) => {
    if (versions && versions.length > 0) {
      const verseObject = {
        verse: index,
        original: versions[0].sentence,
        translations: {}
      };

      versions.forEach(v => {
        verseObject.translations[v.name] = v.sentence;
      });

      result.push(verseObject);
    }
  });

  return result;
};

/**
 * Maps verses from multiple file contents into a structured array.
 * 
 * This function is used by both {@link concatenateVerseContents} and 
 * {@link createVerseJsonStructure} to organize verses from multiple files.
 * 
 * @param {Array<{name: string, content: string}>} fileContents - Array of file contents.
 * @returns {Array<Array<{name: string, sentence: string}>>} Structured array of verses.
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
/**
 * Creates a function that concatenates verses from multiple files.
 * 
 * This function uses {@link createVerseProcessor} with {@link concatenateVerseContents}
 * to process multiple files and concatenate their verses.
 * 
 * @type {Function}
 */
export const concatenateVerses = createVerseProcessor(concatenateVerseContents);

/**
 * Creates a function that generates a JSON structure from verses in multiple files.
 * 
 * This function uses {@link createVerseProcessor} with {@link createVerseJsonStructure}
 * to process multiple files and create a JSON representation of their verses.
 * 
 * @type {Function}
 */
export const createVerseJson = createVerseProcessor(createVerseJsonStructure);