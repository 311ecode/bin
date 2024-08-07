import { mergeVerses } from '../lib/range/processRanges.mjs';

describe('mergeVerses', () => {
  test('merges new verses into existing content', () => {
    const existingContent = 
      "|1.| This is verse one.\n" +
      "|3.| This is verse three.\n" +
      "|5.| This is verse five.";
    
    const newVerses = {
      2: "|2.| This is a new verse two.",
      3: "|3.| This is an updated verse three.",
      4: "|4.| This is a new verse four."
    };

    const expected = 
      "|1.| This is verse one.\n" +
      "|2.| This is a new verse two.\n" +
      "|3.| This is an updated verse three.\n" +
      "|4.| This is a new verse four.\n" +
      "|5.| This is verse five.";

    const result = mergeVerses(existingContent, newVerses);
    expect(result).toBe(expected);
  });

  test('handles empty existing content', () => {
    const existingContent = "";
    
    const newVerses = {
      1: "|1.| This is verse one.",
      2: "|2.| This is verse two."
    };

    const expected = 
      "|1.| This is verse one.\n" +
      "|2.| This is verse two.";

    const result = mergeVerses(existingContent, newVerses);
    expect(result).toBe(expected);
  });

  test('handles empty new verses', () => {
    const existingContent = 
      "|1.| This is verse one.\n" +
      "|2.| This is verse two.";
    
    const newVerses = {};

    const expected = existingContent;

    const result = mergeVerses(existingContent, newVerses);
    expect(result).toBe(expected);
  });
});