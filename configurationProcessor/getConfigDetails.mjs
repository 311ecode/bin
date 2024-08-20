import { resolve } from "path/posix";
import { resolveConfigPath, readConfigFile, log, getAllExecutionGroups } from "../configutationProcessor.mjs";

/**
 * @typedef {Object} Language
 * @property {string} language - The name of the language.
 * @property {string} filePostfix - The file postfix for the language.
 */

/**
 * @typedef {Object} Model
 * @property {string} name - The name of the model.
 * @property {string} realName - The real name of the model.
 * @property {number} maximumInputLength - The maximum input length for the model.
 * @property {number} sameLineFactor - The same line factor for the model.
 */

/**
 * @typedef {Object} Execution
 * @property {string} name - The name of the execution.
 * @property {string} prefix - The prefix for the execution.
 * @property {string} postfix - The postfix for the execution.
 * @property {string} language - The language for the execution.
 * @property {string[]} prompts - The prompts for the execution.
 */

/**
 * @typedef {Object} ConcatenateFile
 * @property {string} file - The name of the file to concatenate.
 * @property {boolean} original - Whether this is the original file.
 * @property {string} language - The language of the file.
 * @property {string[]} models - The models used for this file.
 */

/**
 * @typedef {Object} ModelExecution
 * @property {ExecutionType} executionType - The type of execution.
 * @property {string} executionGroup - The group of the execution.
 * @property {Execution[]} executions - The executions to perform.
 * @property {ConcatenateFile[]} concatenate - The files to concatenate.
 */

/**
 * @typedef {Object} TranslationConfig
 * @property {string} baseOutputPath - The base output path for translations.
 * @property {string} basePromptsPath - The base path for prompts.
 * @property {string} original - The name of the original file.
 * @property {boolean} attemptToKeepTranslationsAtTheSameLine - Whether to attempt to keep translations at the same line.
 * @property {Language[]} languages - The languages to translate to.
 * @property {Model[]} models - The models to use for translation.
 * @property {ModelExecution[]} modelExecutions - The model executions to perform.
 */

/**
 * @typedef {Object} TranslationJobContainer
 * @property {TranslationConfig} jobs - The translation job configuration.
 */

/**
 * Container for translation job configuration
 * @type {TranslationJobContainer}
 */


/**
 * @typedef {Object} ModelInfo
 * @property {string} realName - The real name of the model.
 * @property {number} maximumInputLength - The maximum input length for the model.
 * @property {number} sameLineFactor - The same line factor for the model.
 */
/**
 * @typedef {Map<string, ModelInfo>} ModelMap
 */
/**
 * @typedef {("translateAlong"|"somethingelse")} ExecutionType
 */
/**
 * Represents the configuration details.
 * @typedef {Object} ConfigDetails
 * @property {string} resolvedConfigPath - The absolute path to the configuration file.
 * @property {string} configDir - The directory containing the configuration file.
 * @property {TranslationJobContainer} config - The entire configuration object.
 * @property {TranslationConfig} jobs - The jobs section of the configuration.
 * @property {ModelMap} modelMap - A map of model names to their details.
 * @property {string} baseOutputPath - The resolved base output path.
 * @property {string} basePromptsPath - The resolved base prompts path.
 * @property {string} original - The original file path.
 * @property {Array<string>} globalPrompts - An array of global prompts.
 * @property {Execution[]} modelExecutions - An array of model executions.
 * @property {ExecutionType} executionType - The execution type to process.
 * @property {Array<object>} concatenate - An array of concatenation tasks.
 * @property {Array<string>} allExecutionGroups - An array of all execution groups.
 */
/**
 * Retrieves and processes configuration details from a given config file path.
 *
 * @param {string} configPath - The path to the configuration file.
 * @param {string} executionGroup - The execution group to process.
 * @returns {Promise<ConfigDetails>} A promise that resolves to an object containing the processed configuration details.
 * @throws {Error} If there's an issue reading or processing the configuration file.
 */

export async function getConfigDetails(configPath, executionGroup) {
  const { resolvedConfigPath, configDir } = resolveConfigPath(configPath);
  console.log(`Using configuration file: ${resolvedConfigPath}`);
  const config = await readConfigFile(resolvedConfigPath);
  const { jobs } = config;

  // Create a map of model names to their details
  const modelMap = new Map(jobs.models.map(model => [
    model.name,
    { realName: model.realName, maximumInputLength: model.maximumInputLength, sameLineFactor: model.sameLineFactor }
  ]));

  const baseOutputPath = resolve(configDir, jobs.baseOutputPath);
  const basePromptsPath = resolve(configDir, jobs.basePromptsPath);
  const original = jobs.original;

  log(`Processing job:`);
  log(`  Base Output Path: ${baseOutputPath}`);
  log(`  Base Prompts Path: ${basePromptsPath}`);
  log(`  Original File: ${original}`);

  const modelExecutionsArray = jobs.modelExecutions.filter(exec => {
    return exec.executionGroup === executionGroup;
  })[0];

  const modelExecutions = modelExecutionsArray.executions;
  const executionType = modelExecutionsArray.executionType;
  const concatenate = modelExecutionsArray.concatenate;
  const allExecutionGroups = getAllExecutionGroups(jobs);
  // const modelExecutions = jobs.modelExecutions;
  const globalPrompts = modelExecutions && modelExecutions.find(exec => Array.isArray(exec.prompts))?.prompts || [];
  return {
    resolvedConfigPath,
    configDir,
    config,
    jobs,
    modelMap,
    baseOutputPath,
    basePromptsPath,
    original,
    globalPrompts,
    modelExecutions,
    executionType,
    concatenate,
    allExecutionGroups
  };
}
