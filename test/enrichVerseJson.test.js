import { jest } from '@jest/globals';
import path from 'path';
import os from 'os';
import fs from 'fs/promises';
import { enrichVerseJson } from '../lib/verseManipulation/enrichVerseJson.mjs';
import { createVerseJson } from '../lib/verseManipulation/concatenateVerses.mjs';

describe('enrichVerseJson', () => {
  let tempDir;
  let testFile1Path;
  let testFile2Path;
  let extraDataPath;
  let baseJson;

  beforeAll(async () => {
    // Create a temporary directory
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'test-'));

    // Create test files
    testFile1Path = path.join(tempDir, 'test_file1.txt');
    testFile2Path = path.join(tempDir, 'test_file2.txt');
    extraDataPath = path.join(tempDir, 'extra_data.json');

    await fs.writeFile(testFile1Path, 
      '|1.| Verse 1 from file 1\n|2.| Verse 2 from file 1\n|3.| Verse 3 from file 1');
    await fs.writeFile(testFile2Path, 
      '|1.| Verse 1 from file 2\n|2.| Verse 2 from file 2\n|4.| Verse 4 from file 2');
    await fs.writeFile(extraDataPath,
      '|1.| {"note": "Extra data for verse 1"}\n|2.| {"note": "Extra data for verse 2"}\n|3.| {"note": "Extra data for verse 3"}\n|4.| {"note": "Extra data for verse 4"}');

    // Create base JSON
    baseJson = createVerseJson([testFile1Path, testFile2Path]);
  });

  afterAll(async () => {
    // Clean up: remove the temporary directory and its contents
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  test('should enrich JSON structure with extra data', async () => {
    const result = await enrichVerseJson(baseJson, extraDataPath);

    expect(result).toEqual([
      {
        verse: 1,
        original: "Verse 1 from file 1",
        translations: {
          test_file1: "Verse 1 from file 1",
          test_file2: "Verse 1 from file 2"
        },
        extraData: {
          extra_data: { note: "Extra data for verse 1" }
        }
      },
      {
        verse: 2,
        original: "Verse 2 from file 1",
        translations: {
          test_file1: "Verse 2 from file 1",
          test_file2: "Verse 2 from file 2"
        },
        extraData: {
          extra_data: { note: "Extra data for verse 2" }
        }
      },
      {
        verse: 3,
        original: "Verse 3 from file 1",
        translations: {
          test_file1: "Verse 3 from file 1"
        },
        extraData: {
          extra_data: { note: "Extra data for verse 3" }
        }
      },
      {
        verse: 4,
        original: "Verse 4 from file 2",
        translations: {
          test_file2: "Verse 4 from file 2"
        },
        extraData: {
          extra_data: { note: "Extra data for verse 4" }
        }
      }
    ]);
  });

  test('should return base JSON when no extra data file is provided', async () => {
    const result = await enrichVerseJson(baseJson);

    expect(result).toEqual(baseJson);
  });

  test('should handle extra data file with fewer lines than verses', async () => {
    const shortExtraDataPath = path.join(tempDir, 'short_extra_data.json');
    await fs.writeFile(shortExtraDataPath, '|1.| {"note": "Extra data for verse 1"}\n|2.| {"note": "Extra data for verse 2"}');

    const result = await enrichVerseJson(baseJson, shortExtraDataPath);

    expect(result[0].extraData).toBeDefined();
    expect(result[1].extraData).toBeDefined();
    expect(result[2].extraData).toBeUndefined();
    expect(result[3].extraData).toBeUndefined();
  });

  test('should handle invalid JSON in extra data file', async () => {
    const invalidExtraDataPath = path.join(tempDir, 'invalid_extra_data.json');
    await fs.writeFile(invalidExtraDataPath, '|1.| {"note": "Valid JSON"}\n|2.| Invalid JSON\n|3.| {"note": "Valid JSON again"}');

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    const result = await enrichVerseJson(baseJson, invalidExtraDataPath);

    expect(result[0].extraData).toBeDefined();
    expect(result[1].extraData).toBeUndefined();
    expect(result[2].extraData).toBeDefined();
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Error parsing extra data for verse 2'));

    consoleSpy.mockRestore();
  });

  test('should handle non-existent extra data file', async () => {
    const nonExistentPath = path.join(tempDir, 'nonexistent.json');
    
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    const result = await enrichVerseJson(baseJson, nonExistentPath);

    expect(result).toEqual(baseJson);
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Error reading or processing extra data file'));

    consoleSpy.mockRestore();
  });

  test('should handle extra data with non-sequential verse numbers', async () => {
    const nonSequentialExtraDataPath = path.join(tempDir, 'non_sequential_extra_data.json');
    await fs.writeFile(nonSequentialExtraDataPath, 
      '|1.| {"note": "Extra data for verse 1"}\n|3.| {"note": "Extra data for verse 3"}\n|5.| {"note": "Extra data for verse 5"}');

    const result = await enrichVerseJson(baseJson, nonSequentialExtraDataPath);

    expect(result[0].extraData).toBeDefined();
    expect(result[1].extraData).toBeUndefined();
    expect(result[2].extraData).toBeDefined();
    expect(result[3].extraData).toBeUndefined();
  });
});