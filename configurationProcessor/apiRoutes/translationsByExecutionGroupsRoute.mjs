import { resolve } from 'path';
import { logger } from '../../lib/logger.mjs';
import express, { Router } from 'express';
import { createVerseJson } from '../../lib/verseManipulation/concatenateVerses.mjs';
import { enrichVerseJson } from '../../lib/verseManipulation/enrichVerseJson.mjs';
import fs from 'fs/promises';
import { getConfigDetails } from '../getConfigDetails.mjs';

export const log = logger()();

/**
 * @typedef {Object} TranslationExtraData
 * @property {Object} basictranslation_extraData Extra metadata for the translation
 */

/**
 * @typedef {Object} VerseTranslation
 * @property {number} verse The verse number
 * @property {string} original The original text
 * @property {Object} translations An object with translations from different models
 * @property {string} translations.original The original text (repeated for convenience)
 * @property {string} [translations.modelName] Translation by a specific model (e.g., "gemma2-27b.nl", "llama3.1-8b.nl", etc.)
 * @property {TranslationExtraData} extraData Additional data related to the translation
 */

/**
 * @typedef {Object} TranslationResult
 * @property {string} file The name of the file containing the translations
 * @property {string} language The target language of the translations
 * @property {VerseTranslation[]} translations An array of verse translations
 */

/**
 * An array of translation results
 * @type {TranslationResult[]}
 */


/**
 * Translations Route
 * 
 * This route provides access to translations based on execution groups.
 * 
 * @route GET /translations/:executionGroup
 * 
 * @param {string[]} executionGroups - Array of valid execution group names.
 * @param {string} configPath - Path to the configuration file.
 * 
 * @urlParam {string} executionGroup - The name of the execution group to retrieve translations for.
 * 
 * @returns {Router} The extra data for the specified verse, including any previously existing data.
 * 
 * @throws {404} If the specified execution group doesn't exist.
 * 
 * @example
 * // Request
 * GET /translations/group1
 * 
 * // Response
 * [
 *   {
 *     "file": "dutch-translations.md",
 *     "language": "Dutch",
 *     "translations": [
 *       {
 *         "verse": 1,
 *         "original": "Márai Sándor",
 *         "translations": {
 *           "original": "Márai Sándor",
 *           "gemma2-27b.nl": "Márai Sándor",
 *           "llama3.1-8b.nl": "Márai Sándor",
 *           "gemma2-9b.nl": "Márai Sándor",
 *           "qwen2-7b.nl": "Márai Sándor",
 *           "gemma2-2b.nl": "Márai Sándor",
 *           "mistral-nemo-12b.nl": "Sándor Márai"
 *         },
 *         "extraData": {
 *           "basictranslation_extraData": {
 *             "customKey": "customValue",
 *             "b": "colada",
 *             "c": "mango",
 *             "a": "pina"
 *           }
 *         }
 *       },
 *       // ... more verses ...
 *     ]
 *   },
 *   // ... potentially more files ...
 * ]
 * 
 * @description
 * This route handler checks if the requested execution group exists in the
 * predefined list of execution groups. If it does, it retrieves the translations
 * for that group from the configuration specified by configPath. The route
 * returns an array of objects, each representing a file with translations.
 * Each translation includes the original text and translations from various
 * models, along with any extra data associated with the translation. If the
 * execution group doesn't exist, it returns a 404 error.
 */
export const translationsByExecutionGroupsRoute = (executionGroups, configPath) => {
  const router = express.Router(); 

  router.get('/translations/:executionGroup', async (req, res) => {
    const { executionGroup } = req.params;
    if (!executionGroups.includes(executionGroup)) {
      return res.status(404).json({ error: 'Execution group not found' });
    }

    try {
      const configDetails = await getConfigDetails(configPath, executionGroup);
      const { baseOutputPath, original, concatenate, modelExecutions, jobs } = configDetails;

      if (!concatenate) {
        return res.status(404).json({ error: 'Concatenation configuration not found for this execution group' });
      }

      /**
     * An array of translation results
     * @type {TranslationResult[]}
     */
      const results = [];

      for (const concatenateConfig of concatenate) {
        const { file, original: includeOriginal, language, models } = concatenateConfig;
        const filePaths = await Promise.all(models.map(async (modelName) => {
          const execution = modelExecutions.find(exec => exec.name === modelName);
          if (!execution) return null;
          
          const langConfig = jobs.languages.find(lang => lang.language === execution.language);
          const fileName = `${modelName}${langConfig ? `.${langConfig.filePostfix}` : ''}.md`;
          const filePath = resolve(baseOutputPath, fileName);
          
          try {
            await fs.access(filePath);
            return filePath;
          } catch (error) {
            if (error.code === 'ENOENT') {
              console.log(`File not found: ${filePath}`);
              return null;
            }
            throw error;
          }
        }));

        const validFilePaths = filePaths.filter(Boolean);

        if (includeOriginal) {
          const originalPath = resolve(baseOutputPath, original);
          try {
            await fs.access(originalPath);
            validFilePaths.unshift(originalPath);
          } catch (error) {
            if (error.code === 'ENOENT') {
              console.log(`Original file not found: ${originalPath}`);
            } else {
              throw error;
            }
          }
        }

        const baseJson = await createVerseJson(validFilePaths);
        
        // Construct the extra data path
        const extraDataFileName = `${executionGroup}_extraData.md`;
        const extraDataPath = resolve(baseOutputPath, extraDataFileName);
        
        let enrichedJsonData;
        try {
          // Check if the extra data file exists
          await fs.access(extraDataPath);
        } catch (error) {
          if (error.code === 'ENOENT') {
            // File doesn't exist, create an empty file
            await fs.writeFile(extraDataPath, '');
            log(`Created empty extra data file: ${extraDataPath}`);
          } else {
            throw error;
          }
        }

        // Enrich the JSON with extra data (even if the file was just created and is empty)
        enrichedJsonData = await enrichVerseJson(baseJson, extraDataPath);
        log(`Enriched JSON data with extra data from: ${extraDataPath}`);
       
        results.push({
          file,
          language,
          translations: enrichedJsonData
        });
      }

      res.json(results);
    } catch (error) {
      console.error('Error processing request:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  return router;
}