import fs from 'fs/promises';
import path from 'path';

/**
 * Adds or updates extra data for verses in a specified file.
 * If a property in newData has a value of null, that property will be removed from the stored data.
 * @param {string} extraDataPath - Path to the extra data file.
 * @param {Object} newData - Object containing new data to add or update, keyed by verse number.
 * @returns {Promise<void>}
 */
export async function addDataToExtradata(extraDataPath, newData) {
  try {
    let extraDataContent = '';
    try {
      extraDataContent = await fs.readFile(extraDataPath, 'utf8');
    } catch (error) {
      if (error.code !== 'ENOENT') {
        throw error;
      }
      // File doesn't exist, we'll create it
    }

    const extraDataLines = extraDataContent.split('\n');
    const extraDataMap = new Map();

    // Parse existing data
    extraDataLines.forEach(line => {
      const match = line.match(/^\|(\d+)\.\|\s*(.*)/);
      if (match) {
        const [, verseNumber, jsonData] = match;
        try {
          extraDataMap.set(parseInt(verseNumber), JSON.parse(jsonData));
        } catch (parseError) {
          console.error(`Error parsing extra data for verse ${verseNumber}: ${parseError.message}`);
        }
      }
    });

    // Merge new data with existing data
    Object.entries(newData).forEach(([verseNumber, data]) => {
      const existingData = extraDataMap.get(parseInt(verseNumber)) || {};
      const updatedData = { ...existingData };
      
      Object.entries(data).forEach(([key, value]) => {
        if (value === null) {
          delete updatedData[key];
        } else {
          updatedData[key] = value;
        }
      });
      
      extraDataMap.set(parseInt(verseNumber), updatedData);
    });

    // Prepare updated content
    const updatedContent = Array.from(extraDataMap.entries())
      .sort(([a], [b]) => a - b) // Sort by verse number
      .map(([verseNumber, data]) => `|${verseNumber}.| ${JSON.stringify(data)}`)
      .join('\n');

    // Write updated content back to file
    await fs.writeFile(extraDataPath, updatedContent);

    console.log(`Extra data updated successfully in ${extraDataPath}`);
  } catch (error) {
    console.error(`Error updating extra data: ${error.message}`);
    throw error;
  }
}