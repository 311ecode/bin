import { join } from "path/posix";
import { getConfigDetails } from "../../configutationProcessor.mjs";
import { getMaxLineNumber, processTranslation } from "../../translation/processTranslation.mjs";
import { generateTranslationOutputFilename } from "../generateTranslationOutputFilename.mjs";
import { processConcatenationTasks } from "../processConcatenationTasks.mjs";
import { log } from "../processTranslationExecutions.mjs";
import { processModelExecutions } from "../processTranslationExecutions/processModelExecutions.mjs";

/**
 * @typedef {Object} ModelDetails
 * @property {string} realName - The actual name of the model.
 * @property {number} maximumInputLength - The maximum input length for the model.
 * @property {number} sameLineFactor - The same line factor for the model.
 */

/**
 * @typedef {Object} ExecutionProgress
 * @property {number} adjustedProgress - The adjusted progress of the execution.
 * @property {boolean} completed - Whether the execution is completed.
 */

/**
 * @typedef {Object} DefaultModelExecutions
 * @property {Object} processModelExecutions - Function to process model executions.
 */
export const defaultModelExecutions = {
  processModelExecutions
}

export const  executeTranslationCycleNextUntranslatedItems = (processModelExecutionsContainer={}) => async (configPath, executionGroup) => {
  const modelexecutions = { ...defaultModelExecutions, ...processModelExecutionsContainer };
  const { processModelExecutions } = modelexecutions;
    processModelExecutions(configPath, executionGroup);
  log("\nAll translations completed.");
  log("\nPerforming final concatenation...");

  const {
    jobs, baseOutputPath, original, concatenate, globalPrompts
  } = await getConfigDetails(configPath, executionGroup);

  await processConcatenationTasks(jobs, baseOutputPath, original, concatenate, globalPrompts);
  log("Final concatenation completed.");
}

/**
 * Logs the details of a translation process.
 * 
 * @param {string} name - The name of the translation being processed.
 * @param {string} realName - The actual name of the translation model used.
 * @param {string} originPath - The path to the original source file.
 * @param {string} outputPath - The path to the output translated file.
 * @param {string} language - The target language for the translation.
 * @param {string} filePostfix - The file extension used for the translated files.
 * @param {number} maximumInputLength - The maximum length of text input allowed per prompt.
 * @param {number} sameLineFactor - A factor to adjust the progress based on line splitting strategy.
 * @param {number} originalMaxLine - The total number of lines in the original file. 
 */
function logTranslationDetails(name, realName, originPath, outputPath, language, filePostfix, maximumInputLength, sameLineFactor, originalMaxLine) {
  log(`\nProcessing translation for ${name} (using model ${realName}):`);
  log(`  Origin: ${originPath}`);
  log(`  Output: ${outputPath}`);
  log(`  Language: ${language}`);
  log(`  File Postfix: ${filePostfix}`);
  log(`  Maximum Input Length: ${maximumInputLength}`);
  log(`  Same Line Factor: ${sameLineFactor}`);
  log(`  Current progress: ${getMaxLineNumber(outputPath)} / ${originalMaxLine} lines`);
  log(`  Adjusted progress: ${(getMaxLineNumber(outputPath) / sameLineFactor).toFixed(2)} lines`);
  log(`  Prompts:`);
}

