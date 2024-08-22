import express from 'express';
import { addDataToExtradata } from '../../lib/verseManipulation/addDataToExtradata.mjs';
import path from 'path';
import { getConfigDetails } from '../getConfigDetails.mjs';

export const addExtraDataRoute = (executionGroups, configPath) => {
  const router = express.Router();

  router.post('/api/addExtraDataToVerse', async (req, res) => {
    try {
      const { executionGroup, verseNumber, extraData } = req.body;

      if (!executionGroup || !verseNumber || !extraData || typeof extraData !== 'object') {
        return res.status(400).json({ error: 'Invalid input. Please provide executionGroup, verseNumber, and extraData object.' });
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

      res.status(200).json({ message: 'Extra data added successfully', executionGroup, verseNumber, extraData });
    } catch (error) {
      console.error('Error adding extra data:', error);
      res.status(500).json({ error: 'An error occurred while adding extra data' });
    }
  });

  return router;
};