import { extractVerseRanges } from '../lib/range/parseRange.mjs';

describe('extractVerseRanges', () => {
  test('extracts correct verses based on given ranges', () => {
    // Sample input
    const content = `
|1.| This is verse 1
|2.| This is verse 2
|3.| This is verse 3
|4.| This is verse 4
|5.| This is verse 5
`;

    const ranges = [
      { start: 2, end: 4 },
      { start: 1, end: 1 },
      { start: 5, end: 5 }
    ];

    // Expected output
    const expectedOutput = {
      1: '|1.| This is verse 1',
      2: '|2.| This is verse 2',
      3: '|3.| This is verse 3',
      4: '|4.| This is verse 4',
      5: '|5.| This is verse 5'
    };

    // Run the function
    const result = extractVerseRanges(content, ranges);

    // Assert the result
    expect(result).toEqual(expectedOutput);
  });

  test('handles empty content', () => {
    const content = '';
    const ranges = [{ start: 1, end: 5 }];

    const result = extractVerseRanges(content, ranges);

    expect(result).toEqual({});
  });

  test('handles ranges outside of content', () => {
    const content = '|1.| Only one verse';
    const ranges = [{ start: 2, end: 5 }];

    const result = extractVerseRanges(content, ranges);

    expect(result).toEqual({});
  });
});