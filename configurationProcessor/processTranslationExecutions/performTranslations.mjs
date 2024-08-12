import { processTranslation, getMaxLineNumber } from "../../translation/processTranslation.mjs";
import { log } from "../processTranslationExecutions.mjs";

/**
 * @typedef {Object} TranslationParams
 * @property {string} origin - The path to the origin file.
 * @property {string} output - The path where the output will be saved.
 * @property {string[]} directionFiles - An array of paths to the direction (prompt) files.
 * @property {string} model - The real name of the model to be used for translation.
 * @property {number} maxInputChunk - The maximum length of input that can be processed at once.
 */

/**
 * @typedef {(
*   originPath: string,
*   outputPath: string,
*   promptPaths: string[],
*   realName: string,
*   maximumInputLength: number,
*   attemptToKeepTranslationsAtTheSameLine: boolean,
*   name: string,
*   originalMaxLine: number
* ) => Promise<void>} TranslationFunction
* 
* @description
* Performs translations on the given input file.
* @throws {Error} Throws an error if there's an issue during the translation process.
*/

/**
* @type {TranslationFunction}
*/
export async function performTranslations(originPath, outputPath, promptPaths, realName, maximumInputLength, attemptToKeepTranslationsAtTheSameLine, name, originalMaxLine) {

  try {

    /** @type {TranslationParams} */
    const translationParams = {
      origin: originPath,
      output: outputPath,
      directionFiles: promptPaths,
      model: realName,
      maxInputChunk: maximumInputLength
    };

    if (attemptToKeepTranslationsAtTheSameLine) {
      await processTranslation(translationParams, true);
      log(`Chunk translation completed for ${name}`);
    }

    if (!attemptToKeepTranslationsAtTheSameLine) {
      // If we're not trying to keep translations at the same line, process the entire file
      while (getMaxLineNumber(outputPath) < originalMaxLine) {
        await processTranslation(translationParams, true);
      }
    }
  } catch (error) {
    log(`Error processing translation for ${name}: ${error.message}`);
  }
}
