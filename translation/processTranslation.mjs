import { readFileSync, existsSync } from "fs";
import { chatWithOllama } from "./drivers/ollama.mjs";
import { writeOutput } from "../verser.mjs";
import { mergeVerses } from "../processRanges.mjs";
import { logger } from "../lib/logger.mjs";

const log = logger()();

export async function processTranslation(params) {
  if (!params.origin || !params.output || params.directionFiles.length === 0) {
    console.log('Please provide origin file, output file, and at least one direction file.');
    return;
  }
  
  log('Starting translation process...');
  log(`Origin file: ${params.origin}`);
  log(`Output file: ${params.output}`);
  log(`Model: ${params.model}`);
  log(`Max input chunk: ${params.maxInputChunk} characters`);

  const originalContent = readFileSync(params.origin, 'utf8');
  const originalLines = originalContent.split('\n');

  const maxOrig = getMaxLineNumber(params.origin);
  const maxDestLine = getMaxLineNumber(params.output);
  let startLine = Math.max(maxDestLine, 1);

  log(`Max line number in original file: ${maxOrig}`);
  log(`Starting translation from line: ${startLine}`);

  let directions = '';
  for (const dirFile of params.directionFiles) {
    directions += readFileSync(dirFile, 'utf8') + '\n';
    log(`Loaded direction file: ${dirFile}`);
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
    log(`\nProcessing chunk #${chunkCount}`);

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

    log(`Chunk size: ${chunkSize} characters, ${chunkBytes} bytes`);
    log(`Lines in this chunk: ${startLine} to ${endLine - 1}`);
    log(`Sections in this chunk: ${sectionCount}`);
    log(`Processed ${processedBytes} of ${totalBytes} bytes (${percentOfDocument}% of document)`);
    log('Content preview:');
    log(chunk.split('\n').slice(0, 5).join('\n') + (chunk.split('\n').length > 5 ? '\n...' : ''));

    // Check if the chunk has any content other than separator lines
    // if (chunk.replace(/\|\d+\.\|---\n/g, '').trim() === '') {
    //   console.log('Skipping chunk as it contains no substantive content to translate.', {
    //     chunk
    //   });
    //   startLine = endLine;
    //   continue;
    // }
    // console.log('directions:' + directions);
    
    const prompt = directions + '\n' + chunk;
    log('Chunk ready for translation: \n-----\n\n' + prompt + '\n\n-----\n');
    log('Sending chunk to translation model...');
    const translationStartTime = Date.now();
    let translatedChunk = '';
    try {
      translatedChunk = await chatWithOllama(params.model, prompt);
    }
    catch (error) {
      log('Error in translation:', error, 'Ohhmm');
      // console.log('Retrying translation...');
      process.exit(1);
    }
    const translationTime = (Date.now() - translationStartTime) / 1000;
    log(`Received translated chunk from model in ${translationTime.toFixed(2)} seconds`, 'Ohhmm');

    const chunkProcessingTime = (Date.now() - chunkStartTime) / 1000;
    totalProcessingTime += chunkProcessingTime;
    chunkTimes.push(chunkProcessingTime);

    const avgChunkTime = totalProcessingTime / chunkCount;
    const estimatedTimeRemaining = avgChunkTime * ((maxOrig - endLine) / (endLine - startLine));
    const charactersPerSecond = chunkSize / translationTime;

    log(`Chunk processing time: ${chunkProcessingTime.toFixed(2)} seconds`);
    log(`Average chunk processing time: ${avgChunkTime.toFixed(2)} seconds`);
    log(`Estimated time remaining: ${formatTime(estimatedTimeRemaining)}`);
    log(`Translation speed: ${charactersPerSecond.toFixed(2)} characters/second`);

    translatedContent += translatedChunk + '\n';

    log('Translated content preview:', translatedContent);


    // Write the translated content to the output file after each chunk
    if (params.output !== 'stdout') {
      log('Writing translated chunk to output file...');
      let finalContent = translatedContent;
      if (existsSync(params.output)) {
        const existingContent = readFileSync(params.output, 'utf8');
        finalContent = mergeVerses(existingContent, parseVerses(translatedContent));
      }
      writeOutput(finalContent, params.output);
      log('Chunk written to output file');
    }

    startLine = endLine;

    log(`Translated up to line ${startLine - 1} of ${maxOrig}`);
    log(`Progress: ${((startLine - 1) / maxOrig * 100).toFixed(2)}%`);
  }

  const totalElapsedTime = (Date.now() - startTime) / 1000;
  const avgChunkTime = totalProcessingTime / chunkCount;
  const avgCharactersPerSecond = processedBytes / totalElapsedTime;

  log('\nTranslation process completed.');
  log(`Total elapsed time: ${formatTime(totalElapsedTime)}`);
  log(`Average chunk processing time: ${avgChunkTime.toFixed(2)} seconds`);
  log(`Fastest chunk: ${Math.min(...chunkTimes).toFixed(2)} seconds`);
  log(`Slowest chunk: ${Math.max(...chunkTimes).toFixed(2)} seconds`);
  log(`Average translation speed: ${avgCharactersPerSecond.toFixed(2)} characters/second`);

  // Final output for stdout option
  if (params.output === 'stdout') {
    log('Outputting complete translation to stdout:');
    log(translatedContent);
  } else {
    log('Translation process completed. All chunks have been written to the output file.');
  }

  log('','Ohhmm');
}

export function formatTime(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${hours}h ${minutes}m ${remainingSeconds}s`;
}

export function getMaxLineNumber(filePath) {
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


