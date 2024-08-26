import fs from 'fs/promises';
import path from 'path';
import { createReadStream } from 'fs';
import readline from 'readline';
import ignore from 'ignore';
import blessed from 'blessed';
import fuzzysort from 'fuzzysort'

import { exec } from 'child_process';
import sleep from 'atomic-sleep'


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

  const exactResults = [];
  const fuzzyResults = [];
  const priorityExtensions = ['.js', '.mjs', '.ts', '.jsx', '.tsx'];

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
        const fileExt = path.extname(file);
        if (priorityExtensions.includes(fileExt)) {
          await searchInFile(filePath, searchString, relativePath);
        }
        
        // Exact and fuzzy filename and path match
        const lowercaseFile = file.toLowerCase();
        const lowercasePath = relativePath.toLowerCase();
        const lowercaseSearch = searchString.toLowerCase();
        const exactFileMatch = lowercaseFile.includes(lowercaseSearch);
        const exactPathMatch = lowercasePath.includes(lowercaseSearch);
        
        if (exactFileMatch || exactPathMatch) {
          exactResults.push({
            path: relativePath,
            lineNumber: 0,
            columnNumber: 0,
            line: `File match: ${file}`,
            depth: relativePath.split(path.sep).length,
            matchType: exactFileMatch ? 'filename' : 'path'
          });
        } else {
          const fuzzyFileMatch = fuzzysort.single(searchString, file);
          const fuzzyPathMatch = fuzzysort.single(searchString, relativePath);
          if (fuzzyFileMatch || fuzzyPathMatch) {
            fuzzyResults.push({
              path: relativePath,
              lineNumber: 0,
              columnNumber: 0,
              line: `File match: ${file}`,
              depth: relativePath.split(path.sep).length,
              matchType: fuzzyFileMatch && (!fuzzyPathMatch || fuzzyFileMatch.score > fuzzyPathMatch.score) ? 'filename' : 'path',
              score: Math.max(fuzzyFileMatch ? fuzzyFileMatch.score : -Infinity, fuzzyPathMatch ? fuzzyPathMatch.score : -Infinity)
            });
          }
        }
      }
    }
  };

  const searchInFile = async (filePath, searchString, relativePath) => {
    const fileContent = await fs.readFile(filePath, 'utf8');
    const lines = fileContent.split('\n');

    lines.forEach((line, index) => {
      const lowercaseLine = line.toLowerCase();
      const lowercaseSearch = searchString.toLowerCase();
      
      // Exact match (case-insensitive)
      if (lowercaseLine.includes(lowercaseSearch)) {
        exactResults.push({
          path: relativePath,
          lineNumber: index + 1,
          columnNumber: lowercaseLine.indexOf(lowercaseSearch) + 1,
          line: line.trim(),
          depth: relativePath.split(path.sep).length,
          matchType: 'content'
        });
      } 
      // Fuzzy match only if search string is longer than 2 characters
      else if (searchString.length > 2) {
        const fuzzyMatch = fuzzysort.single(searchString, line);
        if (fuzzyMatch && fuzzyMatch.score > -5000) { // Adjust this threshold as needed
          fuzzyResults.push({
            path: relativePath,
            lineNumber: index + 1,
            columnNumber: fuzzyMatch.indexes[0] + 1,
            line: line.trim(),
            depth: relativePath.split(path.sep).length,
            matchType: 'content',
            score: fuzzyMatch.score,
            isFuzzy: true
          });
        }
      }
    });
  };

  await searchRecursively(dir);

  // Sort results
  const sortResults = (a, b) => {
    // Priority 0: Exact matches before fuzzy matches
    if (a.isFuzzy !== b.isFuzzy) return a.isFuzzy ? 1 : -1;

    // Priority 1: Files closest to pwd
    if (a.depth !== b.depth) return a.depth - b.depth;

    // Priority 2: File extension (for filename/path matches)
    if (a.matchType !== 'content' && b.matchType !== 'content') {
      const extA = path.extname(a.path);
      const extB = path.extname(b.path);
      const priorityExtensions = ['.js', '.mjs', '.ts', '.jsx', '.tsx'];
      const indexA = priorityExtensions.indexOf(extA);
      const indexB = priorityExtensions.indexOf(extB);
      if (indexA !== indexB) {
        if (indexA === -1) return 1;
        if (indexB === -1) return -1;
        return indexA - indexB;
      }
    }

    // Priority 3: Filename over path (for filename/path matches)
    if (a.matchType !== 'content' && b.matchType !== 'content') {
      if (a.matchType !== b.matchType) {
        return a.matchType === 'filename' ? -1 : 1;
      }
    }

    // Priority 4: Content matches over filename/path matches
    if (a.matchType !== b.matchType) {
      return a.matchType === 'content' ? -1 : 1;
    }

    // Priority 5: Position within file (for content matches)
    if (a.lineNumber !== b.lineNumber) return a.lineNumber - b.lineNumber;
    if (a.columnNumber !== b.columnNumber) return a.columnNumber - b.columnNumber;

    // If all else is equal, sort alphabetically by path
    return a.path.localeCompare(b.path);
  };

  // Mark fuzzy results
  fuzzyResults.forEach(result => {
    result.isFuzzy = true;
  });

  // Combine all results before sorting
  const allResults = [...exactResults, ...fuzzyResults];

  // Sort all results together
  allResults.sort(sortResults);

  const highlightFuzzyMatch = (result, highlightOpen, highlightClose) => {
    if (!result || !result.target) return result.target;
    let highlighted = '';
    let lastIndex = 0;
    for (const index of result.indexes) {
      highlighted += result.target.slice(lastIndex, index) + highlightOpen + result.target[index] + highlightClose;
      lastIndex = index + 1;
    }
    highlighted += result.target.slice(lastIndex);
    return highlighted;
  };

  // Modify the formatResult function to use blessed's bold formatting
  const formatResult = (r) => {
    const matchTypePrefix = r.matchType === 'content' ? '' : `${r.matchType} match: `;
    const fuzzyPrefix = r.isFuzzy ? 'fuzzy: ' : '';
    let highlightedLine = r.line;
    
    if (r.isFuzzy) {
      // For fuzzy matches, use our custom highlighting function with bold tags
      const fuzzyMatch = fuzzysort.single(searchString, r.line);
      if (fuzzyMatch) {
        highlightedLine = highlightFuzzyMatch(fuzzyMatch, '{bold}', '{/bold}');
      }
    } else {
      // For exact matches, highlight the search string with bold tags
      const regex = new RegExp(searchString, 'gi');
      highlightedLine = r.line.replace(regex, '{bold}$&{/bold}');
    }
    
    return ` ${r.path}${r.lineNumber ? `:${r.lineNumber}:${r.columnNumber}` : ''} | ${fuzzyPrefix}${matchTypePrefix}${highlightedLine}`;
  };  
  const formattedResults = allResults.map(formatResult);

  return formattedResults;
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
    inputOnFocus: true
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

  const debugBox = blessed.log({
    parent: screen,
    bottom: 0,
    right: 0,
    width: '50%',
    height: '30%',
    border: {
      type: 'line'
    },
    label: 'Debug Info',
    tags: true,
    keys: true,
    vi: true,
    mouse: true,
    scrollable: true,
    alwaysScroll: true
  });

  const debug = (message) => {
    debugBox.log(message);
    screen.render();
  };

  screen.key(['escape', 'q', 'C-c'], () => process.exit(0));

  let currentSearchTerm = '';

  const debouncedSearch = debounce(async () => {
    const value = currentSearchTerm;
    resultList.setItems(['Searching...']);
    screen.render();

    try {
      const results = await searchFiles(value);
      debug(`Found ${results.length} results for "${value}"`);
      
      if (results.length === 0) {
        resultList.setItems(['No results found']);
      } else {
        resultList.setItems(results);
        resultList.select(0);  // Select the first item by default
      }
      
      debug('Items set in resultList');
      debug(`First item: ${resultList.items[0]?.content || 'No items'}`);
      
      screen.render();
      debug('Screen rendered');
    } catch (error) {
      debug(`Error during search: ${error}`);
      resultList.setItems(['Error occurred during search']);
      screen.render();
    }
  }, 300);

  inputBox.on('keypress', (ch, key) => {
    if (['down', 'up', 'enter', 'left', 'right'].includes(key.name)) {
      resultList.emit('keypress', ch, key);
    } else {
      currentSearchTerm = inputBox.getValue();
      debug(`Current search term: "${currentSearchTerm}"`);
      if (key.name !== 'enter') {
        debouncedSearch();
      }
    }
  });
  


  // const openSelectedFile = () => {
  //   const selected = resultList.selected;
  //   if (selected !== undefined) {
  //     const [fileInfo] = resultList.getItem(selected).content.split(' | ');
  //     const command = `e ${fileInfo}`;
  //     exec(command, (error, stdout, stderr) => {
  //       if (error) {
  //         debug(`Error executing command: ${error}`);
  //         return;
  //       }
  //       if (stderr) {
  //         debug(`Command stderr: ${stderr}`);
  //       }
  //     });
  //   }
  // };
  const openSelectedFile = () => {
    const selected = resultList.selected;
    debug(`Selected item: ${selected}`);
    if (selected !== undefined) {
      debug(`Selected item: ${selected}`);
      // const fileInfo = resultList.getItem(selected).content.trim();
      // const [filePath, lineChar] = fileInfo.split(' | ')[0].split(':');
      // const absolutePath = path.resolve(process.cwd(), filePath);
      // const command = `code ${absolutePath}:${lineChar}`;
      // debug(`Command to open file in VSCode: ${command}`);
      
      // debug(`Executing command: ${command}`);

      // sleep(10000)
      
      // exec(command, (error, stdout, stderr) => {
      //   if (error) {
      //     debug(`Error executing command: ${error}`);
      //     return;
      //   }
      //   if (stderr) {
      //     debug(`Command stderr: ${stderr}`);
      //   }
      //   debug(`File opened in VSCode: ${absolutePath}`);
      // });
    }
    if (!selected) {
      debug('No item selected');
    }
  };

  resultList.key(['down', 'up'], (ch, key) => {
    if (key.name === 'down') {
      resultList.down();
    } else if (key.name === 'up') {
      resultList.up();
    }
    screen.render();
  });

  resultList.key('enter', () => {
    openSelectedFile();
  });

  screen.render();
  inputBox.focus();

  return { screen, inputBox, resultList, debug };
};

if (process.argv[2]) {
  const results = await searchFiles(process.argv[2]);
  results.forEach(result => console.log(result));
} else {
  const { screen, debug } = createInterface();
  debug('Interface created');
}