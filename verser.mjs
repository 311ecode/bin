#!/usr/bin/env -S node --no-warnings

import { argv } from 'process';

import { readFileSync, existsSync, mkdirSync, writeFileSync } from 'fs';
import { basename, dirname } from 'path';

import { processTranslation } from './translation/processTranslation.mjs';
import { parseArguments } from './parseArguments.mjs';
import { processRanges } from './processRanges.mjs';


// converts a text to verse format
function convertToVerse(text) {
  let paragraphs = text.split('\n');
  let verseNumber = 1;
  let result = '';

  for (let paragraph of paragraphs) {
    if (paragraph.trim() === '') {
      result += `|${verseNumber}.|---\n`;
      verseNumber++;
    } else {
      let sentences = paragraph.match(/[^.!?]+[.!?]+/g) || [paragraph];
      for (let sentence of sentences) {
        sentence = sentence.trim();
        if (/^\|\d+\.\|/.test(sentence)) {
          result += sentence + '\n';
        } else {
          result += `|${verseNumber}.| ${sentence}\n`;
          verseNumber++;
        }
      }
    }
  }

  return result.trim();
}

function convertFromVerse(text) {
  let verses = text.split('\n');
  let result = '';
  let consecutiveNewlines = 0;
  let lastLineWasContent = false;

  for (let verse of verses) {
    verse = verse.trim();
    if (verse.endsWith('|---')) {
      consecutiveNewlines++;
    } else {
      if (lastLineWasContent) {
        result += '\n'.repeat(Math.max(consecutiveNewlines, 1));
      } else if (consecutiveNewlines > 0) {
        result += '\n'.repeat(consecutiveNewlines);
      }
      result += verse.replace(/^\|\d+\.\|\s*/, '');
      consecutiveNewlines = 0;
      lastLineWasContent = true;
    }
  }

  return result.trim();
}

function mapVersesToArray(filePaths) {
  let versionNames = filePaths.map(filePath => basename(filePath, '.verses').replace('.md', ''));
  let allVerses = [];

  filePaths.forEach((filePath, index) => {
    try {
      let content = readFileSync(filePath, 'utf8').split('\n');
      content.forEach(line => {
        let match = line.match(/^\|(\d+)\.\|\s*(.*)/);
        if (match) {
          let lineNumber = parseInt(match[1]);
          let sentence = match[2].trim();
          if (!allVerses[lineNumber]) {
            allVerses[lineNumber] = [];
          }
          allVerses[lineNumber].push({
            name: versionNames[index],
            sentence: sentence
          });
        }
      });
    } catch (err) {
      console.error(`Error reading file ${filePath}:`, err);
    }
  });

  return allVerses;
}

function concatenateVerses(filePaths) {
  let mappedVerses = mapVersesToArray(filePaths);
  let result = '';

  mappedVerses.forEach((versions, index) => {
    if (versions && versions.length > 0) {
      result += `[${index}.]`;
      if (versions.every(v => v.sentence === '---')) {
        result += ' ---\n';
      } else {
        let uniqueSentences = new Map();
        versions.forEach(v => {
          if (!uniqueSentences.has(v.sentence)) {
            uniqueSentences.set(v.sentence, [v.name]);
          } else {
            uniqueSentences.get(v.sentence).push(v.name);
          }
        });

        if (uniqueSentences.size === 1 && versions.length > 1) {
          // All sentences are the same
          result += ` ${versions[0].sentence}\n`;
        } else if (uniqueSentences.size > 1) {
          result += '\n';
          for (let [sentence, names] of uniqueSentences) {
            if (names.length > 1) {
              result += `[${names.join(' ')}] ${sentence}\n`;
            } else {
              result += `[${names[0]}] ${sentence}\n`;
            }
          }
        } else {
          // Only one version
          result += ` ${versions[0].sentence}\n`;
        }
      }
      result += '\n';
    }
  });

  return result.trim();
}

