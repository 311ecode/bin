import { readFileSync } from "fs";
import { mapVersesToArray } from "./mapVersesToArray.mjs";

export function concatenateVerses(filePaths) {
  const fileContents = filePaths.map(filePath => readFileSync(filePath, 'utf8'));
  return concatenateVerseContents(fileContents);
}

export function concatenateVerseContents(fileContents) {
  let mappedVerses = mapVersesToArray(fileContents);
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
          // All sentences are the same
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
          // Only one version
          result += ` ${versions[0].sentence}\n`;
        }
      }
      result += '\n';
    }
  });

  return result.trim();
}
