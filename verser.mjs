#!/usr/bin/env -S node --no-warnings

import { argv } from 'process';

import { readFileSync, existsSync, mkdirSync, writeFileSync } from 'fs';
import { basename, resolve, dirname } from 'path';

import { chatWithOllama } from './chatter.mjs';


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



function parseArguments(args) {
  let params = {
    concat: [],
    output: null,
    input: null,
    toVerse: false,
    fromVerse: false,
    ranges: [],
    review: false,
    origin: null,
    directionFiles: [],
    model: 'gemma2:27b',
    maxInputChunk: 1000
  };
  
  const mustHaveOutput = ['-fv', '--from-verse', '-tv', '--to-verse'];
  
  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '-c':
      case '--concat':
        i++;
        while (i < args.length && !args[i].startsWith('-')) {
          params.concat.push(args[i]);
          i++;
        }
        i--; // Step back to process the next flag
        break;
      case '-o':
      case '--output':
        i++;
        if (i < args.length && !args[i].startsWith('-')) {
          params.output = resolve(args[i]);
        } else {
          params.output = 'default'; // Flag that we need a default output
        }
        break;
      case '-tv':
      case '--to-verse':
        params.toVerse = true;
        i++;
        if (i < args.length && !args[i].startsWith('-')) {
          params.input = args[i];
        }
        break;
      case '-fv':
      case '--from-verse':
        params.fromVerse = true;
        i++;
        if (i < args.length && !args[i].startsWith('-')) {
          params.input = args[i];
        }
        break;
      case '-r':
      case '--range':
        i++;
        if (i < args.length && !args[i].startsWith('-')) {
          params.input = args[i];
          i++;
          while (i < args.length && !args[i].startsWith('-')) {
            params.ranges.push(parseRange(args[i]));
            i++;
          }
          i--; // Step back to process the next flag
        }
        break;
      case '--review':
      case '-re':
        params.review = true;
        break;
      case '-or':
      case '--origin':
        i++;
        if (i < args.length && !args[i].startsWith('-')) {
          params.origin = args[i];
        }
        break;
      case '-d':
      case '--direction-file':
        i++;
        while (i < args.length && !args[i].startsWith('-')) {
          params.directionFiles.push(args[i]);
          i++;
        }
        i--; // Step back to process the next flag
        break;
      case '-m':
      case '--model':
        i++;
        if (i < args.length && !args[i].startsWith('-')) {
          params.model = args[i];
        }
        break;
      case '-mi':
      case '--max-input-chunk':
        i++;
        if (i < args.length && !args[i].startsWith('-')) {
          params.maxInputChunk = parseInt(args[i]);
        }
        break;
      default:
        if (!args[i].startsWith('-') && !params.input) {
          params.input = args[i];
        }
    }
  }
  
  // Handle default output for -tv and -fv
  if (mustHaveOutput.includes(args[0]) || mustHaveOutput.includes(args[1])) {
    if (params.output === null && params.input) {
      // No -o specified, use stdout
      params.output = 'stdout';
    } else if (params.output === 'default' && params.input) {
      // -o specified without filename
      let ext = params.toVerse ? '.verse' : '.txt';
      params.output = resolve(params.input + ext);
    }
  }
  
  return params;
}

