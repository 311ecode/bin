import { existsSync, readFileSync } from 'fs';
import { resolve, join, dirname, isAbsolute } from 'path';
import yaml from 'js-yaml';
import { parse as parseJsonc } from 'jsonc-parser';
import { getMaxLineNumber, processTranslation } from './translation/processTranslation.mjs';
import { fileURLToPath } from 'url';
import { concatenateVerses } from "./lib/verseManipulation/concatenateVerses.mjs";
import { writeOutput } from './writeOutput.mjs';
import { logger } from './lib/logger.mjs';

const log = logger()();


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

function processConcatenationTasks(jobs, baseOutputPath, original) {
  if (jobs.concatenate && jobs.concatenate.length > 0) {
    log('\nProcessing concatenation tasks:');
    for (const concatItem of jobs.concatenate) {
      const outputFile = concatItem.file;
      const filesToConcatenate = [];

      if (concatItem.original) {
        const originalPath = join(baseOutputPath, original);
        if (existsSync(originalPath)) {
          filesToConcatenate.push(originalPath);
        } else {
          console.warn(`Warning: Original file not found: ${originalPath}`);
        }
      }

      const language = concatItem.language;
      const languageConfig = jobs.languages.find(lang => lang.language === language);
      if (!languageConfig) {
        console.error(`Error: Language "${language}" not found in the languages configuration.`);
        continue;
      }
      const { filePostfix } = languageConfig;

      for (const model of concatItem.models) {
        const modelExecution = jobs.modelExecutions.find(exec => exec.name === model);
        if (!modelExecution) {
          console.error(`Error: Model execution "${model}" not found in the configuration.`);
          continue;
        }
        const { prefix } = modelExecution;
        const fileName = generateTranslationOutputFilename(prefix, model, filePostfix);
        const filePath = join(baseOutputPath, fileName);
        
        if (existsSync(filePath)) {
          filesToConcatenate.push(filePath);
        } else {
          log(`Warning: Translation file not found: ${filePath}`);
        }
      }

      log(`\nConcatenating files for ${language}:`);

      if (filesToConcatenate.length === 0) {
        log(`Warning: No files found to concatenate for ${language}. Skipping concatenation.`);
        continue;
      }

      console.log(`\nConcatenating files for ${language}:`);
      filesToConcatenate.forEach(file => console.log(`  - ${file}`));

      const concatenatedContent = concatenateVerses(filesToConcatenate);
      const outputPath = join(baseOutputPath, outputFile);

      console.log(`Writing concatenated content to: ${outputPath}`);
      writeOutput(concatenatedContent, outputPath);
    }
  }
}

async function processTranslationExecutions(jobs, modelMap, baseOutputPath, original, globalPrompts, basePromptsPath) {
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
      executionsToProcess = executionProgress.filter(e => 
        e.adjustedProgress === minAdjustedProgress && !e.completed
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

function generateTranslationOutputFilename(prefix, name, filePostfix) {
  return `${prefix}${name}.${filePostfix}.md`;
}
