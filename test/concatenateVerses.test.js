import { jest } from '@jest/globals';
import { concatenateVerseContents, concatenateVerses, createVerseJson, createVerseJsonStructure } from '../lib/verseManipulation/concatenateVerses.mjs';
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

describe('concatenateVerseContents', () => {
  test('abcd concatenates verses from multiple file contents', () => {
    const fileContents = [
      {
        name: 'file1',
        content: '|1.| This is the first sentence.\n|2.| This is the second sentence.\n|3.|---\n'
      },
      {
        name: 'file2',
        content: '|1.| This is another first sentence.\n|2.| This is the same second sentence.\n|3.|---\n'
      }
    ];
  
    const result = concatenateVerseContents(fileContents);
  
    expect(result).toBe(
      '[1.]\n' +
      '[file1] This is the first sentence.\n' +
      '[file2] This is another first sentence.\n' +
      '\n' +
      '[2.]\n' +
      '[file1] This is the second sentence.\n' +
      '[file2] This is the same second sentence.\n' +
      '\n' +
      '[3.] ---'
    );
  });

  test('efgh handles identical sentences across versions', () => {
    const fileContents = [
      {
        name: 'file1',
        content: '|1.| Identical sentence.\n'
      },
      {
        name: 'file2',
        content: '|1.| Identical sentence.\n'
      },
      {
        name: 'file3',
        content: '|1.| Identical sentence.\n'
      }
    ];
  
    const result = concatenateVerseContents(fileContents);
    
    expect(result).toBe('[1.] Identical sentence.');
  });

  test('ijkl handles missing verses in some files', () => {
    const fileContents = [
      {
        name: 'file1',
        content: '|1.| First sentence.\n|2.| Second sentence.\n'
      },
      {
        name: 'file2',
        content: '|1.| Another first sentence.\n|3.| Third sentence.\n'
      }
    ];
  
    const result = concatenateVerseContents(fileContents);
  
    expect(result).toBe(
      '[1.]\n[file1] First sentence.\n[file2] Another first sentence.\n\n' +
      '[2.] Second sentence.\n\n' +
      '[3.] Third sentence.'
    );
  });

  test('mnop handles separator verses', () => {
    const fileContents = [
      {
        name: 'file1',
        content: '|1.| First sentence.\n|2.|---\n|3.| Third sentence.\n'
      },
      {
        name: 'file2',
        content: '|1.| Another first sentence.\n|2.|---\n|3.| Another third sentence.\n'
      }
    ];
  
    const result = concatenateVerseContents(fileContents);
  
    expect(result).toBe(
      '[1.]\n[file1] First sentence.\n[file2] Another first sentence.\n\n' +
      '[2.] ---\n\n' +
      '[3.]\n[file1] Third sentence.\n[file2] Another third sentence.'
    );
  });
});

describe('createVerseJsonStructure', () => {
  test('should create correct JSON structure from file contents', () => {
    const fileContents = [
      {
        name: 'original',
        content: '|1.| In the beginning God created the heavens and the earth.\n|2.| ---\n|3.| Now the earth was formless and empty, darkness was over the surface of the deep, and the Spirit of God was hovering over the waters.'
      },
      {
        name: 'NIV',
        content: '|1.| In the beginning God created the heavens and the earth.\n|2.| ---\n|3.| Now the earth was formless and empty, darkness was over the surface of the deep, and the Spirit of God was hovering over the waters.'
      },
      {
        name: 'KJV',
        content: '|1.| In the beginning God created the heaven and the earth.\n|2.| ---\n|3.| And the earth was without form, and void; and darkness was upon the face of the deep. And the Spirit of God moved upon the face of the waters.'
      }
    ];

    const result = createVerseJsonStructure(fileContents);

    expect(result).toEqual([
      {
        verse: 1,
        original: "In the beginning God created the heavens and the earth.",
        translations: {
          original: "In the beginning God created the heavens and the earth.",
          NIV: "In the beginning God created the heavens and the earth.",
          KJV: "In the beginning God created the heaven and the earth."
        }
      },
      {
        verse: 2,
        original: "---",
        translations: {
          original: "---",
          NIV: "---",
          KJV: "---"
        }
      },
      {
        verse: 3,
        original: "Now the earth was formless and empty, darkness was over the surface of the deep, and the Spirit of God was hovering over the waters.",
        translations: {
          original: "Now the earth was formless and empty, darkness was over the surface of the deep, and the Spirit of God was hovering over the waters.",
          NIV: "Now the earth was formless and empty, darkness was over the surface of the deep, and the Spirit of God was hovering over the waters.",
          KJV: "And the earth was without form, and void; and darkness was upon the face of the deep. And the Spirit of God moved upon the face of the waters."
        }
      }
    ]);
  });

  test('should handle missing verses in some translations', () => {
    const fileContents = [
      {
        name: 'original',
        content: '|1.| First verse.\n|2.| Second verse.\n|3.| Third verse.'
      },
      {
        name: 'translation1',
        content: '|1.| First verse translated.\n|3.| Third verse translated.'
      }
    ];

    const result = createVerseJsonStructure(fileContents);

    expect(result).toEqual([
      {
        verse: 1,
        original: "First verse.",
        translations: {
          original: "First verse.",
          translation1: "First verse translated."
        }
      },
      {
        verse: 2,
        original: "Second verse.",
        translations: {
          original: "Second verse."
        }
      },
      {
        verse: 3,
        original: "Third verse.",
        translations: {
          original: "Third verse.",
          translation1: "Third verse translated."
        }
      }
    ]);
  });
});

describe('createVerseJson', () => {
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

  test('should create correct JSON structure from files', () => {
    const file1 = createTempFile('|1.| Original verse 1.\n|2.| Original verse 2.');
    const file2 = createTempFile('|1.| Translated verse 1.\n|2.| Translated verse 2.');

    const result = createVerseJson([file1, file2]);

    const file1Name = path.basename(file1, '.txt');
    const file2Name = path.basename(file2, '.txt');

    expect(result).toEqual([
      {
        verse: 1,
        original: "Original verse 1.",
        translations: {
          [file1Name]: "Original verse 1.",
          [file2Name]: "Translated verse 1."
        }
      },
      {
        verse: 2,
        original: "Original verse 2.",
        translations: {
          [file1Name]: "Original verse 2.",
          [file2Name]: "Translated verse 2."
        }
      }
    ]);
  });

  test('should handle non-existent files', () => {
    const existingFile = createTempFile('|1.| Verse from existing file');
    const nonExistentFile = path.join(tempDir, 'nonexistent.txt');

    const consoleSpy = jest.spyOn(console, 'log');

    const result = createVerseJson([nonExistentFile, existingFile]);

    expect(consoleSpy).toHaveBeenCalledWith(`File not found: ${nonExistentFile}`);
    expect(result).toEqual([
      {
        verse: 1,
        original: "Verse from existing file",
        translations: {
          [path.basename(existingFile, '.txt')]: "Verse from existing file"
        }
      }
    ]);

    consoleSpy.mockRestore();
  });
});