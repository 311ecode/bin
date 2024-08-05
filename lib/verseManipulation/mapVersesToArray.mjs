import { readFileSync } from "fs";
import { basename } from "path/posix";

export function mapVersesToArray(filePaths) {
  let versionNames = filePaths.map(filePath => basename(filePath, '.verses').replace('.md', ''));
  let allVerses = [];

  filePaths.forEach((filePath, index) => {
    try {
      let content = readFileSync(filePath, 'utf8').split('\n');
      content.forEach(line => {
        let match = line.match(/^\|(\d+)\.\|\s*(.*)/);
        if (match) {
          let lineNumber = parseInt(match[1]);
          let sentence = match[2].trim();
          if (!allVerses[lineNumber]) {
            allVerses[lineNumber] = [];
          }
          allVerses[lineNumber].push({
            name: versionNames[index],
            sentence: sentence
          });
        }
      });
    } catch (err) {
      console.error(`Error reading file ${filePath}:`, err);
    }
  });

  return allVerses;
}
