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

/**
 * Decodes a diff string back into original and modified versions.
 * @param {string} diffString - The string with diff markers.
 * @returns {string} A new-line delimited string where the first line is the original and the second is the modified version.
 */
export function decodeDiff(diffString) {
  let original = '';
  let modified = '';

  const parts = diffString.split(/(<ins>.*?<\/ins>|<del>.*?<\/del>)/);

  parts.forEach(part => {
    if (part.startsWith('<ins>')) {
      modified += part.replace(/<ins>(.*?)<\/ins>/, '$1');
    } else if (part.startsWith('<del>')) {
      original += part.replace(/<del>(.*?)<\/del>/, '$1');
    } else {
      original += part;
      modified += part;
    }
  });

  return `${original}\n${modified}`;
}

/**
 * Merges new verses into existing content with various options for handling conflicts and differences.
 * @param {string} existingContent - The original content containing verses.
 * @param {Object.<string, string>} newVerses - An object containing new verses, where keys are verse numbers and values are verse content.
 * @param {Object} [options] - Options for merging verses.
 * @param {boolean} [options.overwrite=true] - Whether to overwrite existing verses with new ones.
 * @param {boolean} [options.keepExistingOnConflict=false] - Whether to keep existing verses when there's a conflict and overwrite is false.
 * @param {boolean} [options.appendNewVerses=true] - Whether to append new verses that don't exist in the original content.
 * @param {('replace'|'append'|'prepend'|'markConflict')} [options.mergeStrategy='replace'] - The strategy to use when merging conflicting verses.
 * @param {string} [options.delimiter='||vs||'] - The delimiter to use when appending or prepending verses.
 * @param {string} [options.conflictMarker='<<<CONFLICT>>>'] - The marker to use when marking conflicts.
 * @param {boolean} [options.showDiff=true] - Whether to show the diff when marking conflicts.
 * @param {('diffChars'|'diffWords'|'diffWordsWithSpace')} [options.diffMethod='diffWords'] - The diffing method to use when showing diffs.
 * @returns {string} The merged content with all verses.
 */
export function mergeVerses(existingContent, newVerses, {
  overwrite = true,
  keepExistingOnConflict = false,
  appendNewVerses = true,
  mergeStrategy = 'replace',
  delimiter = '||vs||',
  conflictMarker = '<<<CONFLICT>>>',
  showDiff = true,
  diffMethod = 'diffWords'
} = {}) {
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
    //verseNumber = parseInt(verseNumber);
    if (mergedVerses[verseNumber]) {
      if (overwrite) {
        if (mergeStrategy === 'replace') {
          mergedVerses[verseNumber] = newLine;
        } else if (mergeStrategy === 'append') {
          mergedVerses[verseNumber] += `${delimiter}${newLine}`;
        } else if (mergeStrategy === 'prepend') {
          mergedVerses[verseNumber] = `${newLine}${delimiter}${mergedVerses[verseNumber]}`;
        } else if (mergeStrategy === 'markConflict') {
          if (showDiff) {
            const diffResult = applyDiff(mergedVerses[verseNumber], newLine, diffMethod);
            mergedVerses[verseNumber] = `${conflictMarker}${diffResult}${conflictMarker}`;
          } else {
            mergedVerses[verseNumber] = `${conflictMarker}${delimiter}${conflictMarker}`;
          }
        }
      } else if (keepExistingOnConflict) {
        // Do nothing, keep existing verse
      } else {
        delete mergedVerses[verseNumber]; // Remove conflicting verse
      }
    } else if (appendNewVerses) {
      mergedVerses[verseNumber] = newLine;
    }
  });

  return Object.entries(mergedVerses)
    .sort(([a], [b]) => parseInt(a) - parseInt(b))
    .map(([_, line]) => line)
    .join('\n');
}