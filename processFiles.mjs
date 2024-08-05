import { readFileSync } from "fs";
import { concatenateVerses } from "./concatenateVerses.mjs";
import { convertFromVerse } from "./convertFromVerse.mjs";
import { convertToVerse } from "./convertToVerse.mjs";
import { parseArguments } from "./parseArguments.mjs";
import { printHelp } from "./printHelp.mjs";
import { processRanges } from "./processRanges.mjs";
import { processTranslation } from "./translation/processTranslation.mjs";
import { writeOutput } from "./verser.mjs";

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
    let result = processFile(params.input);
    writeOutput(result, params.output);
  } else {
    printHelp();
  }
}
