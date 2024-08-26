import fs from 'fs/promises';
import path from 'path';
import { createReadStream } from 'fs';
import readline from 'readline';
import ignore from 'ignore';
import blessed from 'blessed';
import fuzzysort from 'fuzzysort';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

const debounce = (func, delay) => {
  let timeoutId;
  return (...args) => {
    return new Promise(resolve => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(async () => {
        const result = await func(...args);
        resolve(result);
      }, delay);
    });
  };
};

class UnifiedSearcher {
  constructor(isGitMode = false) {
    this.isGitMode = isGitMode;
    this.priorityExtensions = ['.js', '.mjs', '.ts', '.jsx', '.tsx'];
  }

  async search(searchString, options = {}) {
    if (this.isGitMode) {
      return this.searchGitLog(searchString, options);
    } else {
      return this.searchFilesystem(searchString, options);
    }
  }

  async searchFilesystem(searchString, options = {}) {
    const { dir = process.cwd(), maxResults = 100 } = options;
    if (!searchString.trim()) return [];

    const ignoreFilter = await this.getIgnoreFilter(dir);
    const exactResults = [];
    const fuzzyResults = [];

    const searchRecursively = async (currentDir) => {
      const files = await fs.readdir(currentDir);

      for (const file of files) {
        const filePath = path.join(currentDir, file);
        const relativePath = path.relative(dir, filePath);

        if (ignoreFilter.ignores(relativePath)) continue;

        const stat = await fs.stat(filePath);

        if (stat.isDirectory()) {
          await searchRecursively(filePath);
        } else if (stat.isFile()) {
          const fileExt = path.extname(file);
          if (this.priorityExtensions.includes(fileExt)) {
            await this.searchInFile(filePath, searchString, relativePath, exactResults, fuzzyResults);
          }
          
          this.checkFileNameMatch(file, relativePath, searchString, exactResults, fuzzyResults);
        }
      }
    };

    await searchRecursively(dir);

    const allResults = [...exactResults, ...fuzzyResults];
    allResults.sort(this.sortResults);

    return this.formatResults(allResults, searchString);
  }

