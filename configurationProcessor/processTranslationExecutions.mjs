import { join } from "path/posix";
import { generateTranslationOutputFilename } from './generateTranslationOutputFilename.mjs';
import { processConcatenationTasks } from "./processConcatenationTasks.mjs";
import { getMaxLineNumber, processTranslation } from "../translation/processTranslation.mjs";
import { logger } from "../lib/logger.mjs";
import { getConfigDetails, readConfigFile } from "../configutationProcessor.mjs";

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
      globalPrompts
    } = await getConfigDetails(configPath, executionGroup);
  
    const originalMaxLine = getMaxLineNumber(join(baseOutputPath, original));
    const attemptToKeepTranslationsAtTheSameLine = jobs.attemptToKeepTranslationsAtTheSameLine || false;
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
      // 1 means that currentMaxLine is 0 and 0 means that currentMaxLine is equal to originalMaxLine
      const inverseProgress = 1 - (currentMaxLine / originalMaxLine);
      // adjust the progress based on the sameLineFactor
      const adjustedProgress = inverseProgress * (sameLineFactor === 0 ? 1 : currentMaxLine / sameLineFactor);
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
    await processConcatenationTasks(configPath, executionGroup);
    log("Concatenated output updated.");
  }

  log("\nAll translations completed.");
  log("\nPerforming final concatenation...");
  
  await processConcatenationTasks(configPath, executionGroup);
  log("Final concatenation completed.");
}
