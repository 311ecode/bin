import { existsSync } from "fs";
import { join } from "path/posix";
import { getConfigDetails, log } from "../configutationProcessor.mjs";
import { generateTranslationOutputFilename } from './generateTranslationOutputFilename.mjs';
import { concatenateVerses } from "../lib/verseManipulation/concatenateVerses.mjs";
import { writeOutput } from "../writeOutput.mjs";

export async function processConcatenationTasks(configPath, executionGroup) {
  const {
    jobs,
    baseOutputPath,
    original,
    concatenate,
    modelExecutions
  } = await getConfigDetails(configPath, executionGroup);
  if (concatenate?.length > 0) {
    log('\nProcessing concatenation tasks:');
    for (const concatItem of concatenate) {
      const outputFile = concatItem.file;
      const filesToConcatenate = [];

      if (concatItem.original) {
        const originalPath = join(baseOutputPath, original);
        if (existsSync(originalPath)) {
          filesToConcatenate.push(originalPath);
        } else {
          log(`Warning: Original file not found: ${originalPath}`);
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
        const modelExecution = modelExecutions.find(exec => exec.name === model);
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
