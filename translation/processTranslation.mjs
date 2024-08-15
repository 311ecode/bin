import { readFileSync, existsSync, writeFileSync } from "fs";
import { chatWithOllama } from "./drivers/ollama.mjs";
// import { writeOutput } from '../writeOutput.mjs';
// import { mergeVerses } from "../lib/range/processRanges.mjs"; 
import { logger } from "../lib/logger.mjs";
import { translateAlong } from "./translateAlong.mjs";
import { mergeVerses } from '../lib/range/processRanges.mjs';

export const log = logger()();

/**
 * @typedef {'translateAlong'} TranslateStrategyType
 */

/**
 * @typedef {Object} StrategyParams
 * @property {string} originalContent - The original content to translate.
 * @property {string} directions - The translation directions.
 * @property {number} maxOrig - The maximum line number in the original content.
 * @property {number} startLine - The line number to start from.
 * @property {number} maxInputChunk - The maximum number of characters for each input chunk.
 * @property {string} model - The name of the model to use for translation.
 * @property {string} output - The path to the output file or 'stdout'.
 * @property {number} startTime - The start time of the translation process.
 */

/**
 * @typedef {Object} TranslationStrategyBase
 * @property {TranslateStrategyType} type - The type of translation strategy.
 */

/**
 * @typedef {(params: StrategyParams) => (singleRound: boolean) => Promise<void>} TranslationStrategyFunction
 */

/**
 * @typedef {TranslationStrategyFunction & TranslationStrategyBase} TranslationStrategy
 */

/**
 * Creates a function that processes a translation task based on the provided parameters.
 * @function processTranslation
 * @param {Object} params - The parameters for the translation process.
 * @param {boolean} singleRound - Whether to stop after processing the first chunk.
 * @returns {function(TranslationStrategy=): Promise<void>} A function that takes a translation strategy and returns a Promise.
 */
export function processTranslation(params, singleRound=false) {
  return async (translationStrategy=translateAlong) => {
    if (!params.origin || !params.output || params.directionFiles.length === 0) {
      console.log('Please provide origin file, output file, and at least one direction file.');
      return;
    }
    
    log('Starting translation process...');
    logParameters(params);
  
    const originalContent = readFileSync(params.origin, 'utf8');
    const directions = loadDirections(params.directionFiles);
  
    const maxOrig = getMaxLineNumber(params.origin);
    const maxDestLine = getMaxLineNumber(params.output);
    const startLine = Math.max(maxDestLine, 1);
  
    log(`Max line number in original file: ${maxOrig}`);
    log(`Starting translation from line: ${startLine}`);
  
    const startTime = Date.now();
  
    // Execute the translation strategy

    if (translationStrategy.type === 'translateAlong') {
      await translationStrategy({
        originalContent,
        directions,
        maxOrig,
        startLine,
        maxInputChunk: params.maxInputChunk,
        model: params.model,
        output: params.output,
        startTime
      })(singleRound);
    }
  
    const totalElapsedTime = (Date.now() - startTime) / 1000;
    log(`\nTranslation process completed. Total elapsed time: ${formatTime(totalElapsedTime)}`);
    log('','Ohhmm');
  }

}

// Helper functions
function logParameters(params) {
  log(`Origin file: ${params.origin}`);
  log(`Output file: ${params.output}`);
  log(`Model: ${params.model}`);
  log(`Max input chunk: ${params.maxInputChunk} characters`);
}

function loadDirections(directionFiles) {
  let directions = '';
  for (const dirFile of directionFiles) {
    directions += readFileSync(dirFile, 'utf8') + '\n';
    log(`Loaded direction file: ${dirFile}`);
  }
  return directions;
}

export function logProgress(processedBytes, totalBytes, chunk) {
  const percentOfDocument = (processedBytes / totalBytes * 100).toFixed(2);
  log(`Processed ${processedBytes} of ${totalBytes} bytes (${percentOfDocument}% of document)`);
  log('Content preview:');
  log(chunk.split('\n').slice(0, 5).join('\n') + (chunk.split('\n').length > 5 ? '\n...' : ''));
}

export function prepareChunk(originalLines, startLine, maxOrig, maxInputChunk, directions) {
  let chunk = '';
  let chunkSize = 0;
  let endLine = startLine;
  let sectionCount = 0;

  while (endLine <= maxOrig && chunkSize + directions.length < maxInputChunk) {
    const line = originalLines[endLine - 1];

    if (chunkSize + line.length + directions.length > maxInputChunk) {
      break;
    }

    chunk += line + '\n';
    chunkSize += line.length + 1;
    endLine++;

    if (line.trim().endsWith('|---')) {
      sectionCount++;
    }
  }

  let lastSeparatorIndex = chunk.lastIndexOf('|---');
  if (lastSeparatorIndex !== -1 && lastSeparatorIndex !== chunk.length - 5) {
    let lineStart = chunk.lastIndexOf('\n', lastSeparatorIndex) + 1;
    chunk = chunk.substring(0, lineStart);
    endLine = startLine + chunk.split('\n').length - 1;
  }

  return { chunk, endLine, chunkSize, sectionCount };
}

