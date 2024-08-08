#!/usr/bin/env -S node --no-warnings

import { argv } from 'process';
import { processFiles } from './processFiles.mjs';

// Check if arguments are provided
if (argv.length < 3) {
  console.log('Please provide file path(s) as argument(s).');
} else {
  processFiles(argv.slice(2));
}

