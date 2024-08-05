import { appendFile } from 'fs/promises';
import { resolve } from 'path';
import { env } from 'process';
import { spawn } from 'child_process';

env.DEBUG_TO_FILE = 'true';

const defaultPath = "/hdd/loclalLinks2/Documents_58b37aa1d3bd483dace1/obsidian-docs/Language/Dutch/translations/Márai/Napló/1945-1957/logs/processing.md";

const defaultConsoleLogger = (...consoleLoggerArgs) => {
  console.log(...consoleLoggerArgs);
};

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