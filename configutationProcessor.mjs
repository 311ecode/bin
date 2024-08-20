import { readFileSync } from 'fs';
import { resolve, dirname, isAbsolute } from 'path';
import yaml from 'js-yaml';
import { parse as parseJsonc } from 'jsonc-parser';
import { logger } from './lib/logger.mjs';
import { fileURLToPath } from 'url';
import { processConfig } from './configurationProcessor/processConfig.mjs';

export const log = logger()();

/**
 * Parses a command-line argument representing a configuration file path.
 * 
 * @param {string[]} args An array of command-line arguments.
 * @returns {string|null} The path to the configuration file, or null if no config flag was provided.
 */
export function parseConfigArgument(args) {
  const configFlag = args.findIndex(arg => arg === '-c' || arg === '--config');
  if (configFlag === -1 || configFlag === args.length - 1) {
    return null;
  }
  return args[configFlag + 1];
}

export function getAllExecutionGroups (jobs) {
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
 * @returns {Promise<import('./configurationProcessor/getConfigDetails.mjs').TranslationJobContainer>} A Promise that resolves with a parsed object representing the configuration data or `undefined` if an error occurred.
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

export function resolveConfigPath(configPath) {
  const resolvedConfigPath = isAbsolute(configPath) ? configPath : resolve(process.cwd(), configPath);
  const configDir = dirname(resolvedConfigPath);
  return { resolvedConfigPath, configDir };
}

export function parseExecutionGroups(args) {
  const egIndex = args.findIndex(arg => arg === '-eg' || arg === '--executionGroups');
  if (egIndex === -1) return [];
  
  const groups = [];
  for (let i = egIndex + 1; i < args.length; i++) {
    if (args[i].startsWith('-')) break;
    groups.push(args[i]);
  }
  return groups;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  processConfig(process.argv.slice(2)).catch(error => {
    console.error('An error occurred:', error);
    process.exit(1);
  });
}