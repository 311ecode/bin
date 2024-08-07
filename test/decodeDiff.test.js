// Begin test/decodeDiff.test.js
import { decodeDiff } from '../lib/range/processRanges.mjs';

describe('decodeDiff', () => {
    test('should correctly decode a diff with insertions and deletions', () => {
      const input = "This is <del>an old</del><ins>a new</ins> sentence.";
      const expected = "This is an old sentence.\nThis is a new sentence.";
      expect(decodeDiff(input)).toBe(expected);
    });
  
    test('should handle multiple insertions and deletions', () => {
      const input = "<del>Old</del><ins>New</ins> text with <del>removed</del><ins>added</ins> words.";
      const expected = "Old text with removed words.\nNew text with added words.";
      expect(decodeDiff(input)).toBe(expected);
    });
  
    test('should handle text with no changes', () => {
      const input = "This text has no changes.";
      const expected = "This text has no changes.\nThis text has no changes.";
      expect(decodeDiff(input)).toBe(expected);
    });
  
    test('should handle only insertions', () => {
      const input = "This is <ins>a completely new</ins> sentence.";
      const expected = "This is sentence.\nThis is a completely new sentence.";
      expect(decodeDiff(input)).toBe(expected);
    });
  
    test('should handle only deletions', () => {
      const input = "This <del>was an old</del> sentence.";
      const expected = "This was an old sentence.\nThis sentence.";
      expect(decodeDiff(input)).toBe(expected);
    });
  
    test('should handle empty strings', () => {
      expect(decodeDiff("")).toBe("\n");
    });
  
    test('should handle complex nested changes', () => {
      const input = "The <del>quick <ins>brown</ins> fox</del><ins>slow <del>grey</del> cat</ins> jumps over the lazy dog.";
      const expected = "The quick fox jumps over the lazy dog.\nThe slow cat jumps over the lazy dog.";
      expect(decodeDiff(input)).toBe(expected);
    });
  
    test('should preserve necessary whitespace', () => {
      const input = "  <del>  Spaces  </del><ins> Tabs\t</ins>  ";
      const expected = "Spaces\nTabs";
      expect(decodeDiff(input)).toBe(expected);
    });
  });
  