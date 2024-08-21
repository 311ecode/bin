import express from 'express';
import { addDataToExtradata } from '../../lib/verseManipulation/addDataToExtradata.mjs';
import path from 'path';

export const addExtraDataRoute = express.Router();

addExtraDataRoute.post('/api/addExtraDataToVerse', async (req, res) => {
  try {
    const { verseNumber, extraData } = req.body;

    if (!verseNumber || !extraData || typeof extraData !== 'object') {
      return res.status(400).json({ error: 'Invalid input. Please provide verseNumber and extraData object.' });
    }

    // Assuming the extra data file is named 'extra_data.json' and is in the same directory as your verses
    const extraDataPath = path.join(process.cwd(), 'data', 'extra_data.json');

    // Prepare the data in the format expected by addDataToExtradata
    const newData = {
      [verseNumber]: extraData
    };

    await addDataToExtradata(extraDataPath, newData);

    res.status(200).json({ message: 'Extra data added successfully', verseNumber, extraData });
  } catch (error) {
    console.error('Error adding extra data:', error);
    res.status(500).json({ error: 'An error occurred while adding extra data' });
  }
});
