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
 * Resolves a path to its absolute counterpart.
 * 
 * @param {string} basePath - The base path from which the path will be resolved. (e.g., 'project/')
 * @param {string} relativePath - The path to resolve within the base path, either using an absolute path reference or resolving relative to the base path. 
 * @returns {string}  - The absolute path. 
 */
function resolvePath(basePath, relativePath) {
  return isAbsolute(relativePath) ? relativePath : resolve(basePath, relativePath);
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

export async function processConfig(args) {
  const configPath = parseConfigArgument(args);
  
  if (!configPath) {
    console.error('Please provide a configuration file using -c or --config');
    process.exit(1);
  }

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

  const baseOutputPath = resolvePath(configDir, jobs.baseOutputPath);
  const basePromptsPath = resolvePath(configDir, jobs.basePromptsPath);
  const original = jobs.original;
  
  log(`Processing job:`);
  log(`  Base Output Path: ${baseOutputPath}`);
  log(`  Base Prompts Path: ${basePromptsPath}`);
  log(`  Original File: ${original}`);

  // Extract global prompts
  const globalPrompts = jobs.modelExecutions.find(exec => Array.isArray(exec.prompts))?.prompts || [];

  // Process model executions
  await processTranslationExecutions(jobs, modelMap, baseOutputPath, original, globalPrompts, basePromptsPath);
  // Process concatenation tasks
  processConcatenationTasks(jobs, baseOutputPath, original);
}

// Example usage:
// node configProcessor.mjs -c config.yaml
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  processConfig(process.argv.slice(2)).catch(error => {
    console.error('An error occurred:', error);
    process.exit(1);
  });
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

