export function mapVersesToArray(fileContents) {
  let allVerses = [];

  fileContents.forEach((content, index) => {
    let lines = content.split('\n');
    lines.forEach(line => {
      let match = line.match(/^\|(\d+)\.\|\s*(.*)/);
      if (match) {
        let lineNumber = parseInt(match[1]);
        let sentence = match[2].trim();
        if (!allVerses[lineNumber]) {
          allVerses[lineNumber] = [];
        }
        allVerses[lineNumber].push({
          name: `file${index + 1}`,
          sentence: sentence
        });
      }
    });
  });

  return allVerses;
}