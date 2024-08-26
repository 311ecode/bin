import fs from 'fs/promises';
import path from 'path';
import { createReadStream } from 'fs';
import readline from 'readline';
import ignore from 'ignore';
import blessed from 'blessed';
import { exec } from 'child_process';

const debounce = (func, delay) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

const searchFiles = async (searchString, dir = process.cwd()) => {
  if (!searchString.trim()) return [];
  
  let ig;
  try {
    const gitignoreContent = await fs.readFile(path.join(dir, '.gitignore'), 'utf8');
    ig = ignore().add(gitignoreContent + '\n.git\nnode_modules\npackage-lock.json');
  } catch (error) {
    ig = ignore();
  }

  const results = [];

  const searchRecursively = async (currentDir) => {
    const files = await fs.readdir(currentDir);

    for (const file of files) {
      const filePath = path.join(currentDir, file);
      const relativePath = path.relative(dir, filePath);

      if (ig.ignores(relativePath)) continue;

      const stat = await fs.stat(filePath);

      if (stat.isDirectory()) {
        await searchRecursively(filePath);
      } else if (stat.isFile()) {
        await searchInFile(filePath, searchString);
      }
    }
  };

  const searchInFile = async (filePath, searchString) => {
    const fileStream = createReadStream(filePath);
    const rl = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity
    });

    let lineNumber = 0;

    for await (const line of rl) {
      lineNumber++;
      const index = line.toLowerCase().indexOf(searchString.toLowerCase());
      if (index !== -1) {
        const relativePath = path.relative(dir, filePath);
        results.push(` ${relativePath}:${lineNumber}:${index + 1} | ${line.trim()}`);
      }
    }
  };

  await searchRecursively(dir);
  return results;
};

const createInterface = () => {
  const screen = blessed.screen({
    smartCSR: true,
    title: 'Real-time File Search'
  });

  const inputBox = blessed.textbox({
    parent: screen,
    top: 0,
    left: 0,
    height: 3,
    width: '100%',
    border: {
      type: 'line'
    },
    focus: true,
    inputOnFocus: true,
    lockKeys: ['up', 'down', 'enter', 'escape']  // Prevent these keys from affecting the input box
  });

  const resultList = blessed.list({
    parent: screen,
    top: 3,
    left: 0,
    height: '100%-3',
    width: '100%',
    border: {
      type: 'line'
    },
    keys: true,
    vi: true,
    mouse: true,
    scrollable: true,
    alwaysScroll: true,
    style: {
      selected: {
        bg: 'blue'
      }
    }
  });

  screen.key(['escape', 'q', 'C-c'], () => process.exit(0));

  const debouncedSearch = debounce(async (value) => {
    resultList.setItems(['Searching...']);
    screen.render();

    const results = await searchFiles(value);
    resultList.setItems(results);
    resultList.select(0);  // Select the first item by default
    screen.render();
  }, 300);

  inputBox.on('keypress', (ch, key) => {
    const value = inputBox.getValue();
    debouncedSearch(value);
  });

  const openSelectedFile = () => {
    const selected = resultList.selected;
    if (selected) {
      const [fileInfo] = resultList.getItem(selected).content.split(' | ');
      const command = `e ${fileInfo}`;
      exec(command, (error, stdout, stderr) => {
        if (error) {
          console.error(`Error executing command: ${error}`);
          return;
        }
        if (stderr) {
          console.error(`Command stderr: ${stderr}`);
        }
      });
    }
  };

  screen.key(['down', 'up'], (ch, key) => {
    if (key.name === 'down') {
      resultList.down();
    } else if (key.name === 'up') {
      resultList.up();
    }
    screen.render();
  });

  screen.key(['enter'], () => {
    openSelectedFile();
  });

  screen.render();
  inputBox.focus();

  return { screen, inputBox, resultList };
};

if (process.argv[2]) {
  const results = await searchFiles(process.argv[2]);
  results.forEach(result => console.log(result));
} else {
  const { screen } = createInterface();
}