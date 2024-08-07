import * as JsDiff from 'diff';

import { readFileSync, existsSync } from "fs";
import { writeOutput } from "../../verser.mjs";
import { extractVerseRanges } from "./parseRange.mjs";

export function processRanges(params) {
  if (!params.input || params.ranges.length === 0) {
    console.log('Please provide an input file and at least one range.');
    return;
  }

  const content = readFileSync(params.input, 'utf8');
  const extractedVerses = extractVerseRanges(content, params.ranges);

  if (params.review) {
    // let reviewContent = '';
    // if (params.output && params.output !== 'stdout' && existsSync(params.output)) {
    //   const existingContent = readFileSync(params.output, 'utf8');
    //   reviewContent = mergeVerses(existingContent, extractedVerses);
    // } else {
    //   reviewContent = Object.values(extractedVerses).join('\n');
    // }
    // console.log('Review of changes:');
    // console.log(reviewContent);
  } else if (params.output && params.output !== 'stdout') {
    let outputContent = Object.values(extractedVerses).join('\n');
    if (existsSync(params.output)) {
      const existingContent = readFileSync(params.output, 'utf8');
      outputContent = mergeVerses(existingContent, extractedVerses);
    }
    writeOutput(outputContent, params.output);
  } else {
    console.log(Object.values(extractedVerses).join('\n'));
  }
}

/**
 * Applies a diff between two strings using the specified diffing method.
 * @param {string} oldStr - The original string.
 * @param {string} newStr - The new string to compare against.
 * @param {('diffChars'|'diffWords'|'diffWordsWithSpace')} [method='diffWords'] - The diffing method to use.
 * @returns {string} A string with differences marked using <ins> and <del> tags.
 */
export function applyDiff(oldStr, newStr, method = 'diffWords') {
  let diff;
  switch (method) {
    case 'diffChars':
      diff = JsDiff.diffChars(oldStr, newStr);
      break;
    case 'diffWords':
      diff = JsDiff.diffWords(oldStr, newStr);
      break;
    case 'diffWordsWithSpace':
      diff = JsDiff.diffWordsWithSpace(oldStr, newStr);
      break;
    default:
      diff = JsDiff.diffWords(oldStr, newStr);
  }

  return diff.map(part => {
    if (part.added) {
      return `<ins>${part.value}</ins>`;
    }
    if (part.removed) {
      return `<del>${part.value}</del>`;
    }
    return part.value;
  }).join('');
}


export function decodeDiff(diffString) {
  let original = '';
  let modified = '';
  const stack = [];
  let currentOriginal = '';
  let currentModified = '';

  for (let i = 0; i < diffString.length; i++) {
    if (diffString.startsWith('<ins>', i)) {
      stack.push('ins');
      i += 4;
    } else if (diffString.startsWith('<del>', i)) {
      stack.push('del');
      i += 4;
    } else if (diffString.startsWith('</ins>', i) || diffString.startsWith('</del>', i)) {
      const tag = stack.pop();
      if (stack.length === 0) {
        if (tag === 'ins') {
          modified += currentModified;
        } else if (tag === 'del') {
          original += currentOriginal;
        }
        currentOriginal = '';
        currentModified = '';
      }
      i += 5;
    } else {
      if (stack.length === 0) {
        original += diffString[i];
        modified += diffString[i];
      } else {
        const topTag = stack[stack.length - 1];
        if (stack.length === 1) {  // Only add content when there's one tag
          if (topTag === 'ins') {
            currentModified += diffString[i];
          } else if (topTag === 'del') {
            currentOriginal += diffString[i];
          }
        }
        // Ignore content in nested tags
      }
    }
  }

  // Clean up extra spaces
  const cleanupSpaces = (str) => str.replace(/\s+/g, ' ').trim();

  return `${cleanupSpaces(original)}\n${cleanupSpaces(modified)}`;
}

