import { resolve } from 'path';
import { logger } from '../../lib/logger.mjs';
import express from 'express';
import { createVerseJson } from '../../lib/verseManipulation/concatenateVerses.mjs';
import { enrichVerseJson } from '../../lib/verseManipulation/enrichVerseJson.mjs';
import fs from 'fs/promises';
import { getConfigDetails } from '../getConfigDetails.mjs';

export const log = logger()();

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