function printHelp() {
  console.log('Usage: node verser.js [options] <input_file>');
  console.log('\nOptions:');
  console.log('  -c, --concat <file1> <file2> [<file3> ...]  Concatenate multiple verse files');
  console.log('  -tv, --to-verse <input_file>                Convert text to verse format');
  console.log('  -fv, --from-verse <input_file>              Convert verse to plain text');
  console.log('  -r, --range <input_file> <range1> [<range2> ...] Extract specific verse ranges');
  console.log('  -o, --output [<output_file>]                Specify output file (optional)');
  console.log('  --review                                    Review changes without modifying files (used with -r)');
  console.log('  -or, --origin <file>                        Specify the original file for translation');
  console.log('  -d, --direction-file <file>                 Specify direction file(s) for translation');
  console.log('  -m, --model <model>                         Specify the model for translation (default: gemma2:27b)');
  console.log('  -mi, --max-input-chunk <number>             Specify max length of input chunk for translation');
  console.log('\nExamples:');
  console.log('  node verser.js input.txt                    Process a single file');
  console.log('  node verser.js -c file1.verses file2.verses Concatenate verse files');
  console.log('  node verser.js -tv input.txt                Convert to verse format');
  console.log('  node verser.js -fv input.verses             Convert from verse format');
  console.log('  node verser.js -r input.verses 1-10 22-33   Extract verses 1-10 and 22-33');
  console.log('  node verser.js -or original.txt -o output.verses -d direction.txt -m gemma2:27b -mi 1000');
  console.log('\nOutput behavior:');
  console.log('  - Without -o: Output goes to stdout');
  console.log('  - With -o but no filename:');
  console.log('    * For -tv: Creates <input_file>.verse');
  console.log('    * For -fv: Creates <input_file>.txt');
  console.log('    * For others: Output goes to stdout');
  console.log('  - With -o and filename: Output goes to specified file');
  console.log('\nReview option:');
  console.log('  When used with -r, --review shows the result of applying the range');
  console.log('  to the existing output file (if specified and exists) or');
  console.log('  displays the extracted verses without modifying any files.');
  console.log('\nNote: -tv and -fv require an output (either to file or stdout)');
  console.log('      --review is currently only applicable with the -r option');
}



export function writeOutput(content, outputPath) {
  if (outputPath === 'stdout') {
    console.log(content);
  } else if (outputPath) {
    // Ensure the directory exists
    const outputDir = dirname(outputPath);
    if (!existsSync(outputDir)) {
      mkdirSync(outputDir, { recursive: true });
    }
    // Write the content to the file
    writeFileSync(outputPath, content);
    console.log(`Output written to: ${outputPath}`);
  }
}

export function parseRange(range) {
  const [start, end] = range.split('-').map(Number);
  return { start, end };
}

export function extractVerseRanges(content, ranges) {
  const lines = content.split('\n');
  const extractedVerses = {};

  ranges.forEach(range => {
    for (let i = range.start; i <= range.end; i++) {
      const verseLine = lines.find(line => line.startsWith(`|${i}.|`));
      if (verseLine) {
        extractedVerses[i] = verseLine;
      }
    }
  });

  return extractedVerses;
}


export function parseVerses(content) {
  const lines = content.split('\n');
  const verses = {};
  lines.forEach(line => {
    const match = line.match(/^\|(\d+)\.\|/);
    if (match) {
      const verseNumber = parseInt(match[1]);
      verses[verseNumber] = line;
    }
  });
  return verses;
}

async function processFiles(args) {
  let params = parseArguments(args);

  if (params.ranges.length > 0) {
    processRanges(params);
  } else if (params.concat.length >= 2) {
    let concatenated = concatenateVerses(params.concat);
    writeOutput(concatenated, params.output);
  } else if (params.toVerse && params.input) {
    let content = readFileSync(params.input, 'utf8');
    let result = convertToVerse(content);
    writeOutput(result, params.output);
  } else if (params.fromVerse && params.input) {
    let content = readFileSync(params.input, 'utf8');
    let result = convertFromVerse(content);
    writeOutput(result, params.output);
  } else if (params.origin && params.directionFiles.length > 0) {
    await processTranslation(params);
  } else if (params.input) {
    let result = processFile(params.input);
    writeOutput(result, params.output);
  } else {
    printHelp();
  }
}

// Check if arguments are provided
if (argv.length < 3) {
  console.log('Please provide file path(s) as argument(s).');
} else {
  processFiles(argv.slice(2));
}

