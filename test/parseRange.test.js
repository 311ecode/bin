import { parseRange } from '../lib/range/parseRange.mjs';

describe('parseRange', () => {
  test('aaaa parses a simple range correctly', () => {
    const result = parseRange('1-5');
    expect(result).toEqual({ start: 1, end: 5 });
  });

  test('bbbb parses a single number as both start and end', () => {
    const result = parseRange('7');
    expect(result).toEqual({ start: 7, end: 7 });
  });

  test('cccc handles whitespace', () => {
    const result = parseRange(' 10 - 20 ');
    expect(result).toEqual({ start: 10, end: 20 });
  });

  test('dddd parses large numbers correctly', () => {
    const result = parseRange('1000-2000');
    expect(result).toEqual({ start: 1000, end: 2000 });
  });

  test('handles reversed range input', () => {
    expect(parseRange('2000-1000')).toEqual({ start: 1000, end: 2000 });
    expect(parseRange('1000-2000')).toEqual({ start: 1000, end: 2000 });
  });

  test('eeee returns NaN for invalid input', () => {
    const result = parseRange('invalid-range');
    expect(result).toEqual({ start: NaN, end: NaN, error: "Invalid range format: must be numbers separated by a hyphen",});
  });

  test('returns NaN and error message for invalid input', () => {
    const result = parseRange('invalid-range');
    expect(result).toEqual({ 
      start: NaN, 
      end: NaN, 
      error: "Invalid range format: must be numbers separated by a hyphen" 
    });
  });
  
  test('returns NaN and error message for too many parts', () => {
    const result = parseRange('1-2-3');
    expect(result).toEqual({ 
      start: NaN, 
      end: NaN, 
      error: "Invalid range format: use either a single number or two numbers separated by a hyphen" 
    });
  });

});