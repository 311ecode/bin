import { join } from "path/posix";
import { generateTranslationOutputFilename } from './generateTranslationOutputFilename.mjs';
import { processConcatenationTasks } from "./processConcatenationTasks.mjs";
import { getMaxLineNumber, processTranslation } from "../translation/processTranslation.mjs";
import { logger } from "../lib/logger.mjs";
import { getConfigDetails } from "../configutationProcessor.mjs";

const log  = logger()();

export async function processTranslationExecutions(configPath, executionGroup) {

  let allCompleted = false;
  while (!allCompleted) {

    const {      
      jobs,
      modelMap,
      baseOutputPath,
      basePromptsPath,
      original,
      globalPrompts,
    } = await getConfigDetails(configPath, executionGroup);

    const { languages, attemptToKeepTranslationsAtTheSameLine} = jobs
  
    let executionProgress;
    let originalMaxLine;
    
    (
      { executionProgress, originalMaxLine, allCompleted } = 
        await calculateExecutionProgress(configPath, executionGroup, allCompleted)
    );

    if (allCompleted) break;

    // Determine which executions to process in this cycle
    let executionsToProcess;

    executionsToProcess = 
      determineExecutionsToProcess(
        attemptToKeepTranslationsAtTheSameLine, 
        executionProgress, 
        executionsToProcess
      );

    // Process the selected executions
    for (const { execution, sameLineFactor } of executionsToProcess) {
      const { name, prefix, language } = execution;
      const modelDetails = modelMap.get(name);
      const { realName, maximumInputLength } = modelDetails;
      const languageConfig = languages.find(lang => lang.language === language);
      const { filePostfix } = languageConfig;

      const originPath = join(baseOutputPath, original);
      const outputPath = join(baseOutputPath, generateTranslationOutputFilename(prefix, name, filePostfix));

      // Use global prompts
      const promptPaths = globalPrompts.map(prompt => join(basePromptsPath, prompt));

      logTranslationProgress(
        name, 
        realName, 
        originPath, 
        outputPath, 
        language, 
        filePostfix, 
        maximumInputLength, 
        sameLineFactor, 
        originalMaxLine, 
        promptPaths
      );

      await performTranslations( originPath, outputPath, promptPaths, realName, maximumInputLength, attemptToKeepTranslationsAtTheSameLine, name, originalMaxLine);

    }

    // Call processConcatenationTasks after each round
    log("\nUpdating concatenated output...");
    await processConcatenationTasks(configPath, executionGroup);
    log("Concatenated output updated.");
  }

  log("\nAll translations completed.");
  log("\nPerforming final concatenation...");
  
  await processConcatenationTasks(configPath, executionGroup);
  log("Final concatenation completed.");
}

/**
 * @typedef {Object} TranslationParams
 * @property {string} origin - The path to the origin file.
 * @property {string} output - The path where the output will be saved.
 * @property {string[]} directionFiles - An array of paths to the direction (prompt) files.
 * @property {string} model - The real name of the model to be used for translation.
 * @property {number} maxInputChunk - The maximum length of input that can be processed at once.
 */


/**
 * Performs translations on the given input file.
 * 
 * @async
 * @function performTranslations
 * @param {string} originPath - The path to the original file to be translated.
 * @param {string} outputPath - The path where the translated output will be saved.
 * @param {string[]} promptPaths - An array of paths to prompt files used for translation.
 * @param {string} realName - The real name of the model to be used for translation.
 * @param {number} maximumInputLength - The maximum length of input that can be processed at once.
 * @param {boolean} attemptToKeepTranslationsAtTheSameLine - Whether to attempt to keep translations at the same line as the original.
 * @param {string} name - The name of the current translation job (used for logging).
 * @param {number} originalMaxLine - The maximum line number of the original file.
 * @throws {Error} Throws an error if there's an issue during the translation process.
 * @returns {Promise<void>}
 */
