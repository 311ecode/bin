import { jest } from '@jest/globals';
import path from 'path';
import os from 'os';
import fs from 'fs/promises';
import { addDataToExtradata } from '../lib/verseManipulation/addDataToExtradata.mjs';

describe('addDataToExtradata', () => {
  let tempDir;
  let extraDataPath;

  beforeAll(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'test-'));
    extraDataPath = path.join(tempDir, 'extra_data.json');
  });

  afterAll(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  beforeEach(async () => {
    try {
      await fs.unlink(extraDataPath);
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }
  });

  test('should add new data to an empty file', async () => {
    const newData = {
      1: { note: "Note for verse 1" },
      2: { comment: "Comment for verse 2" }
    };

    await addDataToExtradata(extraDataPath, newData);

    const content = await fs.readFile(extraDataPath, 'utf8');
    const lines = content.split('\n');
    expect(lines).toHaveLength(2);
    expect(lines[0]).toBe('|1.| {"note":"Note for verse 1"}');
    expect(lines[1]).toBe('|2.| {"comment":"Comment for verse 2"}');
  });

  test('should update existing data and add new data', async () => {
    // Initial data
    await fs.writeFile(extraDataPath, '|1.| {"note":"Initial note"}\n|3.| {"comment":"Initial comment"}');

    const newData = {
      1: { note: "Updated note" },
      2: { newData: "New verse data" },
      3: { additionalInfo: "More info" }
    };

    await addDataToExtradata(extraDataPath, newData);

    const content = await fs.readFile(extraDataPath, 'utf8');
    const lines = content.split('\n');
    expect(lines).toHaveLength(3);
    expect(lines[0]).toBe('|1.| {"note":"Updated note"}');
    expect(lines[1]).toBe('|2.| {"newData":"New verse data"}');
    expect(lines[2]).toBe('|3.| {"comment":"Initial comment","additionalInfo":"More info"}');
  });

  test('should handle non-existent file', async () => {
    const newData = {
      5: { note: "Note for verse 5" }
    };

    await addDataToExtradata(extraDataPath, newData);

    const content = await fs.readFile(extraDataPath, 'utf8');
    expect(content).toBe('|5.| {"note":"Note for verse 5"}');
  });

  test('should maintain correct order of verses', async () => {
    const newData = {
      3: { third: "Third verse" },
      1: { first: "First verse" },
      2: { second: "Second verse" }
    };

    await addDataToExtradata(extraDataPath, newData);

    const content = await fs.readFile(extraDataPath, 'utf8');
    const lines = content.split('\n');
    expect(lines).toHaveLength(3);
    expect(lines[0]).toBe('|1.| {"first":"First verse"}');
    expect(lines[1]).toBe('|2.| {"second":"Second verse"}');
    expect(lines[2]).toBe('|3.| {"third":"Third verse"}');
  });

  test('should handle invalid JSON in existing file', async () => {
    // Write invalid JSON to the file
    await fs.writeFile(extraDataPath, '|1.| {"valid": "JSON"}\n|2.| {invalid JSON}\n|3.| {"also": "valid"}');

    const newData = {
      2: { fixed: "Fixed JSON" },
      4: { new: "New entry" }
    };

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    await addDataToExtradata(extraDataPath, newData);

    const content = await fs.readFile(extraDataPath, 'utf8');
    const lines = content.split('\n');
    expect(lines).toHaveLength(4);
    expect(lines[0]).toBe('|1.| {"valid":"JSON"}');
    expect(lines[1]).toBe('|2.| {"fixed":"Fixed JSON"}');
    expect(lines[2]).toBe('|3.| {"also":"valid"}');
    expect(lines[3]).toBe('|4.| {"new":"New entry"}');

    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Error parsing extra data for verse 2'));

    consoleSpy.mockRestore();
  });

  test('should merge new data with existing data for the same verse', async () => {
    // Initial data
    await fs.writeFile(extraDataPath, '|1.| {"first":"First verse"}');

    const newData = {
      1: { another: "data" }
    };

    await addDataToExtradata(extraDataPath, newData);

    const content = await fs.readFile(extraDataPath, 'utf8');
    const lines = content.split('\n');
    expect(lines).toHaveLength(1);
    expect(JSON.parse(lines[0].split('|')[2])).toEqual({
      first: "First verse",
      another: "data"
    });
  });

  test('should update existing properties and add new ones', async () => {
    // Initial data
    await fs.writeFile(extraDataPath, '|1.| {"first":"First verse","second":"Second verse"}');

    const newData = {
      1: { first: "First modified", third: "Third verse" }
    };

    await addDataToExtradata(extraDataPath, newData);

    const content = await fs.readFile(extraDataPath, 'utf8');
    const lines = content.split('\n');
    expect(lines).toHaveLength(1);
    expect(JSON.parse(lines[0].split('|')[2])).toEqual({
      first: "First modified",
      second: "Second verse",
      third: "Third verse"
    });
  });

  test('should handle multiple verses with mixed updates and additions', async () => {
    // Initial data
    await fs.writeFile(extraDataPath, 
      '|1.| {"first":"First verse"}\n|2.| {"second":"Second verse"}');

    const newData = {
      1: { another: "data for first" },
      2: { second: "Updated second verse", new: "New data for second" },
      3: { third: "Completely new verse" }
    };

    await addDataToExtradata(extraDataPath, newData);

    const content = await fs.readFile(extraDataPath, 'utf8');
    const lines = content.split('\n');
    expect(lines).toHaveLength(3);
    expect(JSON.parse(lines[0].split('|')[2])).toEqual({
      first: "First verse",
      another: "data for first"
    });
    expect(JSON.parse(lines[1].split('|')[2])).toEqual({
      second: "Updated second verse",
      new: "New data for second"
    });
    expect(JSON.parse(lines[2].split('|')[2])).toEqual({
      third: "Completely new verse"
    });
  });

  test('should not remove existing data when adding new properties', async () => {
    // Initial data
    await fs.writeFile(extraDataPath, 
      '|1.| {"existing":"Should not be removed","alsoExisting":"This should stay too"}');

    const newData = {
      1: { new: "New property" }
    };

    await addDataToExtradata(extraDataPath, newData);

    const content = await fs.readFile(extraDataPath, 'utf8');
    const lines = content.split('\n');
    expect(lines).toHaveLength(1);
    expect(JSON.parse(lines[0].split('|')[2])).toEqual({
      existing: "Should not be removed",
      alsoExisting: "This should stay too",
      new: "New property"
    });
  });

});