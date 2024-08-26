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

class UnifiedSearcher {
  constructor(isGitMode = false) {
    this.isGitMode = isGitMode;
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
    const ignoreFilter = await this.getIgnoreFilter(dir);
    const results = [];

    for await (const file of this.walkDirectory(dir, ignoreFilter)) {
      if (results.length >= maxResults) break;

      const content = await this.readFileContent(file.path);
      const lines = content.split('\n');

      for (let i = 0; i < lines.length; i++) {
        if (lines[i].toLowerCase().includes(searchString.toLowerCase())) {
          results.push({
            path: file.relativePath,
            line: i + 1,
            content: lines[i].trim(),
            type: 'file'
          });

          if (results.length >= maxResults) break;
        }
      }
    }

    return results;
  }

  async searchGitLog(searchString, options = {}) {
    const { maxResults = 100 } = options;
    const command = `git log --pretty=format:"%h|%an|%ad|%s" --date=short -n ${maxResults * 2}`; // Fetch more to filter
    const { stdout } = await execAsync(command);
    
    const commits = stdout.split('\n').map(line => {
      const [hash, author, date, subject] = line.split('|');
      return { hash, author, date, subject };
    });

    const results = commits
      .filter(commit => 
        commit.subject.toLowerCase().includes(searchString.toLowerCase()) ||
        commit.author.toLowerCase().includes(searchString.toLowerCase())
      )
      .slice(0, maxResults)
      .map(commit => ({
        path: commit.hash,
        line: 0,
        content: `${commit.date} - ${commit.author}: ${commit.subject}`,
        type: 'commit'
      }));

    return results;
  }

  async getIgnoreFilter(dir) {
    try {
      const gitignoreContent = await fs.readFile(path.join(dir, '.gitignore'), 'utf8');
      return ignore().add(gitignoreContent + '\n.git\nnode_modules\npackage-lock.json');
    } catch (error) {
      return ignore();
    }
  }

  async *walkDirectory(dir, ignoreFilter) {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      const relativePath = path.relative(dir, fullPath);
      
      if (ignoreFilter.ignores(relativePath)) continue;

      if (entry.isDirectory()) {
        yield* this.walkDirectory(fullPath, ignoreFilter);
      } else if (entry.isFile()) {
        yield { path: fullPath, relativePath };
      }
    }
  }

  async readFileContent(filePath) {
    return await fs.readFile(filePath, 'utf8');
  }
}

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
      const results = await searcher.search(value);
      debug(`Found ${results.length} results for "${value}"`);
      
      if (results.length === 0) {
        resultList.setItems(['No results found']);
      } else {
        const formattedResults = results.map(r => 
          `${r.path}${r.line ? `:${r.line}` : ''} | ${r.type}: ${r.content}`
        );
        resultList.setItems(formattedResults);
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
      results.forEach(result => console.log(`${result.path}:${result.line} | ${result.type}: ${result.content}`));
    });
  } else {
    const { screen, debug } = createInterface(searcher);
    debug(`Interface created in ${isGitMode ? 'Git' : 'Filesystem'} mode`);
  }
};

main();