  async searchGitLog(searchString, options = {}) {
    const { maxResults = 100 } = options;
    const command = `git log --pretty=format:"%H|%h|%an|%ad|%s" --date=short -n ${maxResults * 2}`;
    const { stdout } = await execAsync(command);
    
    const commits = stdout.split('\n').map(line => {
      const [fullHash, shortHash, author, date, subject] = line.split('|');
      return { fullHash, shortHash, author, date, subject };
    });
  
    const exactResults = [];
    const fuzzyResults = [];
    const latestContentLines = new Map(); // To track the latest version of each line
  
    for (const commit of commits) {
      const lowercaseSubject = commit.subject.toLowerCase();
      const lowercaseAuthor = commit.author.toLowerCase();
      const lowercaseSearch = searchString.toLowerCase();
  
      // Check commit details
      if (commit.fullHash.includes(searchString) || commit.shortHash.includes(searchString) ||
          lowercaseSubject.includes(lowercaseSearch) || lowercaseAuthor.includes(lowercaseSearch)) {
        exactResults.push({
          path: commit.shortHash,
          lineNumber: 0,
          columnNumber: 0,
          line: `${commit.date} - ${commit.author}: ${commit.subject}`,
          depth: commits.indexOf(commit),
          matchType: 'commit',
          isFuzzy: false
        });
      } else {
        const fuzzyMatch = fuzzysort.go(searchString, [commit.subject, commit.author, commit.shortHash], {
          threshold: -5000,
          keys: ['subject', 'author', 'shortHash']
        });
        if (fuzzyMatch.total > 0) {
          fuzzyResults.push({
            path: commit.shortHash,
            lineNumber: 0,
            columnNumber: 0,
            line: `${commit.date} - ${commit.author}: ${commit.subject}`,
            depth: commits.indexOf(commit),
            matchType: 'commit',
            score: fuzzyMatch[0].score,
            isFuzzy: true
          });
        }
      }
  
      // Search within file contents for this commit
      try {
        const { stdout: diffOutput } = await execAsync(`git diff-tree -r --no-commit-id --name-only ${commit.fullHash}`);
        const changedFiles = diffOutput.trim().split('\n');
  
        for (const file of changedFiles) {
          try {
            const { stdout: fileChanges } = await execAsync(`git show ${commit.fullHash} -- ${file}`);
            const lines = fileChanges.split('\n');
  
            lines.forEach((line, index) => {
              if (line.startsWith('+') && !line.startsWith('+++')) {  // Only check added lines
                const contentLine = line.slice(1);  // Remove the '+' prefix
                const lowercaseLine = contentLine.toLowerCase();
                const lineKey = `${file}:${contentLine}`;
                
                if (lowercaseLine.includes(lowercaseSearch)) {
                  const result = {
                    path: `${commit.shortHash}:${file}`,
                    lineNumber: index + 1,
                    columnNumber: lowercaseLine.indexOf(lowercaseSearch) + 1,
                    line: contentLine.trim(),
                    depth: commits.indexOf(commit),
                    matchType: 'content',
                    isFuzzy: false
                  };
                  latestContentLines.set(lineKey, result);
                } else if (searchString.length > 2) {
                  const fuzzyMatch = fuzzysort.single(searchString, contentLine);
                  if (fuzzyMatch && fuzzyMatch.score > -5000) {
                    const result = {
                      path: `${commit.shortHash}:${file}`,
                      lineNumber: index + 1,
                      columnNumber: fuzzyMatch.indexes[0] + 1,
                      line: contentLine.trim(),
                      depth: commits.indexOf(commit),
                      matchType: 'content',
                      score: fuzzyMatch.score,
                      isFuzzy: true
                    };
                    latestContentLines.set(lineKey, result);
                  }
                }
              }
            });
          } catch (error) {
            console.error(`Error processing file ${file} in commit ${commit.shortHash}: ${error.message}`);
          }
        }
      } catch (error) {
        console.error(`Error processing commit ${commit.shortHash}: ${error.message}`);
      }
    }
  
    // Add the latest version of each content line to the results
    for (const result of latestContentLines.values()) {
      if (result.isFuzzy) {
        fuzzyResults.push(result);
      } else {
        exactResults.push(result);
      }
    }
  
    const allResults = [...exactResults, ...fuzzyResults];
    allResults.sort(this.sortResults);
  
    return this.formatResults(allResults, searchString);
  }
  async getIgnoreFilter(dir) {
    try {
      const gitignoreContent = await fs.readFile(path.join(dir, '.gitignore'), 'utf8');
      return ignore().add(gitignoreContent + '\n.git\nnode_modules\npackage-lock.json');
    } catch (error) {
      return ignore();
    }
  }

  async searchInFile(filePath, searchString, relativePath, exactResults, fuzzyResults) {
    const fileContent = await fs.readFile(filePath, 'utf8');
    const lines = fileContent.split('\n');

    lines.forEach((line, index) => {
      const lowercaseLine = line.toLowerCase();
      const lowercaseSearch = searchString.toLowerCase();
      
      if (lowercaseLine.includes(lowercaseSearch)) {
        exactResults.push({
          path: relativePath,
          lineNumber: index + 1,
          columnNumber: lowercaseLine.indexOf(lowercaseSearch) + 1,
          line: line.trim(),
          depth: relativePath.split(path.sep).length,
          matchType: 'content',
          isFuzzy: false
        });
      } else if (searchString.length > 2) {
        const fuzzyMatch = fuzzysort.single(searchString, line);
        if (fuzzyMatch && fuzzyMatch.score > -5000) {
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
  }

  checkFileNameMatch(file, relativePath, searchString, exactResults, fuzzyResults) {
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
        matchType: exactFileMatch ? 'filename' : 'path',
        isFuzzy: false
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
          score: Math.max(fuzzyFileMatch ? fuzzyFileMatch.score : -Infinity, fuzzyPathMatch ? fuzzyPathMatch.score : -Infinity),
          isFuzzy: true
        });
      }
    }
  }

