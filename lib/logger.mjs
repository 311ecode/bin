import { appendFile } from 'fs/promises';
import { resolve } from 'path';
import { env } from 'process';
import { spawn } from 'child_process';

env.DEBUG_TO_FILE = 'true';

const defaultPath = "/hdd/loclalLinks2/Documents_58b37aa1d3bd483dace1/obsidian-docs/Language/Dutch/translations/Márai/Napló/1945-1957/logs/processing.md";

/**
 * Default console logger function.
 * @param {...*} consoleLoggerArgs - Arguments to log to the console.
 */
const defaultConsoleLogger = (...consoleLoggerArgs) => {
  console.log(...consoleLoggerArgs);
};

/**
 * Default file logger function factory.
 * @param {string} pathToFile - Path to the log file.
 * @returns {Function} Async function that logs to the file.
 */
const defaultFileLogger = (pathToFile) => env.DEBUG_TO_FILE && (async (timestamp, ...logData) => {

  const logMessage = `${timestamp}\n` + logData.map((data, index) => 
    `${index + 1}. ${typeof data === 'object' ? JSON.stringify(data, null, 2) : data}`
  ).join('\n\n') + '\n\n';
  
  try {
    await appendFile(resolve(pathToFile), logMessage);
  } catch (err) {
    console.error('Error writing to log file:', err);
  }
  
}) || (() => {});

/**
 * Default function for executing shell commands.
 * @type {Function}
 */
const defaultPossibleMagic = (env.DEBUG_TO_FILE) && 
  (() => {
  let bashProcess;
  let bashLoaded = false;
  let bashLoadedResolver;
  let endOResolver;

  const waitForBashLoaded = new Promise(resolve => {
    bashLoadedResolver = resolve;
  });

  return async (command) => {
    if (!bashProcess) {
      bashProcess = spawn('bash', ['--rcfile', '~/.bashrc', '-i']);
      
      bashProcess.stdout.on('data', (data) => {
        const output = data.toString();
        if (output.includes('bash loaded') && !bashLoaded) {
          bashLoaded = true;
          bashProcess.stdin.write(' HISTSIZE=0\n');
          bashProcess.stdin.write(' unset HISTFILE\n');
          bashProcess.stdin.write(' set +o history\n');
          bashLoadedResolver();
        }
        if (output.includes('end push_obsidian') && endOResolver) {
          endOResolver();
          endOResolver = null;
        }
      });
      
      bashProcess.stderr.on('data', (data) => console.error(data.toString()));
    }

    await waitForBashLoaded;

    if (command === 'push_obsidian') {
      bashProcess.stdin.write(`${command}\n`);
      return new Promise(resolve => {
        endOResolver = resolve;
      });
    } else if (command === 'c') {
      bashProcess.stdin.write(`${command}\n`);
    }
  };
})() || (()=>{});

/**
 * Creates a customized logger function.
 * @param {Object} options - Logger configuration options.
 * @param {string} [options.pathToFile=defaultPath] - Path to the log file.
 * @param {Function} [options.possibleConsoleLogger=defaultConsoleLogger] - Console logger function.
 * @param {Function} [options.possibleFileLogger=defaultFileLogger] - File logger function.
 * @param {Function} [options.possibleMagic=defaultPossibleMagic] - Function for executing shell commands.
 * @returns {Function} Configured logger function.
 */

// const defaultArgs = {
//   pathToFile: defaultPath,
//   possibleConsoleLogger: defaultConsoleLogger,
//   possibleFileLogger: defaultFileLogger,
//   possibleMagic: defaultPossibleMagic,
// };

export const logger = ({
  pathToFile = defaultPath,
  possibleConsoleLogger = defaultConsoleLogger,
  possibleFileLogger = defaultFileLogger,
  possibleMagic = defaultPossibleMagic,
} = {}) => (
    ...loggerFunctionArguments
  ) => {
    let lastLoggedMinute = '';

    return async (...thingsToLog) => {
      const now = new Date();
      const timestamp = now.toISOString().slice(0, 16).replace('T', ' ');
      const currentMinute = timestamp;

      // Check for "Ohhmm" and remove it if present
      const ohmmIndex = thingsToLog.indexOf("Ohhmm");
      let hasOhhmm = false;
      if (ohmmIndex !== -1) {
        thingsToLog.splice(ohmmIndex, 1);
        hasOhhmm = true;
      }

      // Execute console logger
      if (possibleConsoleLogger) {
        await possibleConsoleLogger(...thingsToLog);
      }

      const isNewMinute = currentMinute !== lastLoggedMinute;

      const fileLogger = possibleFileLogger(pathToFile);
      // Execute file logger, magic, and additional loggers
      for (const func of [possibleConsoleLogger, fileLogger, possibleMagic, ...loggerFunctionArguments]) {
        if (typeof func === 'function') {
          if (isNewMinute) {
            await func(timestamp, ...thingsToLog);
            lastLoggedMinute = currentMinute;
          } else {
            await func(...thingsToLog);
          }
        }
      }

      // If "Ohhmm" was present, initiate the shell and call the "o" bash script
      if (hasOhhmm) {
        await possibleMagic('push_obsidian');
      }
    };
  };
  