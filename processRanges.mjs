import { readFileSync, existsSync } from "fs";
import { extractVerseRanges, writeOutput } from "./verser.mjs";

export function processRanges(params) {
  if (!params.input || params.ranges.length === 0) {
    console.log('Please provide an input file and at least one range.');
    return;
  }

  const content = readFileSync(params.input, 'utf8');
  const extractedVerses = extractVerseRanges(content, params.ranges);

  if (params.review) {
    // let reviewContent = '';
    // if (params.output && params.output !== 'stdout' && existsSync(params.output)) {
    //   const existingContent = readFileSync(params.output, 'utf8');
    //   reviewContent = mergeVerses(existingContent, extractedVerses);
    // } else {
    //   reviewContent = Object.values(extractedVerses).join('\n');
    // }
    // console.log('Review of changes:');
    // console.log(reviewContent);
  } else if (params.output && params.output !== 'stdout') {
    let outputContent = Object.values(extractedVerses).join('\n');
    if (existsSync(params.output)) {
      const existingContent = readFileSync(params.output, 'utf8');
      outputContent = mergeVerses(existingContent, extractedVerses);
    }
    writeOutput(outputContent, params.output);
  } else {
    console.log(Object.values(extractedVerses).join('\n'));
  }
}

export function mergeVerses(existingContent, newVerses) {
  const existingLines = existingContent.split('\n');
  const mergedVerses = {};

  existingLines.forEach(line => {
    const match = line.match(/^\|(\d+)\.\|/);
    if (match) {
      const verseNumber = parseInt(match[1]);
      mergedVerses[verseNumber] = line;
    }
  });

  Object.assign(mergedVerses, newVerses);

  return Object.entries(mergedVerses)
    .sort(([a], [b]) => parseInt(a) - parseInt(b))
    .map(([_, line]) => line)
    .join('\n');
}
