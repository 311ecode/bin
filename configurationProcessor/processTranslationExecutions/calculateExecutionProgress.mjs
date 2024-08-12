import { join } from "path/posix";
import { getConfigDetails } from "../../configutationProcessor.mjs";
import { getMaxLineNumber } from "../../translation/processTranslation.mjs";
import { generateTranslationOutputFilename } from "../generateTranslationOutputFilename.mjs";
import { log } from "../processTranslationExecutions.mjs";

// /**
//  * @typedef {import('../configutationProcessor.mjs').Execution} Execution
//  */
/**
 * @typedef {Object} ExecutionProgressConfig
 * @property {import('../../configutationProcessor.mjs').Execution} execution - The execution details.
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
export async function calculateExecutionProgress(
  configPath, executionGroup,
  allCompleted) {

  const {
    jobs, modelMap, baseOutputPath, original, modelExecutions
  } = await getConfigDetails(configPath, executionGroup);

  const { languages } = jobs;

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
