import { convertFromVerse } from '../lib/verseManipulation/convertFromVerse.mjs';

describe('convertFromVerse', () => {
  test('converts basic verse format to plain text', () => {
    const input = `|1.| This is verse 1.
|2.| This is verse 2.
|3.| This is verse 3.`;

    const expectedOutput = `This is verse 1. This is verse 2. This is verse 3.`;

    expect(convertFromVerse(input)).toBe(expectedOutput);
  });


  test('handles |--- separator lines', () => {
    const input = `|1.| Verse 1.
|2.|---
|3.| Verse 3.
|4.|---
|5.| Verse 5!`;

    const expectedOutput = `Verse 1.
Verse 3.
Verse 5!`;

    expect(convertFromVerse(input)).toBe(expectedOutput);
  });

  test('handles multiple consecutive |--- separator lines', () => {
    const input = `|1.| Verse 1.
|2.|---
|3.|---
|4.|---
|5.| Verse 4.
|6.|---
|7.| Verse 6.`;

    const expectedOutput = `Verse 1.


Verse 4.
Verse 6.`;

    expect(convertFromVerse(input)).toBe(expectedOutput);
  });

  test('trims leading and trailing whitespace', () => {
    const input = `
    |1.|    Verse 1.
    |2.| Verse 2.   
    `;

    const expectedOutput = `Verse 1. Verse 2.`;

    expect(convertFromVerse(input)).toBe(expectedOutput);
  });

});