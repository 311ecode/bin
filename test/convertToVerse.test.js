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

  test('Avoiding a kind of problem with sentence closings.', () => {
    const input = `
óvták attól, hogy „az európai hullával” ölelkezzék... Hitük van, küldetésérzetük, ex-oriente-lux[15]-meggyőződésük?...  
and this !...
ehh..
neeh...
really?.
really?..
really?...
really!.
really!.. 
really!...
`;
  
    const expectedOutput = 
`|1.| ---
|2.| óvták attól, hogy „az európai hullával” ölelkezzék...
|3.| Hitük van, küldetésérzetük, ex-oriente-lux[15]-meggyőződésük?...
|4.| ---
|5.| and this!...
|6.| ---
|7.| ehh..
|8.| ---
|9.| neeh...
|10.| ---
|11.| really?.
|12.| ---
|13.| really?..
|14.| ---
|15.| really?...
|16.| ---
|17.| really!.
|18.| ---
|19.| really!..
|20.| ---
|21.| really!...
|22.| ---`;
    // console.log(convertToVerse(input));
    
    expect(convertToVerse(input)).toBe(expectedOutput);
    
  })
});