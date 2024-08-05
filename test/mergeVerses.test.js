import { mergeVerses } from '../lib/range/processRanges.mjs';

// import { describe, test, expect  } from 'jest';

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


describe('mergeVerses2', () => {
  const existingContent = `|1.| Existing verse 1
|2.| Existing verse 2
|3.| Existing verse 3`;

  const newVerses = {
    2: '|2.| New verse 2',
    4: '|4.| New verse 4'
  };

  it('should overwrite existing verses by default', () => {
    const result = mergeVerses(existingContent, newVerses);
    expect(result).toContain('|2.| New verse 2');
  });

  it('should keep existing verses when overwrite is false', () => {
    const result = mergeVerses(existingContent, newVerses, { overwrite: false });
    console.log('Result when overwrite is false:', result);
    expect(result).toContain('|2.| Existing verse 2');
  });

  it('should append new verses by default', () => {
    const result = mergeVerses(existingContent, newVerses);
    expect(result).toContain('|4.| New verse 4');
  });

  it('should not append new verses when appendNewVerses is false', () => {
    const result = mergeVerses(existingContent, newVerses, { appendNewVerses: false });
    expect(result).not.toContain('|4.| New verse 4');
  });

  it('should use append merge strategy correctly', () => {
    const result = mergeVerses(existingContent, newVerses, { mergeStrategy: 'append', delimiter: '||' });
    expect(result).toContain('|2.| Existing verse 2||New verse 2');
  });

  it('should use prepend merge strategy correctly', () => {
    const result = mergeVerses(existingContent, newVerses, { mergeStrategy: 'prepend', delimiter: '||' });
    expect(result).toContain('|2.| New verse 2||Existing verse 2');
  });

  it('should mark conflicts correctly', () => {
    const result = mergeVerses(existingContent, newVerses, { mergeStrategy: 'markConflict', conflictMarker: '<<<CONFLICT>>>' });
    expect(result).toContain('<<<CONFLICT>>>');
  });

  it('should show diff when marking conflicts if showDiff is true', () => {
    const result = mergeVerses(existingContent, newVerses, { mergeStrategy: 'markConflict', showDiff: true });
    expect(result).toContain('<del>');
    expect(result).toContain('<ins>');
  });

  it('should not show diff when marking conflicts if showDiff is false', () => {
    const result = mergeVerses(existingContent, newVerses, { mergeStrategy: 'markConflict', showDiff: false });
    expect(result).not.toContain('<del>');
    expect(result).not.toContain('<ins>');
  });

  it('should handle empty existing content correctly', () => {
    const result = mergeVerses('', newVerses);
    expect(result).toBe('|2.| New verse 2\n|4.| New verse 4');
  });

  it('should handle empty new verses correctly', () => {
    const result = mergeVerses(existingContent, {});
    expect(result).toBe(existingContent);
  });

  it('should maintain verse order', () => {
    const unorderedNewVerses = {
      4: '|4.| New verse 4',
      2: '|2.| New verse 2'
    };
    const result = mergeVerses(existingContent, unorderedNewVerses);
    const lines = result.split('\n');
    expect(lines[0]).toContain('|1.|');
    expect(lines[1]).toContain('|2.|');
    expect(lines[2]).toContain('|3.|');
    expect(lines[3]).toContain('|4.|');
  });
});