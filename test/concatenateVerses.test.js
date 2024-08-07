import { concatenateVerseContents } from '../lib/verseManipulation/concatenateVerses.mjs';

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