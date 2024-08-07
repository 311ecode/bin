import { resolve } from "path/posix";
import { parseRange } from "./range/parseRange.mjs"; 


/**
 * Parses command-line arguments and returns an object with the parsed parameters.
 * 
 * @param {string[]} args - An array of command-line arguments.
 * @returns {Object} An object containing the parsed parameters:
 *   @property {string[]} concat - Array of files to concatenate.
 *   @property {string|null} output - Output file path or 'stdout' for console output.
 *   @property {string|null} input - Input file path.
 *   @property {boolean} toVerse - Flag to convert to verse format.
 *   @property {boolean} fromVerse - Flag to convert from verse format.
 *   @property {Object[]} ranges - Array of parsed ranges.
 *   @property {boolean} review - Flag to review changes.
 *   @property {string|null} origin - Origin file for translation.
 *   @property {string[]} directionFiles - Array of direction files for translation.
 *   @property {string} model - Model name for translation (default: 'gemma2:27b').
 *   @property {number} maxInputChunk - Maximum input chunk size (default: 1000).
 */
export function parseArguments(args) {
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
