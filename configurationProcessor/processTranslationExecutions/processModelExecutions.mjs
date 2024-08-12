import { join } from "path/posix";
import { getMaxLineNumber } from "../../translation/processTranslation.mjs";
import { generateTranslationOutputFilename } from "../generateTranslationOutputFilename.mjs";
import { log } from "../processTranslationExecutions.mjs";

/**
 * @type {import('./executeTranslationCycleNextUntranslatedItems.mjs').ProcessModelExecutionsFunction}
 */
export function processModelExecutions(jobs, modelMap, baseOutputPath, originalMaxLine, executionProgress, allCompleted) {
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
      console.error(`Error: Language2 "${language}" not found in the languages configuration.`);
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
  return allCompleted;
}
