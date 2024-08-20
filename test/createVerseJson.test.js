import { jest } from '@jest/globals';
import path from 'path';
import os from 'os';
import fs from 'fs/promises';
import { createVerseJson } from '../lib/verseManipulation/concatenateVerses.mjs';

describe('createVerseJson', () => {
  let tempDir;
  let testFile1Path;
  let testFile2Path;

  beforeAll(async () => {
    // Create a temporary directory
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'test-'));

    // Create test files
    testFile1Path = path.join(tempDir, 'test_file1.txt');
    testFile2Path = path.join(tempDir, 'test_file2.txt');

    await fs.writeFile(testFile1Path, 
      '|1.| Verse 1 from file 1\n|2.| Verse 2 from file 1\n|3.| Verse 3 from file 1');
    await fs.writeFile(testFile2Path, 
      '|1.| Verse 1 from file 2\n|2.| Verse 2 from file 2\n|4.| Verse 4 from file 2');
  });

  afterAll(async () => {
    // Clean up: remove the temporary directory and its contents
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  test('should create correct JSON structure from multiple files', async () => {
    const result = createVerseJson([testFile1Path, testFile2Path]);

    expect(result).toEqual([
      {
        verse: 1,
        original: "Verse 1 from file 1",
        translations: {
          test_file1: "Verse 1 from file 1",
          test_file2: "Verse 1 from file 2"
        }
      },
      {
        verse: 2,
        original: "Verse 2 from file 1",
        translations: {
          test_file1: "Verse 2 from file 1",
          test_file2: "Verse 2 from file 2"
        }
      },
      {
        verse: 3,
        original: "Verse 3 from file 1",
        translations: {
          test_file1: "Verse 3 from file 1"
        }
      },
      {
        verse: 4,
        original: "Verse 4 from file 2",
        translations: {
          test_file2: "Verse 4 from file 2"
        }
      }
    ]);
  });

  test('should handle non-existent files', async () => {
    const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();

    const nonExistentPath = path.join(tempDir, 'nonexistent.txt');
    const result = createVerseJson([nonExistentPath]);

    expect(result).toEqual([]);
    expect(consoleLogSpy).toHaveBeenCalledWith(`File not found: ${nonExistentPath}`);

    consoleLogSpy.mockRestore();
  });
});