export function logProcessingStats(chunkProcessingTime, chunkCount, totalProcessingTime, maxOrig, endLine, startLine) {
  const avgChunkTime = totalProcessingTime / chunkCount;
  const estimatedTimeRemaining = avgChunkTime * ((maxOrig - endLine) / (endLine - startLine));
  log(`Chunk processing time: ${chunkProcessingTime.toFixed(2)} seconds`);
  log(`Average chunk processing time: ${avgChunkTime.toFixed(2)} seconds`);
  log(`Estimated time remaining: ${formatTime(estimatedTimeRemaining)}`);
}

export function updateProcessingStats(chunkSize, translationTime, totalProcessingTime, chunkTimes) {
  const chunkProcessingTime = translationTime;
  totalProcessingTime += chunkProcessingTime;
  chunkTimes.push(chunkProcessingTime);
  return chunkProcessingTime;
}

/**
 * Merges new translations into existing content using the mergeVerses function.
 * 
 * @param {string} existingContent - The existing translated content, with verses separated by newlines.
 * @param {string} newContent - The new translated content to be merged.
 * @param {Object} [options] - Optional parameters for merging behavior.
 * @param {boolean} [options.overwrite=true] - Whether to overwrite existing verses with new translations.
 * @param {boolean} [options.appendNewVerses=true] - Whether to append verses that don't exist in the original content.
 * @returns {string} The merged content with all verses.
 */
function mergeTranslations(existingContent, newContent, options = {}) {
  const { 
    overwrite = true, 
    appendNewVerses = true 
  } = options;

  // Parse newContent string into an object of verse numbers and contents
  /**
   * @type {import("../lib/range/processRanges.mjs").VersesObjectPresentation}
   */
  const newVerses = {};
  newContent.split('\n').forEach(line => {
    const match = line.match(/^\|(\d+)\.\|/);
    if (match) {
      newVerses[parseInt(match[1])] = line;
    }
  });

  // Use the existing mergeVerses function
  return mergeVerses(existingContent, newVerses, {
    overwrite,
    appendNewVerses,
    mergeStrategy: 'replace'
  });
}

export function writeTranslatedChunk(translatedContent, outputPath) {
  log('Writing translated chunk to output file...');
  let finalContent = translatedContent;
  if (existsSync(outputPath)) {
    const existingContent = readFileSync(outputPath, 'utf8');
    finalContent = mergeTranslations(existingContent, translatedContent);
  }
  writeFileSync(outputPath, finalContent);
  log('Chunk written to output file');
}

export function logFinalStats(startTime, totalProcessingTime, chunkCount, processedBytes, chunkTimes) {
  const totalElapsedTime = (Date.now() - startTime) / 1000;
  const avgChunkTime = totalProcessingTime / chunkCount;
  const avgCharactersPerSecond = processedBytes / totalElapsedTime;

  log('\nTranslation process completed.');
  log(`Total elapsed time: ${formatTime(totalElapsedTime)}`);
  log(`Average chunk processing time: ${avgChunkTime.toFixed(2)} seconds`);
  log(`Fastest chunk: ${Math.min(...chunkTimes).toFixed(2)} seconds`);
  log(`Slowest chunk: ${Math.max(...chunkTimes).toFixed(2)} seconds`);
  log(`Average translation speed: ${avgCharactersPerSecond.toFixed(2)} characters/second`);
}

export function translateChunk(prompt, model) {
  return async (translator = chatWithOllama)=>{
    let translatedChunk
    try {
      translatedChunk = await translator(prompt, model);
    }
    catch (error) {
      log('Error in translation:', error, 'Ohhmm');
      process.exit(1);
    }
    return translatedChunk;
  }
}

/**
 * Format a number of seconds into a human-readable string.
 * @function formatTime
 * @param {number} seconds - The number of seconds to format.
 * @returns {string} A string in the format "Xh Ym Zs".
 */
export function formatTime(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  
  return `${hours}h ${minutes}m ${remainingSeconds}s`;
}

/**
 * Get the maximum line number from a file.
 * @function getMaxLineNumber
 * @param {string} filePath - The path to the file to check.
 * @returns {number} The maximum line number found in the file.
 */
export function getMaxLineNumber(filePath) {
  if (!existsSync(filePath)) return 0;
  const content = readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  let maxLineNumber = 0;
  for (const line of lines) {
    const match = line.match(/^\|(\d+)\.\|/);
    if (match) {
      const lineNumber = parseInt(match[1]);
      if (lineNumber > maxLineNumber) {
        maxLineNumber = lineNumber;
      }
    }
  }

  return maxLineNumber;
}

/**
 * Parses verses from content and returns them as an object. 
 * Each key in the returned object is a verse number, and the corresponding value is the verse text.
 *
 * @function parseVerses
 * @param {string} content - The string containing the verses, where each verse begins with "|number|. "
 *                            (e.g., "|1|. This is verse 1.")
 * @returns {Object<string, string>} An object where keys are verse numbers and values are the corresponding verse texts.
 */
export function parseVerses(content) {
  const lines = content.split('\n');
  /** @type {Object<string, string>} */
  const verses = {};
  lines.forEach(line => {
    const match = line.match(/^\|(\d+)\.\|/);
    if (match) {
      verses[match[1]] = line;
    }
  });

  return verses;
}


