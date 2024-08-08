import { readFileSync } from "fs";
import { concatenateVerses } from "./lib/verseManipulation/concatenateVerses.mjs";
import { convertFromVerse } from "./lib/verseManipulation/convertFromVerse.mjs";
import { convertToVerse } from "./lib/verseManipulation/convertToVerse.mjs";
import { parseArguments } from "./lib/parseArguments.mjs"; 
import { printHelp } from "./printHelp.mjs";
import { processRanges } from "./lib/range/processRanges.mjs"; 
import { processTranslation } from "./translation/processTranslation.mjs";
import { writeOutput } from './writeOutput.mjs';

export async function processFiles(args) {
  let params = parseArguments(args);

  if (params.ranges.length > 0) {
    processRanges(params);
  } else if (params.concat.length >= 2) {
    let concatenated = concatenateVerses(params.concat);
    writeOutput(concatenated, params.output);
  } else if (params.toVerse && params.input) {
    let content = readFileSync(params.input, 'utf8');
    let result = convertToVerse(content);
    writeOutput(result, params.output);
  } else if (params.fromVerse && params.input) {
    let content = readFileSync(params.input, 'utf8');
    let result = convertFromVerse(content);
    writeOutput(result, params.output);
  } else if (params.origin && params.directionFiles.length > 0) {
    await processTranslation(params);
  } else if (params.input) {
    let result = processFiles(params.input);
    writeOutput(result, params.output);
  } else {
    printHelp();
  }
}
