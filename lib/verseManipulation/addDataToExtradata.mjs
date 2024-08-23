import fs from 'fs/promises';
import path from 'path';

/**
 * Adds or updates extra data for verses in a specified file.
 * If a property in newData has a value of null, that property will be removed from the stored data.
 * If the resulting object is empty, the line will be removed from the file.
 * @param {string} extraDataPath - Path to the extra data file.
 * @param {Object} newData - Object containing new data to add or update, keyed by verse number.
 * @returns {Promise<void>}
 */
export async function addDataToExtradata(extraDataPath, newData, spyFunctionForTests = null) {
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
      
      if (Object.keys(updatedData).length > 0) {
        extraDataMap.set(parseInt(verseNumber), updatedData);
      } else {
        extraDataMap.delete(parseInt(verseNumber));
      }
    });

    // Prepare updated content
    const updatedContent = Array.from(extraDataMap.entries())
      .sort(([a], [b]) => a - b) // Sort by verse number
      .map(([verseNumber, data]) => `|${verseNumber}.| ${JSON.stringify(data)}`)
      .join('\n');

    // Write updated content back to file
    await fs.writeFile(extraDataPath, updatedContent);

    console.log(`Extra data updated successfully in ${extraDataPath}`);

    // Occasionally call weedOutEmptyObjects
    // If needed we can use the retutn value of weedOutEmptyObjects to check if there were any lines removed.
    // If so, we can increase the frequency of calling weedOutEmptyObjects, I assume if we had a some lines removed,
    // we can reset the frequency to the default value.
    const N = parseInt(process.env.VERSER_WEED_OUT_FREQUENCY) || 1000;
    if (Math.random() < 1 / N) {
      if (spyFunctionForTests) {
        await spyFunctionForTests(extraDataPath);
      } else {
        await weedOutEmptyObjects(extraDataPath);
      }
    }
  } catch (error) {
    console.error(`Error updating extra data: ${error.message}`);
    throw error;
  }
}

/**
 * Scans the extra data file and removes any lines containing empty objects or invalid JSON.
 * @param {string} extraDataPath - Path to the extra data file.
 * @returns {Promise<Object>} An object containing:
 *   - purgedLines {number}: The number of lines removed from the file.
 *   - processingTime {number}: The total processing time in nanoseconds.
 *   - timeUnit {string}: The unit of time measurement (always 'nanoseconds').
 *   - processingTimeMs {number}: (Optional) The processing time in milliseconds, if it's an integer.
 *   - processingTimeS {number}: (Optional) The processing time in seconds, if it's an integer.
 * @throws {Error} If there's an issue reading from or writing to the file.
 */
export async function weedOutEmptyObjects(extraDataPath) {
  const startTime = process.hrtime.bigint();
  try {
    // Read the file content
    const content = await fs.readFile(extraDataPath, 'utf8');
    
    // Split the content into lines
    const lines = content.split('\n');
    
    let purgedLines = 0;
    
    // Filter out lines with empty objects or invalid JSON
    const filteredLines = lines.filter(line => {
      const match = line.match(/^\|(\d+)\.\|\s*(.*)/);
      if (match) {
        const [, , jsonData] = match;
        try {
          const parsedData = JSON.parse(jsonData);
          if (Object.keys(parsedData).length === 0) {
            purgedLines++;
            return false;
          }
          return true;
        } catch (parseError) {
          console.error(`Removing line with invalid JSON: ${line}`);
          purgedLines++;
          return false;
        }
      }
      // Remove lines that don't match the expected format
      purgedLines++;
      return false;
    });
    
    // Join the filtered lines back into a single string
    const updatedContent = filteredLines.join('\n');
    
    // Write the updated content back to the file
    await fs.writeFile(extraDataPath, updatedContent);
    
    const endTime = process.hrtime.bigint();
    const processingTime = Number(endTime - startTime);
    
    console.log(`Empty objects and invalid JSON removed from ${extraDataPath}`);

    const result = { 
      purgedLines, 
      processingTime,
      timeUnit: 'nanoseconds'
    };

    // Add milliseconds if it's an integer value
    const processingTimeMs = processingTime / 1e6;
    if (Number.isInteger(processingTimeMs)) {
      result.processingTimeMs = processingTimeMs;
    }

    // Add seconds if it's an integer value
    const processingTimeS = processingTime / 1e9;
    if (Number.isInteger(processingTimeS)) {
      result.processingTimeS = processingTimeS;
    }

    return result;
  } catch (error) {
    console.error(`Error weeding out empty objects and invalid JSON: ${error.message}`);
    throw error;
  }
}