  sortResults = (a, b) => {
    // Priority 0: Exact matches before fuzzy matches
    if (a.isFuzzy !== b.isFuzzy) return a.isFuzzy ? 1 : -1;

    // Priority 1: Files closest to pwd
    if (a.depth !== b.depth) return a.depth - b.depth;

    // Priority 2: File extension (for filename/path matches)
    if (a.matchType !== 'content' && b.matchType !== 'content') {
      const extA = path.extname(a.path);
      const extB = path.extname(b.path);
      const indexA = this.priorityExtensions.indexOf(extA);
      const indexB = this.priorityExtensions.indexOf(extB);
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
  }

  formatResults(results, searchString) {
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

    return results.map(r => {
      const matchTypePrefix = r.matchType === 'content' ? '' : `${r.matchType} match: `;
      const fuzzyPrefix = r.isFuzzy ? 'fuzzy: ' : '';
      let highlightedLine = r.line;
      
      if (r.isFuzzy) {
        const fuzzyMatch = fuzzysort.single(searchString, r.line);
        if (fuzzyMatch) {
          highlightedLine = highlightFuzzyMatch(fuzzyMatch, '|', '|');
        }
      } else {
        const regex = new RegExp(searchString, 'gi');
        highlightedLine = r.line.replace(regex, '|$&|');
      }
      
      return ` ${r.path}${r.lineNumber ? `:${r.lineNumber}:${r.columnNumber}` : ''} | ${fuzzyPrefix}${matchTypePrefix}${highlightedLine}`;
    });
  }
}

const createInterface = (searcher) => {
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

  const debouncedSearch = debounce(async (value) => {
    resultList.setItems(['Searching...']);
    screen.render();

    try {
      debug(`Searching for "${value} (debounced)"`);
      const results = await searcher.search(value);
      debug(`Found ${results.length} results for "${value}"`);
      
      if (results.length === 0) {
        resultList.setItems(['No results found']);
      } else {
        resultList.setItems(results);
        resultList.select(0);
      }
      
      screen.render();
    } catch (error) {
      debug(`Error during search: ${error}`);
      resultList.setItems(['Error occurred during search']);
      screen.render();
    }
  }, 450);

  inputBox.on('keypress', async (ch, key) => {
    if (['down', 'up', 'enter', 'left', 'right'].includes(key.name)) {
      resultList.emit('keypress', ch, key);
    } else {
      currentSearchTerm = inputBox.getValue() + (ch || '');
      debug(`Current search term: "${currentSearchTerm}"`);
      
      if (key.name !== 'enter') {
        try {
          await debouncedSearch(currentSearchTerm);
        } catch (error) {
          debug(`Error in debounced search: ${error}`);
        }
      }
    }
  });

  resultList.key(['down', 'up'], (ch, key) => {
    if (key.name === 'down') {
      resultList.down();
    } else if (key.name === 'up') {
      resultList.up();
    }
    screen.render();
  });

  resultList.key('enter', () => {
    const selected = resultList.selected;
    if (selected !== undefined) {
      const selectedItem = resultList.getItem(selected);
      debug(`Selected: ${selectedItem.content}`);
      // Here you can implement the action to open the selected file or commit
    }
  });

  screen.render();
  inputBox.focus();

  return { screen, inputBox, resultList, debug };
};

const main = () => {
  const isGitMode = process.argv.includes('-g');
  const searcher = new UnifiedSearcher(isGitMode);

  if (process.argv[2] && process.argv[2] !== '-g') {
    searcher.search(process.argv[2]).then(results => {
      results.forEach(result => console.log(result));
    });
  } else {
    const { screen, debug } = createInterface(searcher);
    debug(`Interface created in ${isGitMode ? 'Git' : 'Filesystem'} mode`);
  }
};

main();