async function performTranslations(originPath, outputPath, promptPaths, realName, maximumInputLength, attemptToKeepTranslationsAtTheSameLine, name, originalMaxLine) {

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

function logTranslationProgress(name, realName, originPath, outputPath, language, filePostfix, maximumInputLength, sameLineFactor, originalMaxLine, promptPaths) {
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
  promptPaths.forEach(path => log(`    - ${path}`));
}

/**
 * @typedef {Object} ExecutionProgressItem
 * @property {import('../configutationProcessor.mjs').Execution} execution - The execution details.
 * @property {number} adjustedProgress - The adjusted progress of the execution.
 * @property {boolean} completed - Whether the execution is completed.
 * @property {number} sameLineFactor - The factor used to adjust progress calculation.
 * @property {number} currentMaxLine - The current maximum line number processed.
 */

/**
 * Determines which executions should be processed based on the current progress and settings.
 * 
 * @function determineExecutionsToProcess
 * @param {boolean} attemptToKeepTranslationsAtTheSameLine - Whether to attempt to keep translations at the same line as the original.
 * @param {ExecutionProgressItem[]} executionProgress - An array of objects representing the progress of each execution.
 * @param {ExecutionProgressItem[]} executionsToProcess - The initial array of executions to process (may be empty).
 * @returns {ExecutionProgressItem[]} The filtered array of executions to process.
 */
function determineExecutionsToProcess(attemptToKeepTranslationsAtTheSameLine, executionProgress, executionsToProcess) {
  if (attemptToKeepTranslationsAtTheSameLine) {
    const minAdjustedProgress = Math.min(...executionProgress.map(e => e.adjustedProgress));
    log(`Minimum adjusted progress: ${minAdjustedProgress}`);
    executionsToProcess = executionProgress.filter(e => e.adjustedProgress === minAdjustedProgress && !e.completed);
  } else {
    executionsToProcess = executionProgress.filter(e => !e.completed);
  }
  return executionsToProcess;
}

// /**
//  * @typedef {import('../configutationProcessor.mjs').Execution} Execution
//  */

/**
 * @typedef {Object} ExecutionProgressConfig
 * @property {import('../configutationProcessor.mjs').Execution} execution - The execution details.
 * @property {number} currentMaxLine - The current maximum line number processed.
 * @property {number} adjustedProgress - The progress adjusted by sameLineFactor.
 * @property {boolean} completed - Whether the execution is completed.
 * @property {number} sameLineFactor - The factor used to adjust progress calculation.
 */

/**
 * @typedef {Object} ExecutionProgressResult
 * @property {ExecutionProgressConfig[]} executionProgress - Array of progress configurations for each execution.
 * @property {number} originalMaxLine - The maximum line number of the original file.
 * @property {boolean} allCompleted - Whether all executions are completed.
 */

/**
 * Calculates the progress of each execution in the translation process.
 * 
 * @async
 * @function calculateExecutionProgress
 * @param {string} configPath - The path to the configuration file.
 * @param {string} executionGroup - The group of executions to process.
 * @param {boolean} allCompleted - Initial completion status (will be updated in the function).
 * @returns {Promise<ExecutionProgressResult>} The calculated progress for each execution and overall status.
 */
async function calculateExecutionProgress(
  configPath, executionGroup,
  allCompleted 
) {

  const {      
    jobs,
    modelMap,
    baseOutputPath,
    original,
    modelExecutions
  } = await getConfigDetails(configPath, executionGroup);

  const { languages} = jobs

  const originalMaxLine = getMaxLineNumber(join(baseOutputPath, original));
  // const attemptToKeepTranslationsAtTheSameLine = jobs.attemptToKeepTranslationsAtTheSameLine || false;
  allCompleted = true;
  const executionProgress = [];
  // Fetch all execution outputs
  for (const execution of modelExecutions) {
    if (!execution.name) continue; // Skip the prompts entry
    const { name, prefix, language } = execution;
    const modelDetails = modelMap.get(name);
    if (!modelDetails) {
      console.error(`Error: Model "${name}" not found in the global models list.`);
      continue;
    }
    let { sameLineFactor = 1 } = modelDetails;
    const languageConfig = languages.find(lang => lang.language === language);
    if (!languageConfig) {
      console.error(`Error: Language "${language}" not found in the languages configuration.`);
      continue;
    }
    const { filePostfix } = languageConfig;
    const outputPath = join(baseOutputPath, generateTranslationOutputFilename(prefix, name, filePostfix));
    const currentMaxLine = getMaxLineNumber(outputPath);
    const completed = currentMaxLine >= originalMaxLine;
    // Adjust sameLineFactor based on completion status
    if (completed) {
      sameLineFactor = 0;
    }
    // 1 means that currentMaxLine is 0 and 0 means that currentMaxLine is equal to originalMaxLine
    const inverseProgress = 1 - (currentMaxLine / originalMaxLine);
    // adjust the progress based on the sameLineFactor
    const adjustedProgress = inverseProgress * (sameLineFactor === 0 ? 1 : currentMaxLine / sameLineFactor);
    const executionProgressConfig = { execution, currentMaxLine, adjustedProgress, completed, sameLineFactor };
    log({ executionProgressConfig });
    executionProgress.push(executionProgressConfig);
    if (!completed) {
      allCompleted = false;
    }
  }
  return { executionProgress, originalMaxLine, allCompleted };
}

