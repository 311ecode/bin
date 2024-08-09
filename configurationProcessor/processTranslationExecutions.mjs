import { join } from "path/posix";
import { generateTranslationOutputFilename } from './generateTranslationOutputFilename.mjs';
import { processConcatenationTasks } from "./processConcatenationTasks.mjs";
import { getMaxLineNumber, processTranslation } from "../translation/processTranslation.mjs";
import { logger } from "../lib/logger.mjs";

const log  = logger()();

/**
 * Processes multiple translation jobs concurrently, managing their execution and progress.
 * 
 * @async
 * @function processTranslationExecutions
 * @param {Object} jobs - The configuration object for translation jobs.
 * @param {boolean} [jobs.attemptToKeepTranslationsAtTheSameLine=false] - Whether to try to keep all translations at the same line number.
 * @param {Array<Object>} jobs.modelExecutions - Array of model execution configurations.
 * @param {Array<Object>} jobs.languages - Array of language configurations.
 * @param {Map<string, Object>} modelMap - A map of model names to their configurations.
 * @param {string} baseOutputPath - The base path for output files.
 * @param {string} original - The filename of the original text to be translated.
 * @param {Array<string>} globalPrompts - Array of global prompt filenames.
 * @param {string} basePromptsPath - The base path for prompt files.
 * @throws {Error} Throws an error if there's an issue during translation processing.
 * @returns {Promise<void>} A promise that resolves when all translations are completed.
 * 
 * @description
 * This function manages the execution of multiple translation jobs. It iterates through each job,
 * checking progress and executing translations as needed. It supports concurrent translation
 * with the option to keep all translations progressing at roughly the same pace. After each
 * round of translations, it updates a concatenated output of all translations.
 * 
 * @example
 * const jobs = {
 *   attemptToKeepTranslationsAtTheSameLine: true,
 *   modelExecutions: [...],
 *   languages: [...]
 * };
 * const modelMap = new Map([...]);
 * await processTranslationExecutions(jobs, modelMap, './output', 'original.txt', ['prompt1.txt', 'prompt2.txt'], './prompts');
 */
export async function processTranslationExecutions(jobs, modelMap, baseOutputPath, original, globalPrompts, basePromptsPath) {
  const attemptToKeepTranslationsAtTheSameLine = jobs.attemptToKeepTranslationsAtTheSameLine || false;
  const originalMaxLine = getMaxLineNumber(join(baseOutputPath, original));
  let allCompleted = false;

  while (!allCompleted) {
    allCompleted = true;
    const executionProgress = [];

    // Fetch all execution outputs
    for (const execution of jobs.modelExecutions) {
      if (!execution.name) continue; // Skip the prompts entry
      const { name, prefix, language } = execution;
      const modelDetails = modelMap.get(name);

      if (!modelDetails) {
        console.error(`Error: Model "${name}" not found in the global models list.`);
        continue;
      }

      let { sameLineFactor = 1 } = modelDetails;
      const languageConfig = jobs.languages.find(lang => lang.language === language);
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

      const adjustedProgress = sameLineFactor === 0 ? Infinity : currentMaxLine / sameLineFactor;

      const executionProgressConfig = { execution, currentMaxLine, adjustedProgress, completed, sameLineFactor };

      log({executionProgressConfig});

      executionProgress.push(executionProgressConfig);

      if (!completed) {
        allCompleted = false;
      }
    }

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

      try {
        await processTranslation(translationParams, true);
        log(`Chunk translation completed for ${name}`);
      } catch (error) {
        log(`Error processing translation for ${name}: ${error.message}`);
      }

      if (!attemptToKeepTranslationsAtTheSameLine) {
        // If we're not trying to keep translations at the same line, process the entire file
        while (getMaxLineNumber(outputPath) < originalMaxLine) {
          await processTranslation(translationParams, true);
        }
      }
    }

    // Call processConcatenationTasks after each round
    log("\nUpdating concatenated output...");
    await processConcatenationTasks(jobs, baseOutputPath, original);
    log("Concatenated output updated.");
  }

  log("\nAll translations completed.");
  log("\nPerforming final concatenation...");
  await processConcatenationTasks(jobs, baseOutputPath, original);
  log("Final concatenation completed.");
}