function writeOutput(content, outputPath) {
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

function parseRange(range) {
  const [start, end] = range.split('-').map(Number);
  return { start, end };
}

function extractVerseRanges(content, ranges) {
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

function mergeVerses(existingContent, newVerses) {
  const existingLines = existingContent.split('\n');
  const mergedVerses = {};

  existingLines.forEach(line => {
    const match = line.match(/^\|(\d+)\.\|/);
    if (match) {
      const verseNumber = parseInt(match[1]);
      mergedVerses[verseNumber] = line;
    }
  });

  Object.assign(mergedVerses, newVerses);

  return Object.entries(mergedVerses)
    .sort(([a], [b]) => parseInt(a) - parseInt(b))
    .map(([_, line]) => line)
    .join('\n');
}

function processRanges(params) {
  if (!params.input || params.ranges.length === 0) {
    console.log('Please provide an input file and at least one range.');
    return;
  }

  const content = readFileSync(params.input, 'utf8');
  const extractedVerses = extractVerseRanges(content, params.ranges);

  if (params.review) {
    let reviewContent = '';
    if (params.output && params.output !== 'stdout' && existsSync(params.output)) {
      const existingContent = readFileSync(params.output, 'utf8');
      reviewContent = mergeVerses(existingContent, extractedVerses);
    } else {
      reviewContent = Object.values(extractedVerses).join('\n');
    }
    console.log('Review of changes:');
    console.log(reviewContent);
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

function getMaxLineNumber(filePath) {
  if (!existsSync(filePath)) return 0;
  const content = readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  let maxLineNumber = 0;
  for (const line of lines) {
    const match = line.match(/^\|(\d+)\.\|/);
    if (match) {
      const lineNumber = parseInt(match[1]);
      if (lineNumber > maxLineNumber) {
        maxLineNumber = lineNumber;
      }
    }
  }
  return maxLineNumber;
}

async function processTranslation(params) {
  if (!params.origin || !params.output || params.directionFiles.length === 0) {
    console.log('Please provide origin file, output file, and at least one direction file.');
    return;
  }

  console.log('Starting translation process...');
  console.log(`Origin file: ${params.origin}`);
  console.log(`Output file: ${params.output}`);
  console.log(`Model: ${params.model}`);
  console.log(`Max input chunk: ${params.maxInputChunk} characters`);

  const originalContent = readFileSync(params.origin, 'utf8');
  const originalLines = originalContent.split('\n');
  
  const maxOrig = getMaxLineNumber(params.origin);
  const maxDestLine = getMaxLineNumber(params.output);
  let startLine = Math.max(maxDestLine, 1);

  console.log(`Max line number in original file: ${maxOrig}`);
  console.log(`Starting translation from line: ${startLine}`);

  let directions = '';
  for (const dirFile of params.directionFiles) {
    directions += readFileSync(dirFile, 'utf8') + '\n';
    console.log(`Loaded direction file: ${dirFile}`);
  }

  let translatedContent = '';
  let chunkCount = 0;
  const totalBytes = Buffer.byteLength(originalContent, 'utf8');
  let processedBytes = 0;
  let totalProcessingTime = 0;
  let chunkTimes = [];
  const startTime = Date.now();

  while (startLine <= maxOrig) {
    const chunkStartTime = Date.now();
    chunkCount++;
    console.log(`\nProcessing chunk #${chunkCount}`);
    
    let chunk = '';
    let chunkSize = 0;
    let endLine = startLine;
    let sectionCount = 0;

    while (endLine <= maxOrig && chunkSize + directions.length < params.maxInputChunk) {
      const line = originalLines[endLine - 1];
      
      // Check if adding this line would exceed the max input chunk size
      if (chunkSize + line.length + directions.length > params.maxInputChunk) {
        break;
      }
      
      chunk += line + '\n';
      chunkSize += line.length + 1;
      endLine++;
      
      if (line.trim().endsWith('|---')) {
        sectionCount++;
      }
    }

    // Adjust the chunk to end with a '|---' line if possible
    let lastSeparatorIndex = chunk.lastIndexOf('|---');
    if (lastSeparatorIndex !== -1 && lastSeparatorIndex !== chunk.length - 5) {
      // Find the start of the line containing '|---'
      let lineStart = chunk.lastIndexOf('\n', lastSeparatorIndex) + 1;
      chunk = chunk.substring(0, lineStart);
      endLine = startLine + chunk.split('\n').length - 1;
    }

    const chunkBytes = Buffer.byteLength(chunk, 'utf8');
    processedBytes += chunkBytes;
    const percentOfDocument = (processedBytes / totalBytes * 100).toFixed(2);

    console.log(`Chunk size: ${chunkSize} characters, ${chunkBytes} bytes`);
    console.log(`Lines in this chunk: ${startLine} to ${endLine - 1}`);
    console.log(`Sections in this chunk: ${sectionCount}`);
    console.log(`Processed ${processedBytes} of ${totalBytes} bytes (${percentOfDocument}% of document)`);
    console.log('Content preview:');
    console.log(chunk.split('\n').slice(0, 5).join('\n') + (chunk.split('\n').length > 5 ? '\n...' : ''));

    // Check if the chunk has any content other than separator lines
    if (chunk.replace(/\|\d+\.\|---\n/g, '').trim() === '') {
      console.log('Skipping chunk as it contains no substantive content to translate.');
      startLine = endLine;
      continue;
    }

    const prompt = directions + '\n' + chunk;
    console.log('Sending chunk to translation model...');
    const translationStartTime = Date.now();
    const translatedChunk = await chatWithOllama(params.model, prompt);
    const translationTime = (Date.now() - translationStartTime) / 1000;
    console.log(`Received translated chunk from model in ${translationTime.toFixed(2)} seconds`);

    const chunkProcessingTime = (Date.now() - chunkStartTime) / 1000;
    totalProcessingTime += chunkProcessingTime;
    chunkTimes.push(chunkProcessingTime);

    const avgChunkTime = totalProcessingTime / chunkCount;
    const estimatedTimeRemaining = avgChunkTime * ((maxOrig - endLine) / (endLine - startLine));
    const charactersPerSecond = chunkSize / translationTime;

    console.log(`Chunk processing time: ${chunkProcessingTime.toFixed(2)} seconds`);
    console.log(`Average chunk processing time: ${avgChunkTime.toFixed(2)} seconds`);
    console.log(`Estimated time remaining: ${formatTime(estimatedTimeRemaining)}`);
    console.log(`Translation speed: ${charactersPerSecond.toFixed(2)} characters/second`);

    translatedContent += translatedChunk + '\n';
    
    // Write the translated content to the output file after each chunk
    if (params.output !== 'stdout') {
      console.log('Writing translated chunk to output file...');
      let finalContent = translatedContent;
      if (existsSync(params.output)) {
        const existingContent = readFileSync(params.output, 'utf8');
        finalContent = mergeVerses(existingContent, parseVerses(translatedContent));
      }
      writeOutput(finalContent, params.output);
      console.log('Chunk written to output file');
    }

    startLine = endLine;

    console.log(`Translated up to line ${startLine - 1} of ${maxOrig}`);
    console.log(`Progress: ${((startLine - 1) / maxOrig * 100).toFixed(2)}%`);
  }

  const totalElapsedTime = (Date.now() - startTime) / 1000;
  const avgChunkTime = totalProcessingTime / chunkCount;
  const avgCharactersPerSecond = processedBytes / totalElapsedTime;

  console.log('\nTranslation process completed.');
  console.log(`Total elapsed time: ${formatTime(totalElapsedTime)}`);
  console.log(`Average chunk processing time: ${avgChunkTime.toFixed(2)} seconds`);
  console.log(`Fastest chunk: ${Math.min(...chunkTimes).toFixed(2)} seconds`);
  console.log(`Slowest chunk: ${Math.max(...chunkTimes).toFixed(2)} seconds`);
  console.log(`Average translation speed: ${avgCharactersPerSecond.toFixed(2)} characters/second`);

  // Final output for stdout option
  if (params.output === 'stdout') {
    console.log('Outputting complete translation to stdout:');
    console.log(translatedContent);
  } else {
    console.log('Translation process completed. All chunks have been written to the output file.');
  }
}

function formatTime(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${hours}h ${minutes}m ${remainingSeconds}s`;
}
function parseVerses(content) {
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

