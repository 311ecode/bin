import { join } from "path/posix";
import { generateTranslationOutputFilename } from './generateTranslationOutputFilename.mjs';
import { processConcatenationTasks } from "./processConcatenationTasks.mjs";
import { getMaxLineNumber, processTranslation } from "../translation/processTranslation.mjs";

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

      executionProgress.push({
        execution,
        currentMaxLine,
        adjustedProgress,
        completed,
        sameLineFactor
      });

      if (!completed) {
        allCompleted = false;
      }
    }

    if (allCompleted) break;

    // Determine which executions to process in this cycle
    let executionsToProcess;
    if (attemptToKeepTranslationsAtTheSameLine) {
      const minAdjustedProgress = Math.min(...executionProgress.map(e => e.adjustedProgress));
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

      console.log(`\nProcessing translation for ${name} (using model ${realName}):`);
      console.log(`  Origin: ${originPath}`);
      console.log(`  Output: ${outputPath}`);
      console.log(`  Language: ${language}`);
      console.log(`  File Postfix: ${filePostfix}`);
      console.log(`  Maximum Input Length: ${maximumInputLength}`);
      console.log(`  Same Line Factor: ${sameLineFactor}`);
      console.log(`  Current progress: ${getMaxLineNumber(outputPath)} / ${originalMaxLine} lines`);
      console.log(`  Adjusted progress: ${(getMaxLineNumber(outputPath) / sameLineFactor).toFixed(2)} lines`);
      console.log(`  Prompts:`);
      promptPaths.forEach(path => console.log(`    - ${path}`));

      try {
        await processTranslation(translationParams, true);
        console.log(`Chunk translation completed for ${name}`);
      } catch (error) {
        console.error(`Error processing translation for ${name}: ${error.message}`);
      }

      if (!attemptToKeepTranslationsAtTheSameLine) {
        // If we're not trying to keep translations at the same line, process the entire file
        while (getMaxLineNumber(outputPath) < originalMaxLine) {
          await processTranslation(translationParams, true);
        }
      }
    }

    // Call processConcatenationTasks after each round
    console.log("\nUpdating concatenated output...");
    await processConcatenationTasks(jobs, baseOutputPath, original);
    console.log("Concatenated output updated.");
  }

  console.log("\nAll translations completed.");
  console.log("\nPerforming final concatenation...");
  await processConcatenationTasks(jobs, baseOutputPath, original);
  console.log("Final concatenation completed.");
}
