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
 * @callback ProcessModelExecutionsFunction
 * @param {Object} jobs - The translation jobs to be processed.
 * @param {Map<string, ModelDetails>} modelMap - A map of model names to their configurations.
 * @param {string} baseOutputPath - The base path for output files.
 * @param {number} originalMaxLine - The maximum line number in the original text.
 * @param {ExecutionProgress[]} executionProgress - An array to track the progress of executions.
 * @param {boolean} allCompleted - A flag indicating if all translations are completed.
 * @returns {boolean} Returns true if all translations are completed, false otherwise.
 */

/**
 * @typedef {Object} DefaultModelExecutions
 * @property {ProcessModelExecutionsFunction} processModelExecutions - Function to process model executions.
 */
export const defaultModelExecutions = {
  processModelExecutions
}

export const  executeTranslationCycleNextUntranslatedItems = (processModelExecutionsContainer) => async (configPath, executionGroup) => {
  const modelexecutions = { ...defaultModelExecutions, ...processModelExecutionsContainer };
  const { processModelExecutions } = modelexecutions;
  let allCompleted = false;
  while (!allCompleted) {

    const {
      jobs, modelMap, baseOutputPath, basePromptsPath, original, globalPrompts, concatenate
    } = await getConfigDetails(configPath, executionGroup);

    const originalMaxLine = getMaxLineNumber(join(baseOutputPath, original));
    const attemptToKeepTranslationsAtTheSameLine = jobs.attemptToKeepTranslationsAtTheSameLine || false;
    allCompleted = true;
    const executionProgress = [];

    allCompleted = processModelExecutions(
      jobs,
      modelMap,
      baseOutputPath,
      originalMaxLine,
      executionProgress,
      allCompleted);

    if (allCompleted) break;

    // Determine which executions to process in this cycle
    let executionsToProcess;
    if (attemptToKeepTranslationsAtTheSameLine) {
      const minAdjustedProgress = Math.min(...executionProgress.map(e => e.adjustedProgress));
      log(`Minimum adjusted progress: ${minAdjustedProgress}`);
      executionsToProcess = executionProgress.filter(e => e.adjustedProgress === minAdjustedProgress && !e.completed
      );
    } else {
      executionsToProcess = executionProgress.filter(e => !e.completed);
    }

    // Process the selected executions
    for (const { execution, sameLineFactor } of executionsToProcess) {
      const { name, prefix, language } = execution;
      const modelDetails = modelMap.get(name);
      const { realName, maximumInputLength } = modelDetails;
      const languageConfig = jobs.languages.find(lang => lang.language === language);
      const { filePostfix } = languageConfig;

      const originPath = join(baseOutputPath, original);
      const outputPath = join(baseOutputPath, generateTranslationOutputFilename(prefix, name, filePostfix));

      // Use global prompts
      const promptPaths = globalPrompts.map(prompt => join(basePromptsPath, prompt));

      const translationParams = {
        origin: originPath,
        output: outputPath,
        directionFiles: promptPaths,
        model: realName,
        maxInputChunk: maximumInputLength
      };

      logTranslationDetails(name, realName, 
        originPath, outputPath, 
        language, filePostfix, 
        maximumInputLength, sameLineFactor, 
        originalMaxLine);

      await processModelExecutions(promptPaths, translationParams, name, attemptToKeepTranslationsAtTheSameLine, outputPath, originalMaxLine);
    }

    // Call processConcatenationTasks after each round
    log("\nUpdating concatenated output...");
    await processConcatenationTasks(jobs, baseOutputPath, original,concatenate, globalPrompts);
    log("Concatenated output updated.");
  }

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

