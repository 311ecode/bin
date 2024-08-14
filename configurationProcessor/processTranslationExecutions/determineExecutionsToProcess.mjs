import { log } from "../processTranslationExecutions.mjs";

/**
 * @typedef {Object} ExecutionProgressItem
 * @property {import('../../configutationProcessor.mjs').Execution} execution - The execution details.
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
 * @returns {ExecutionProgressItem[]} The filtered array of executions to process.
 */
export function determineExecutionsToProcess(attemptToKeepTranslationsAtTheSameLine, executionProgress) {
  let returningExecutions = [];
  if (attemptToKeepTranslationsAtTheSameLine) {
    const minAdjustedProgress = Math.min(...executionProgress.filter(e=>!e.completed).map(e => e.adjustedProgress));
    log(`Minimum adjusted progress: ${minAdjustedProgress}`);
    
    returningExecutions = executionProgress.filter(e => e.adjustedProgress === minAdjustedProgress && !e.completed);

  } else {
    returningExecutions = executionProgress.filter(e => !e.completed);
  }
  returningExecutions = returningExecutions.length ? returningExecutions : executionProgress;

  return returningExecutions;
}
