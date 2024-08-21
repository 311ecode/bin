import { resolve } from 'path';
import { logger } from '../../lib/logger.mjs';
import express from 'express';
import { createVerseJson } from '../../lib/verseManipulation/concatenateVerses.mjs';
import fs from 'fs';
import { getConfigDetails } from '../getConfigDetails.mjs';

export const log = logger()();

export const translationsByExecutionGroupsRoute = (executionGroups, configPath)=>{
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
        const filePaths = models.map(modelName => {
          const execution = modelExecutions.find(exec => exec.name === modelName);
          if (!execution) return null;
          
          const langConfig = jobs.languages.find(lang => lang.language === execution.language);
          const fileName = `${modelName}${langConfig ? `.${langConfig.filePostfix}` : ''}.md`;
          const filePath = resolve(baseOutputPath, fileName);
          
          if (fs.existsSync(filePath)) {
            return filePath;
          } else {
            console.log(`File not found: ${filePath}`);
            return null;
          }
        }).filter(Boolean);

        if (includeOriginal) {
          const originalPath = resolve(baseOutputPath, original);
          if (fs.existsSync(originalPath)) {
            filePaths.unshift(originalPath);
          } else {
            console.log(`Original file not found: ${originalPath}`);
          }
        }

        const jsonData = await createVerseJson(filePaths);
        results.push({
          file,
          language,
          translations: jsonData
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




