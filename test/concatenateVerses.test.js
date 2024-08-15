import { jest } from '@jest/globals';
import { concatenateVerses } from '../lib/verseManipulation/concatenateVerses.mjs';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { v4 as uuidv4 } from 'uuid';

describe('concatenateVerses', () => {
  let tempDir;
  let tempFiles = [];

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'test-'));
  });

  afterEach(() => {
    tempFiles.forEach(file => fs.unlinkSync(file));
    fs.rmdirSync(tempDir);
    tempFiles = [];
  });

  function createTempFile(content) {
    const fileName = path.join(tempDir, `test-${uuidv4()}.txt`);
    fs.writeFileSync(fileName, content);
    tempFiles.push(fileName);
    return fileName;
  }

  test('should concatenate verses from multiple files', () => {
    const file1 = createTempFile('|1.| Verse 1 from file 1\n|2.| Verse 2 from file 1');
    const file2 = createTempFile('|1.| Verse 1 from file 2\n|2.| Verse 2 from file 2');

    const result = concatenateVerses([file1, file2]);

    const file1Name = path.basename(file1, '.txt');
    const file2Name = path.basename(file2, '.txt');

    const expectedResult = 
      '[1.]\n' +
      `[${file1Name}] Verse 1 from file 1\n` +
      `[${file2Name}] Verse 1 from file 2\n\n` +
      '[2.]\n' +
      `[${file1Name}] Verse 2 from file 1\n` +
      `[${file2Name}] Verse 2 from file 2`;

    expect(result).toBe(expectedResult);
  });

  test('should handle non-existent files', () => {
    const existingFile = createTempFile('|1.| Verse from existing file');
    const nonExistentFile = path.join(tempDir, 'nonexistent.txt');

    const consoleSpy = jest.spyOn(console, 'log');

    const result = concatenateVerses([nonExistentFile, existingFile]);

    expect(consoleSpy).toHaveBeenCalledWith(`File not found: ${nonExistentFile}`);
    expect(result).toBe('[1.] Verse from existing file');

    consoleSpy.mockRestore();
  });

  test('should handle files with different verse numbers', () => {
    const file1 = createTempFile('|1.| Verse 1 from file 1\n|3.| Verse 3 from file 1');
    const file2 = createTempFile('|2.| Verse 2 from file 2\n|4.| Verse 4 from file 2');

    const result = concatenateVerses([file1, file2]);

    const expectedResult = 
      '[1.] Verse 1 from file 1\n\n' +
      '[2.] Verse 2 from file 2\n\n' +
      '[3.] Verse 3 from file 1\n\n' +
      '[4.] Verse 4 from file 2';

    expect(result).toBe(expectedResult);
  });

  test('should handle separator verses', () => {
    const file1 = createTempFile('|1.| Verse 1\n|2.| ---\n|3.| Verse 3');
    const file2 = createTempFile('|1.| Another Verse 1\n|2.| ---\n|3.| Another Verse 3');

    const result = concatenateVerses([file1, file2]);

    const file1Name = path.basename(file1, '.txt');
    const file2Name = path.basename(file2, '.txt');

    const expectedResult = 
      '[1.]\n' +
      `[${file1Name}] Verse 1\n` +
      `[${file2Name}] Another Verse 1\n\n` +
      '[2.] ---\n\n' +
      '[3.]\n' +
      `[${file1Name}] Verse 3\n` +
      `[${file2Name}] Another Verse 3`;

    expect(result).toBe(expectedResult);
  });

  test('should consolidate identical verses', () => {
    const file1 = createTempFile('|1.| Identical verse');
    const file2 = createTempFile('|1.| Identical verse');

    const result = concatenateVerses([file1, file2]);

    expect(result).toBe('[1.] Identical verse');
  });
});