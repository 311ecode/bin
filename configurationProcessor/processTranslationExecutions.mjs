import { join } from "path/posix";
import { generateTranslationOutputFilename } from './generateTranslationOutputFilename.mjs';
import { processConcatenationTasks } from "./processConcatenationTasks.mjs";
import { logger } from "../lib/logger.mjs";
import { getConfigDetails } from "../configutationProcessor.mjs";
import { logTranslationProgress } from "./processTranslationExecutions/logTranslationProgress.mjs";
import { determineExecutionsToProcess } from "./processTranslationExecutions/determineExecutionsToProcess.mjs";
import { calculateExecutionProgress } from "./processTranslationExecutions/calculateExecutionProgress.mjs";
import { kindTranslateAlong } from "./processTranslationExecutions/kinds/kindTranslateAlong.mjs";

export const log  = logger()();

/**
 * Processes translation executions based on the provided configuration and execution group.
 * 
 * @async
 * @function processTranslationExecutions
 * @param {string} configPath - The path to the configuration file.
 * @param {string} executionGroup - The group of executions to process. Valid values include "external" and potentially others defined in the configuration.
 * @throws {Error} Throws an error if there's an issue during the translation process.
 * @returns {Promise<void>}
 * 
 * @description
 * This function performs the following steps:
 * 1. Loads configuration details
 * 2. Calculates execution progress
 * 3. Determines which executions to process
 * 4. Processes selected executions
 * 5. Updates concatenated output after each round
 * 6. Performs final concatenation when all translations are completed
 * 
 * The `executionGroup` parameter determines which set of executions from the configuration will be processed.
 * For example, when `executionGroup` is "external", it processes the executions defined for external translations.
 */
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
      executionType
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
      if (executionType === 'translateAlong') {
        await kindTranslateAlong(originPath, outputPath, promptPaths, realName, maximumInputLength, attemptToKeepTranslationsAtTheSameLine, name, originalMaxLine);
      }


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


