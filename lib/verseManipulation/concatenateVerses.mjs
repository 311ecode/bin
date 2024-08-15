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
 * Concatenates verse contents into a single string.
 * 
 * @param {Array<{name: string, content: string}>} fileContents - Array of file contents.
 * @returns {string} Concatenated verses.
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
 * Creates a JSON structure from verse contents.
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

// Usage examples:
export const concatenateVerses = createVerseProcessor(concatenateVerseContents);
export const createVerseJson = createVerseProcessor(createVerseJsonStructure);