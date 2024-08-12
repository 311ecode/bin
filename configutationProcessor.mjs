import { readFileSync } from 'fs';
import { resolve, dirname, isAbsolute } from 'path';
import yaml from 'js-yaml';
import { parse as parseJsonc } from 'jsonc-parser';
import { fileURLToPath } from 'url';
import { logger } from './lib/logger.mjs';
import { processConcatenationTasks } from './configurationProcessor/processConcatenationTasks.mjs';
import { processTranslationExecutions } from './configurationProcessor/processTranslationExecutions.mjs';

export const log = logger()();

/**
 * Parses a command-line argument representing a configuration file path.
 * 
 * @param {string[]} args An array of command-line arguments.
 * @returns {string|null} The path to the configuration file, or null if no config flag was provided.
 */
function parseConfigArgument(args) {
  const configFlag = args.findIndex(arg => arg === '-c' || arg === '--config');
  if (configFlag === -1 || configFlag === args.length - 1) {
    return null;
  }
  return args[configFlag + 1];
}

export async function processConfig(args) {
  const configPath = parseConfigArgument(args);
  
  if (!configPath) {
    console.error('Please provide a configuration file using -c or --config');
    process.exit(1);
  }

  const {resolvedConfigPath} = await resolveConfigPath(configPath);
  const rawConfig = await readConfigFile(resolvedConfigPath);
  const allExecutionGroups = await getAllExecutionGroups(rawConfig.jobs)

  // Process model executions
  for (const executionGroup of allExecutionGroups) {
    await processTranslationExecutions(configPath, executionGroup);
    await processConcatenationTasks(configPath, executionGroup);
  }

}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  processConfig(process.argv.slice(2)).catch(error => {
    console.error('An error occurred:', error);
    process.exit(1);
  });
}

/**
 * Represents the details of a model.
 * @typedef {Object} ModelDetails
 * @property {string} realName - The real name of the model.
 * @property {number} maximumInputLength - The maximum input length for the model.
 * @property {number} sameLineFactor - The same line factor for the model.
 */

/**
 * Represents the configuration details.
 * @typedef {Object} ConfigDetails
 * @property {string} resolvedConfigPath - The absolute path to the configuration file.
 * @property {string} configDir - The directory containing the configuration file.
 * @property {Object} config - The entire configuration object.
 * @property {Object} jobs - The jobs section of the configuration.
 * @property {Map<string, ModelDetails>} modelMap - A map of model names to their details.
 * @property {string} baseOutputPath - The resolved base output path.
 * @property {string} basePromptsPath - The resolved base prompts path.
 * @property {string} original - The original file path.
 * @property {Array<string>} globalPrompts - An array of global prompts.
 * @property {Array<object>} modelExecutions - An array of model executions.
 * @property {string} executionType - The execution type to process.
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
  })[0]

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

function getAllExecutionGroups (jobs) {
  return jobs.modelExecutions.map(exec => exec.executionGroup)
}

/**
 * Parses a YAML or JSON configuration file.
 * 
 * @param {string} resolvedConfigPath - The path to the configuration file (e.g., './config.yaml', '/path/to/config.json').
 * @param {string} configContent - The raw content of the configuration file.
 * 
 * @returns {object} A parsed object representing the configuration data or `undefined` if an error occurred.
 */
function parseConfigFile(resolvedConfigPath, configContent) {
  let config;
  if (resolvedConfigPath.endsWith('.yaml') || resolvedConfigPath.endsWith('.yml')) {
    config = yaml.load(configContent);
  } else if (resolvedConfigPath.endsWith('.json')) {
    config = parseJsonc(configContent);
  } else {
    console.error('Unsupported configuration file format. Use .yaml, .yml, or .json');
    process.exit(1);
  }
  return config;
}

/**
 * Reads a configuration file asynchronously and parses it using the `parseConfigFile` function.
 *
 * @param {string} resolvedConfigPath - The path to the configuration file (e.g., './config.yaml', '/path/to/config.json').
 * 
 * @returns {Promise<object>} A Promise that resolves with a parsed object representing the configuration data or `undefined` if an error occurred.
 */
export async function readConfigFile(resolvedConfigPath) {
  let configContent

  try {
    configContent = readFileSync(resolvedConfigPath, 'utf8');
  } catch (error) {
    console.error(`Error reading configuration file: ${error.message}`);

    // wait 10 seconds and try it again
    await new Promise(resolve => setTimeout(resolve, 10000));
    try {
      configContent = readFileSync(resolvedConfigPath, 'utf8');
    }
    catch (error) {
      console.error(`Error reading configuration file: ${error.message}`);
      process.exit(1);
    }

  }

  return parseConfigFile(resolvedConfigPath, configContent);
}

  function resolveConfigPath(configPath) {
    const resolvedConfigPath = isAbsolute(configPath) ? configPath : resolve(process.cwd(), configPath);
    const configDir = dirname(resolvedConfigPath);
    return { resolvedConfigPath, configDir };
  }

