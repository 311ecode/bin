// converts a text to verse format
export function convertToVerse(text) {
  let paragraphs = text.split('\n');
  let verseNumber = 1;
  let result = '';

  for (let paragraph of paragraphs) {
    if (paragraph.trim() === '') {
      result += `|${verseNumber}.|---\n`;
      verseNumber++;
    } else {
      let sentences = paragraph.match(/[^.!?]+[.!?]+/g) || [paragraph];
      for (let sentence of sentences) {
        sentence = sentence.trim();
        if (/^\|\d+\.\|/.test(sentence)) {
          result += sentence + '\n';
        } else {
          result += `|${verseNumber}.| ${sentence}\n`;
          verseNumber++;
        }
      }
    }
  }

  return result.trim();
}
