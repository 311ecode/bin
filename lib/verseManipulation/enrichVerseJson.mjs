import fs from 'fs/promises';
import path from 'path';

/**
 * Enriches a given verse JSON structure with additional custom data.
 * @param {Array} baseJson - The base JSON structure to enrich.
 * @param {string} [extraDataPath=''] - Path to the file containing extra data (default is an empty string).
 * @returns {Promise<Array>} - Promise resolving to an array of enriched verse objects.
 */
export async function enrichVerseJson(baseJson, extraDataPath = '') {
  // If no extra data file is provided, return the base JSON
  if (!extraDataPath) {
    return baseJson;
  }

  try {
    // Read and parse the extra data file
    const extraDataContent = await fs.readFile(extraDataPath, 'utf8');
    const extraDataLines = extraDataContent.split('\n');

    // Get the name of the extra data file (without extension and path)
    const extraDataKind = path.basename(extraDataPath, path.extname(extraDataPath));

    // Parse extra data into a map
    const extraDataMap = new Map();
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

    // Enrich the base JSON with extra data
    return baseJson.map(verseObject => {
      const extraData = extraDataMap.get(verseObject.verse);
      if (extraData) {
        return {
          ...verseObject,
          extraData: {
            [extraDataKind]: extraData
          }
        };
      }
      return verseObject;
    });
  } catch (error) {
    console.error(`Error reading or processing extra data file: ${error.message}`);
    return baseJson;
  }
}