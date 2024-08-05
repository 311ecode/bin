// diffUtils.test.mjs
import { applyDiff } from '../lib/range/processRanges.mjs';

describe('applyDiff', () => {
  test('diffWords: should correctly diff two similar sentences', () => {
    const oldStr = "The quick brown fox jumps over the lazy dog";
    const newStr = "The quick brown cat jumps over the lazy dog";
    const expected = "The quick brown <del>fox</del><ins>cat</ins> jumps over the lazy dog";
    expect(applyDiff(oldStr, newStr, 'diffWords')).toBe(expected);
  });

  test('diffWords: should handle additions', () => {
    const oldStr = "A B C";
    const newStr = "A B C D";
    const expected = "A B C<ins> D</ins>";
    expect(applyDiff(oldStr, newStr, 'diffWords')).toBe(expected);
  });

  test('diffWords: should handle deletions', () => {
    const oldStr = "A B C D";
    const newStr = "A B D";
    const expected = "A B <del>C </del>D";
    expect(applyDiff(oldStr, newStr, 'diffWords')).toBe(expected);
  });

  test('diffChars: should diff character by character', () => {
    const oldStr = "abcde";
    const newStr = "abxde";
    const expected = "ab<del>c</del><ins>x</ins>de";
    expect(applyDiff(oldStr, newStr, 'diffChars')).toBe(expected);
  });

  test('diffWordsWithSpace: should treat spaces as significant', () => {
    const oldStr = "A  B  C";
    const newStr = "A B C";
    const expected = "A<del>  </del><ins> </ins>B<del>  </del><ins> </ins>C";
    expect(applyDiff(oldStr, newStr, 'diffWordsWithSpace')).toBe(expected);
  });

  test('should default to diffWords when invalid method is provided', () => {
    const oldStr = "The quick brown fox";
    const newStr = "The quick brown cat";
    const expected = "The quick brown <del>fox</del><ins>cat</ins>";
    expect(applyDiff(oldStr, newStr, 'invalidMethod')).toBe(expected);
  });

  test('should handle completely different strings', () => {
    const oldStr = "Hello world";
    const newStr = "Goodbye universe";
    const expected = "<del>Hello</del><ins>Goodbye</ins> <del>world</del><ins>universe</ins>";
    expect(applyDiff(oldStr, newStr)).toBe(expected);
  });

  test('should handle completely different strings with diffChars', () => {
    const oldStr = "Hello world";
    const newStr = "Goodbye universe";
    const expected = "<del>H</del><ins>Goodby</ins>e<del>llo</del> <del>wo</del><ins>unive</ins>r<del>ld</del><ins>se</ins>";
    expect(applyDiff(oldStr, newStr, 'diffChars')).toBe(expected);
  });

  test('should handle empty strings', () => {
    expect(applyDiff("", "")).toBe("");
    expect(applyDiff("Hello", "")).toBe("<del>Hello</del>");
    expect(applyDiff("", "World")).toBe("<ins>World</ins>");
  });
});