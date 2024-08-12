import { readFileSync } from 'fs';
import { resolve, dirname, isAbsolute } from 'path';
import yaml from 'js-yaml';
import { parse as parseJsonc } from 'jsonc-parser';
import { fileURLToPath } from 'url';
import { logger } from './lib/logger.mjs';
import { processConcatenationTasks } from './configurationProcessor/processConcatenationTasks.mjs';
import { processTranslationExecutions } from './configurationProcessor/processTranslationExecutions.mjs';
import { defaultModelExecutions } from './configurationProcessor/processTranslationExecutions/executeTranslationCycleNextUntranslatedItems.mjs';

export const log = logger()();


export async function processConfig(args) {
  const configPath = parseConfigArgument(args);
  
  if (!configPath) {
    console.error('Please provide a configuration file using -c or --config');
    process.exit(1);
  }

  // Process model executions
  await processTranslationExecutions(
    // {
    //   processModelExecutions : (jobs, modelMap, baseOutputPath, originalMaxLine, executionProgress, allCompleted)=>{
    //     console.log(
    //       {
    //         jobs, modelMap, baseOutputPath, originalMaxLine, executionProgress, allCompleted
    //       },"FIIIII FEEEE"
    //     )
    //     return true
    //   }
    // }
  )(configPath, 'basictranslation');
  // Process concatenation tasks
  const {      
    jobs,
    baseOutputPath,
    original,
    executionGroups,
    globalPrompts,
    concatenate
  } = await getConfigDetails(configPath, 'basictranslation');

  executionGroups.forEach(group => {
    console.log(`Processing group: ${group}`);
    processConcatenationTasks(jobs, baseOutputPath, original, concatenate, globalPrompts);
  });
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  processConfig(process.argv.slice(2)).catch(error => {
    console.error('An error occurred:', error);
    process.exit(1);
  });
}


function getGroupKeys(modelExecutions) {
  const groupKeys = modelExecutions.map(group =>group.name);
  return groupKeys;
}

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
 * @property {Array<string>} executionGroups - An array of execution groups.
 * @property {Array<string>} concatenate - An array of concatenations.
 */

/**
 * Retrieves and processes configuration details from a given config file path.
 * 
 * @param {string} configPath - The path to the configuration file.
 * @param {string|false} executionGroup - The execution group to process.
 * @returns {Promise<ConfigDetails>} A promise that resolves to an object containing the processed configuration details.
 * @throws {Error} If there's an issue reading or processing the configuration file.
 */
export async function getConfigDetails(configPath, executionGroup="basictanslation") {
  log(`Reading configuration file: ${configPath}, executionGroup: ${executionGroup}`);
  const resolvedConfigPath = isAbsolute(configPath) ? configPath : resolve(process.cwd(), configPath);
  const configDir = dirname(resolvedConfigPath);

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

  // Extract global prompts
  let globalPrompts = [];
  let concatenate = [];

  if (executionGroup) {
     const filtered = jobs.modelExecutions
      .find(exec => {
        return exec.name === executionGroup
      }) 

      globalPrompts = filtered.executions
      concatenate = filtered.concatenate

  }

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
    concatenate,

    executionGroups: getGroupKeys(jobs.modelExecutions)
  };
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

