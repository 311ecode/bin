import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import { ensureUniqueVerses } from '../translation/processTranslation.mjs'; // Adjust the path as needed

let testFilePath;

const initialContent = `|1.| This is verse one.
|2.| This is verse two.
|3.| This is verse three.
|2.| This is an updated verse two.
|4.| This is verse four.
|3.| This is also an updated verse three.`;

beforeAll(async () => {
  // Create a temporary file
  const tempDir = os.tmpdir();
  const tempFileName = `test-verses-${Date.now()}.txt`;
  testFilePath = path.join(tempDir, tempFileName);
  
  // Create the test file with initial content
  await fs.writeFile(testFilePath, initialContent);
});

afterAll(async () => {
  try {
    await fs.unlink(testFilePath);
  } catch (error) {
    console.error(`Error deleting temporary file: ${error.message}`);
  }
});

describe('ensureUniqueVerses', () => {
  it('should remove duplicates and keep the latest version of each verse', async () => {
    await ensureUniqueVerses(testFilePath, { keepLatest: true });

    const resultContent = await fs.readFile(testFilePath, 'utf8');
    const resultLines = resultContent.split('\n');

    expect(resultLines).toHaveLength(4); // Should have 4 unique verses
    expect(resultLines[0]).toBe('|1.| This is verse one.');
    expect(resultLines[1]).toBe('|2.| This is an updated verse two.');
    expect(resultLines[2]).toBe('|3.| This is also an updated verse three.');
    expect(resultLines[3]).toBe('|4.| This is verse four.');
  });

  it('should remove duplicates and keep the earliest version of each verse when keepLatest is false', async () => {
    // Reset the file content
    await fs.writeFile(testFilePath, initialContent);
  
    await ensureUniqueVerses(testFilePath, { keepLatest: false });
  
    const resultContent = await fs.readFile(testFilePath, 'utf8');
    const resultLines = resultContent.split('\n');
  
    expect(resultLines).toHaveLength(4); // Should have 4 unique verses
    expect(resultLines[0]).toBe('|1.| This is verse one.');
    expect(resultLines[1]).toBe('|2.| This is an updated verse two.');
    expect(resultLines[2]).toBe('|3.| This is also an updated verse three.');
    expect(resultLines[3]).toBe('|4.| This is verse four.');
  });

});