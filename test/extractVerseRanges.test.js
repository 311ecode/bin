
import assert from 'assert';
import { extractVerseRanges } from '../lib/range/parseRange.mjs';

describe('extractVerseRanges', () => {
  it('should correctly extract verse ranges', () => {
    const sampleContent = `
|1.| This is verse 1.
|2.| This is verse 2.
|3.| This is verse 3.
|4.| This is verse 4.
|5.| This is verse 5.
`;

    const ranges = [
      { start: 2, end: 3 },
      { start: 5, end: 5 }
    ];

    const expected = {
      2: '|2.| This is verse 2.',
      3: '|3.| This is verse 3.',
      5: '|5.| This is verse 5.'
    };

    const result = extractVerseRanges(sampleContent, ranges);

    assert.deepStrictEqual(result, expected);
  });

  it('should handle non-existent verses', () => {
    const sampleContent = `
|1.| This is verse 1.
|2.| This is verse 2.
`;

    const ranges = [
      { start: 2, end: 4 }
    ];

    const expected = {
      2: '|2.| This is verse 2.'
    };

    const result = extractVerseRanges(sampleContent, ranges);

    assert.deepStrictEqual(result, expected);
    
  });
});