/**
 * Merges new verses into existing content with various options for handling conflicts and differences.
 * @param {string} existingContent - The original content containing verses.
 * @param {Object.<string, string>} newVerses - An object containing new verses, where keys are verse numbers and values are verse content.
 * @param {Object} [options] - Options for merging verses. Any unspecified options will use their default values.
 * @param {boolean} [options.overwrite] - Whether to overwrite existing verses with new ones. Default: true
 * @param {boolean} [options.keepExistingOnConflict] - Whether to keep existing verses when there's a conflict and overwrite is false. Default: false
 * @param {boolean} [options.appendNewVerses] - Whether to append new verses that don't exist in the original content. Default: true
 * @param {('replace'|'append'|'prepend'|'markConflict')} [options.mergeStrategy] - The strategy to use when merging conflicting verses. Default: 'replace'
 * @param {string} [options.delimiter] - The delimiter to use when appending or prepending verses. Default: '||vs||'
 * @param {string} [options.conflictMarker] - The marker to use when marking conflicts. Default: '<<<CONFLICT>>>'
 * @param {boolean} [options.showDiff] - Whether to show the diff when marking conflicts. Default: true
 * @param {('diffChars'|'diffWords'|'diffWordsWithSpace')} [options.diffMethod] - The diffing method to use when showing diffs. Default: 'diffWords'
 * @returns {string} The merged content with all verses.
 */
export function mergeVerses(existingContent, newVerses, options = {}) {
  const defaultOptions = {
    overwrite: true,
    keepExistingOnConflict: false,
    appendNewVerses: true,
    mergeStrategy: 'replace',
    delimiter: '||vs||',
    conflictMarker: '<<<CONFLICT>>>',
    showDiff: true,
    diffMethod: 'diffWords'
  };

  // Merge the provided options with the default options
  const mergeOptions = { ...defaultOptions, ...options };

  const {
    overwrite,
    keepExistingOnConflict,
    appendNewVerses,
    mergeStrategy,
    delimiter,
    conflictMarker,
    showDiff,
    diffMethod
  } = mergeOptions;

  const existingLines = existingContent.split('\n');
  const mergedVerses = {};

  // Process existing verses
  existingLines.forEach(line => {
    const match = line.match(/^\|(\d+)\.\|/);
    if (match) {
      const verseNumber = parseInt(match[1]);
      mergedVerses[verseNumber] = line;
    }
  });

  // Process new verses
  Object.entries(newVerses).forEach(([verseNumber, newLine]) => {
    if (mergedVerses[verseNumber]) {
      if (overwrite) {
        if (mergeStrategy === 'replace') {
          mergedVerses[verseNumber] = newLine;
        } else if (mergeStrategy === 'append') {
          const newContent = newLine.replace(/^\|\d+\.\|\s*/, '');
          mergedVerses[verseNumber] += `${delimiter}${newContent}`;
        } else if (mergeStrategy === 'prepend') {
          const newContent = newLine.replace(/^\|\d+\.\|\s*/, '');
          mergedVerses[verseNumber] = `|${verseNumber}.| ${newContent}${delimiter}${mergedVerses[verseNumber].replace(/^\|\d+\.\|\s*/, '')}`;
        } else if (mergeStrategy === 'markConflict') {
          if (showDiff) {
            const diffResult = applyDiff(mergedVerses[verseNumber], newLine, diffMethod);
            mergedVerses[verseNumber] = `${conflictMarker}${diffResult}${conflictMarker}`;
          } else {
            mergedVerses[verseNumber] = `${conflictMarker}${mergedVerses[verseNumber]}${delimiter}${newLine}${conflictMarker}`;
          }
        }
      }
      // If overwrite is false, we keep the existing verse, so do nothing here
    } else if (appendNewVerses) {
      mergedVerses[verseNumber] = newLine;
    }
  });

  return Object.entries(mergedVerses)
    .sort(([a], [b]) => parseInt(a) - parseInt(b))
    .map(([_, line]) => line)
    .join('\n');
}