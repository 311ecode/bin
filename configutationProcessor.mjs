import { readFileSync } from 'fs';
import { resolve, join, dirname, isAbsolute } from 'path';
import yaml from 'js-yaml';
import { parse as parseJsonc } from 'jsonc-parser';
import { processTranslation } from './translation/processTranslation.mjs';
import { fileURLToPath } from 'url';

function resolvePath(basePath, relativePath) {
  return isAbsolute(relativePath) ? relativePath : resolve(basePath, relativePath);
}

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

  let configContent;
  try {
    configContent = readFileSync(resolvedConfigPath, 'utf8');
  } catch (error) {
    console.error(`Error reading configuration file: ${error.message}`);
    process.exit(1);
  }
  
  let config;
  if (resolvedConfigPath.endsWith('.yaml') || resolvedConfigPath.endsWith('.yml')) {
    config = yaml.load(configContent);
  } else if (resolvedConfigPath.endsWith('.json')) {
    config = parseJsonc(configContent);
  } else {
    console.error('Unsupported configuration file format. Use .yaml, .yml, or .json');
    process.exit(1);
  }

  const { jobs } = config;

  // Create a map of model names to their details
  const modelMap = new Map(jobs.models.map(model => [
    model.name, 
    { realName: model.realName, maximumInputLength: model.maximumInputLength }
  ]));

  const baseOutputPath = resolvePath(configDir, jobs.baseOutputPath);
  const basePromptsPath = resolvePath(configDir, jobs.basePromptsPath);
  const original = jobs.original;
  
  console.log(`Processing job:`);
  console.log(`  Base Output Path: ${baseOutputPath}`);
  console.log(`  Base Prompts Path: ${basePromptsPath}`);
  console.log(`  Original File: ${original}`);

  // Extract global prompts
  const globalPrompts = jobs.modelExecutions.find(exec => Array.isArray(exec.prompts))?.prompts || [];

  // Process model executions
  for (const execution of jobs.modelExecutions) {
    if (!execution.name) continue; // Skip the prompts entry
    const { name, prefix, postfix } = execution;
    const modelDetails = modelMap.get(name);
    
    if (!modelDetails) {
      console.error(`Error: Model "${name}" not found in the global models list.`);
      continue;
    }
    
    const { realName, maximumInputLength } = modelDetails;
    
    const originPath = join(baseOutputPath, original);
    const outputPath = join(baseOutputPath, `${prefix}${name}${postfix}`);
    
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
    console.log(`  Maximum Input Length: ${maximumInputLength}`);
    console.log(`  Prompts:`);
    promptPaths.forEach(path => console.log(`    - ${path}`));
    
    try {
      await processTranslation(translationParams);
      console.log(`Translation completed for ${name}`);
    } catch (error) {
      console.error(`Error processing translation for ${name}: ${error.message}`);
    }
  }
}

// Example usage:
// node configProcessor.mjs -c config.yaml
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  processConfig(process.argv.slice(2)).catch(error => {
    console.error('An error occurred:', error);
    process.exit(1);
  });
}