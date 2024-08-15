/**
 * @typedef {'translateAlong'} TranslateStrategyType
 */

import { log, logFinalStats, logProcessingStats, logProgress, prepareChunk, translateChunk, updateProcessingStats, writeTranslatedChunk } from "./processTranslation.mjs";

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
 * @property {'translateAlong'} type - The type of translation strategy.
 */

/**
 * @typedef {function(StrategyParams): function(boolean): Promise<void>} TranslationStrategyFunction
 */

/**
 * @typedef {TranslationStrategyFunction & TranslationStrategyBase} TranslationStrategy
 */

/**
 * The default translation strategy.
 * @type {TranslationStrategy}
 */
export const translateAlong = Object.assign(
  /**
   * @param {StrategyParams} params
   * @returns {function(boolean): Promise<void>}
   */
  function(params) {
    return async function(singleRound) {
      const { originalContent, directions, maxOrig, startLine: initialStartLine, maxInputChunk, model, output, startTime } = params;
      const originalLines = originalContent.split('\n');
      let translatedContent = '';
      let chunkCount = 0;
      const totalBytes = Buffer.byteLength(originalContent, 'utf8');
      let processedBytes = 0;
      let totalProcessingTime = 0;
      /** @type {number[]} */
      let chunkTimes = [];
      let startLine = initialStartLine;

      while (startLine <= maxOrig) {
        const chunkStartTime = Date.now();
        chunkCount++;
        log(`\nProcessing chunk #${chunkCount}`);

        const { chunk, endLine, chunkSize, sectionCount } = prepareChunk(originalLines, startLine, maxOrig, maxInputChunk, directions);

        const chunkBytes = Buffer.byteLength(chunk, 'utf8');
        processedBytes += chunkBytes;
        logProgress(processedBytes, totalBytes, chunk);

        const prompt = directions + '\n' + chunk;
        log('Chunk ready for translation: \n-----\n\n' + prompt + '\n\n-----\n');

        const translationStartTime = Date.now();
        const translatedChunk = await translateChunk(prompt, model)();
        const translationTime = (Date.now() - translationStartTime) / 1000;

        log(`Received translated chunk from model in ${translationTime.toFixed(2)} seconds`, 'Ohhmm');

        const chunkProcessingTime = updateProcessingStats(chunkSize, translationTime, totalProcessingTime, chunkTimes);
        logProcessingStats(chunkProcessingTime, chunkCount, totalProcessingTime, maxOrig, endLine, startLine);

        translatedContent += translatedChunk + '\n';
        log('Translated content preview:', translatedContent);

        if (output !== 'stdout') {
          writeTranslatedChunk(translatedContent, output);
        }

        startLine = endLine;
        log(`Translated up to line ${startLine - 1} of ${maxOrig}`);
        log(`Progress: ${((startLine - 1) / maxOrig * 100).toFixed(2)}%`);

        if (singleRound) {
          log('Single round translation completed. Stopping after first chunk.');
          break;
        }
      }

      logFinalStats(startTime, totalProcessingTime, chunkCount, processedBytes, chunkTimes);

      if (output === 'stdout') {
        log('Outputting complete translation to stdout:');
        log(translatedContent);
      } else {
        log('Translation process completed. All chunks have been written to the output file.');
      }
    };
  },
  /** @type {TranslationStrategyBase} */
  ({ type: 'translateAlong' })
);
