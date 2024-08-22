import express from 'express';
import { addDataToExtradata } from '../../lib/verseManipulation/addDataToExtradata.mjs';
import path from 'path';
import { getConfigDetails } from '../getConfigDetails.mjs';
import fs from 'fs/promises';

export const addExtraDataRoute = (executionGroups, configPath) => {
  const router = express.Router();
  
  router.post('/addExtraDataToVerse', async (req, res) => {
    try {
      const { executionGroup, verseNumber, extraData } = req.body;

      if (!executionGroup) {
        return res.status(400).json({ error: 'Missing executionGroup' });
      }
      
      if (!verseNumber) {
        return res.status(400).json({ error: 'Missing verseNumber' });
      }
      
      if (!extraData || typeof extraData !== 'object') {
        return res.status(400).json({ error: 'Invalid extraData. Please provide an object.' });
      }

      if (!executionGroups.includes(executionGroup)) {
        return res.status(404).json({ error: 'Execution group not found' });
      }

      const configDetails = await getConfigDetails(configPath, executionGroup);
      const { baseOutputPath } = configDetails;

      // Construct the extra data file path based on the execution group
      const extraDataFileName = `${executionGroup}_extraData.md`;
      const extraDataPath = path.join(baseOutputPath, extraDataFileName);

      // Prepare the data in the format expected by addDataToExtradata
      const newData = {
        [verseNumber]: extraData
      };

      await addDataToExtradata(extraDataPath, newData);

      // Now, let's read back the data for this verse
      const extraDataContent = await fs.readFile(extraDataPath, 'utf8');
      const lines = extraDataContent.split('\n');
      
      // Find the line for the specific verse
      const verseLine = lines.find(line => line.startsWith(`|${verseNumber}.|`));
      
      if (!verseLine) {
        return res.status(404).json({ error: 'Updated verse not found in extra data' });
      }

      // Extract the JSON data from the line
      const jsonMatch = verseLine.match(/\|(\d+)\.\|\s*(.*)/);
      if (!jsonMatch) {
        return res.status(500).json({ error: 'Failed to parse extra data for the verse' });
      }

      const [, , jsonString] = jsonMatch;
      let updatedVerse;
      try {
        updatedVerse = JSON.parse(jsonString);
      } catch (parseError) {
        console.error(`Error parsing JSON for verse ${verseNumber}: ${parseError.message}`);
        return res.status(500).json({ error: 'Failed to parse extra data JSON' });
      }

      res.status(200).json(
        updatedVerse
    );
    } catch (error) {
      console.error('Error adding extra data:', error);
      res.status(500).json({ error: 'An error occurred while adding extra data' });
    }
  });

  return router;
};