// File: jest/convertToVerse.test.js

import { convertFromVerse } from '../lib/verseManipulation/convertFromVerse.mjs';
import { convertToVerse } from '../lib/verseManipulation/convertToVerse.mjs';

describe('convertToVerse', () => {
  test('xxx handles multiple paragraphs with empty lines', () => {
    const input = `hello




word. New sentence, new line.
ahh and before we had a line break. and 

now two we had.




and here more. amore.
`;
  
    const expectedOutput = 
`|1.| hello
|2.| ---
|3.| ---
|4.| ---
|5.| ---
|6.| word.
|7.| New sentence, new line.
|8.| ---
|9.| ahh and before we had a line break.
|10.| and
|11.| ---
|12.| now two we had.
|13.| ---
|14.| ---
|15.| ---
|16.| ---
|17.| ---
|18.| and here more.
|19.| amore.
|20.| ---`;

    expect(convertToVerse(input)).toBe(expectedOutput);
  });

//   test('xcx convertFromVerse reverses convertToVerse', () => {
//     const originalText = `hello
  
// word.
// New sentence, new line.
// ahh and before we had a line break. and 

// now two we had.




// and here more.
// amore.
// `;
  
//     const versed = convertToVerse(originalText);
//     const reversed = convertFromVerse(versed);
  
//     console.log(
//       `originalText: ${originalText}\n\n\n---` +
//       `versed: ${versed}\n\n\n---` +
//       `reversed: ${reversed}---`
//     );
  
//     expect(reversed).toBe(originalText);
//   });

  // test('splits sentences within a single paragraph', () => {
  //   const input = "This is a sentence. Another sentence! A question?";
  //   const expected = "|1.| This is a sentence.\n|2.| Another sentence!\n|3.| A question?";
  //   expect(convertToVerse(input)).toBe(expected);
  // });

  // test('maintains formatting of already formatted verses', () => {
  //   const input = "|1.| Already formatted verse.";
  //   const expected = "|1.| Already formatted verse.";
  //   expect(convertToVerse(input)).toBe(expected);
  // });

  // test('handles mixed formatting', () => {
  //   const input = "Mixed format.\n|2.| Pre-formatted verse.\nNormal text.";
  //   const expected = "|1.| Mixed format.\n|2.| Pre-formatted verse.\n|3.| Normal text.";
  //   expect(convertToVerse(input)).toBe(expected);
  // });

  // test('preserves multiple consecutive empty lines', () => {
  //   const input = "Paragraph 1.\n\n\nParagraph 2.";
  //   const expected = "|1.| Paragraph 1.\n|2.|---\n|3.|---\n|4.| Paragraph 2.";
  //   expect(convertToVerse(input)).toBe(expected);
  // });

  // test('handles sentences with multiple punctuation marks', () => {
  //   const input = "Hello... This is a test!!! What???";
  //   const expected = "|1.| Hello...\n|2.| This is a test!!!\n|3.| What???";
  //   expect(convertToVerse(input)).toBe(expected);
  // });

  // test('option to keep paragraphs as single verses', () => {
  //   const input = "This is a paragraph. With multiple sentences! And a question?";
  //   const expected = "|1.| This is a paragraph. With multiple sentences! And a question?";
  //   expect(convertToVerse(input, false)).toBe(expected);
  // });
});