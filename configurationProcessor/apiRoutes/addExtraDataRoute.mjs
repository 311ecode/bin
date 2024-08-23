import express, { Router } from 'express';
import { addDataToExtradata } from '../../lib/verseManipulation/addDataToExtradata.mjs';
import path from 'path';
import { getConfigDetails } from '../getConfigDetails.mjs';
import fs from 'fs/promises';

/**
 * Add Extra Data Route
 * 
 * This route allows adding extra data to a specific verse within an execution group.
 * 
 * @route POST /addExtraDataToVerse
 * 
 * @param {string[]} executionGroups - Array of valid execution group names.
 * @param {string} configPath - Path to the configuration file.
 * 
 * @bodyParam {string} executionGroup - The name of the execution group.
 * @bodyParam {number} verseNumber - The number of the verse to add extra data to.
 * @bodyParam {Object} extraData - The extra data to add to the verse.
 * 
 * @returns {Router} The extra data for the specified verse, including any previously existing data.
 * 
 * @throws {400} If executionGroup, verseNumber, or extraData is missing or invalid.
 * @throws {404} If the specified execution group doesn't exist or the updated verse is not found.
 * @throws {500} If there's an error parsing the extra data JSON or any other server error.
 * 
 * @example
 * // Request
 * POST /addExtraDataToVerse
 * Content-Type: application/json
 * 
 * {
 *   "executionGroup": "group1",
 *   "verseNumber": 1,
 *   "extraData": {
 *     "customKey": "customValue",
 *     "anotherKey": "anotherValue"
 *   }
 * }
 * 
 * // Success Response
 * HTTP/1.1 200 OK
 * Content-Type: application/json
 * 
 * {
 *   "customKey": "customValue",
 *   "anotherKey": "anotherValue"
 * }
 * 
 * // Error Response
 * HTTP/1.1 400 Bad Request
 * Content-Type: application/json
 * 
 * {
 *   "error": "Missing executionGroup"
 * }
 * 
 * @description
 * This route handler adds extra data to a specific verse within an execution group.
 * It performs the following steps:
 * 1. Validates the input (executionGroup, verseNumber, and extraData).
 * 2. Checks if the execution group exists.
 * 3. Retrieves the configuration details for the execution group.
 * 4. Constructs the path for the extra data file.
 * 5. Adds the new extra data to the file using the addDataToExtradata function.
 * 6. Reads back the updated data for the specific verse.
 * 7. Parses the updated data and returns it as a JSON response.
 * 
 * The route uses several helper functions and modules:
 * - addDataToExtradata: To add the new data to the existing extra data file.
 * - getConfigDetails: To retrieve configuration details for the execution group.
 * - fs.promises: For file system operations.
 * 
 * Error handling is implemented for various scenarios, including missing parameters,
 * invalid execution groups, and JSON parsing errors.
 * 
 * Note: The response contains only the extra data for the specified verse. It does not
 * include the executionGroup or verseNumber in the response body. If there was existing
 * extra data for the verse, it will be merged with the new data in the response.
 */
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