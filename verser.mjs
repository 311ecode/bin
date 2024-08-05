#!/usr/bin/env -S node --no-warnings

import { argv } from 'process';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { dirname } from 'path';
import { processFiles } from './processFiles.mjs';

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

// Check if arguments are provided
if (argv.length < 3) {
  console.log('Please provide file path(s) as argument(s).');
} else {
  processFiles(argv.slice(2));
}

