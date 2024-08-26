// jfzj2/filesystemSearcher.js
import fs from 'fs/promises';
import path from 'path';
import ignore from 'ignore';
import fuzzysort from 'fuzzysort';

export class FilesystemSearcher {
  constructor() {
    this.priorityExtensions = ['.js', '.mjs', '.ts', '.jsx', '.tsx'];
  }

  async search(searchString, options = {}) {
    const { dir = process.cwd(), maxResults = 100 } = options;
    if (!searchString.trim()) return [];

    const ignoreFilter = await this.getIgnoreFilter(dir);
    const exactResults = [];
    const fuzzyResults = [];

    await this.searchRecursively(dir, dir, searchString, ignoreFilter, exactResults, fuzzyResults);

    const allResults = [...exactResults, ...fuzzyResults];
    allResults.sort(this.sortResults);

    return allResults;
  }

  async getIgnoreFilter(dir) {
    try {
      const gitignoreContent = await fs.readFile(path.join(dir, '.gitignore'), 'utf8');
      return ignore().add(gitignoreContent + '\n.git\nnode_modules\npackage-lock.json');
    } catch (error) {
      return ignore();
    }
  }

  async searchRecursively(baseDir, currentDir, searchString, ignoreFilter, exactResults, fuzzyResults) {
    const files = await fs.readdir(currentDir);

    for (const file of files) {
      const filePath = path.join(currentDir, file);
      const relativePath = path.relative(baseDir, filePath);

      if (ignoreFilter.ignores(relativePath)) continue;

      const stat = await fs.stat(filePath);

      if (stat.isDirectory()) {
        await this.searchRecursively(baseDir, filePath, searchString, ignoreFilter, exactResults, fuzzyResults);
      } else if (stat.isFile()) {
        const fileExt = path.extname(file);
        if (this.priorityExtensions.includes(fileExt)) {
          await this.searchInFile(filePath, searchString, relativePath, exactResults, fuzzyResults);
        }
        
        this.checkFileNameMatch(file, relativePath, searchString, exactResults, fuzzyResults);
      }
    }
  }

  async searchInFile(filePath, searchString, relativePath, exactResults, fuzzyResults) {
    const fileContent = await fs.readFile(filePath, 'utf8');
    const lines = fileContent.split('\n');

    lines.forEach((line, index) => {
      const matchResult = this.findBestMatch(line, searchString);
      if (matchResult) {
        const result = {
          path: relativePath,
          lineNumber: index + 1,
          columnNumber: matchResult.index + 1,
          line: line.trim(),
          depth: relativePath.split(path.sep).length,
          matchType: 'content',
          matchScore: matchResult.score,
          matchKind: matchResult.kind
        };
        
        if (matchResult.kind === 'fuzzy') {
          fuzzyResults.push(result);
        } else {
          exactResults.push(result);
        }
      }
    });
  }

  findBestMatch(text, searchString) {
    const lowerText = text.toLowerCase();
    const lowerSearch = searchString.toLowerCase();

    // Exact match
    const exactIndex = lowerText.indexOf(lowerSearch);
    if (exactIndex !== -1) {
      return { kind: 'exact', score: 1000, index: exactIndex };
    }

    // Word match
    const wordRegex = new RegExp(`\\b${this.escapeRegExp(lowerSearch)}\\b`, 'i');
    const wordMatch = text.match(wordRegex);
    if (wordMatch) {
      return { kind: 'word', score: 900, index: wordMatch.index };
    }

    // Subword match
    const subwordIndex = lowerText.indexOf(lowerSearch);
    if (subwordIndex !== -1) {
      return { kind: 'subword', score: 800, index: subwordIndex };
    }

    // Fuzzy match
    const fuzzyMatch = fuzzysort.single(searchString, text);
    if (fuzzyMatch && fuzzyMatch.score > -5000) {
      return { kind: 'fuzzy', score: fuzzyMatch.score, index: fuzzyMatch.indexes[0] };
    }

    return null;
  }

  escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  checkFileNameMatch(file, relativePath, searchString, exactResults, fuzzyResults) {
    const matchResult = this.findBestMatch(file, searchString);
    if (matchResult) {
      const result = {
        path: relativePath,
        lineNumber: 0,
        columnNumber: 0,
        line: `File match: ${file}`,
        depth: relativePath.split(path.sep).length,
        matchType: 'filename',
        matchScore: matchResult.score,
        matchKind: matchResult.kind
      };
      
      if (matchResult.kind === 'fuzzy') {
        fuzzyResults.push(result);
      } else {
        exactResults.push(result);
      }
    }
  }

  sortResults = (a, b) => {
    // Priority 0: Match kind (exact > word > subword > fuzzy)
    const matchKindOrder = { exact: 0, word: 1, subword: 2, fuzzy: 3 };
    if (a.matchKind !== b.matchKind) {
      return matchKindOrder[a.matchKind] - matchKindOrder[b.matchKind];
    }

    // Priority 1: Match score
    if (a.matchScore !== b.matchScore) {
      return b.matchScore - a.matchScore;
    }

    // Priority 2: Files closest to pwd
    if (a.depth !== b.depth) return a.depth - b.depth;

    // Priority 3: File extension (for filename/path matches)
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

    // Priority 4: Filename over path (for filename/path matches)
    if (a.matchType !== 'content' && b.matchType !== 'content') {
      if (a.matchType !== b.matchType) {
        return a.matchType === 'filename' ? -1 : 1;
      }
    }

    // Priority 5: Content matches over filename/path matches
    if (a.matchType !== b.matchType) {
      return a.matchType === 'content' ? -1 : 1;
    }

    // Priority 6: Position within file (for content matches)
    if (a.lineNumber !== b.lineNumber) return a.lineNumber - b.lineNumber;
    if (a.columnNumber !== b.columnNumber) return a.columnNumber - b.columnNumber;

    // If all else is equal, sort alphabetically by path
    return a.path.localeCompare(b.path);
  }

  formatResults(results, searchString) {
    return results.map(r => {
      const locationInfo = r.lineNumber ? `:${r.lineNumber}:${r.columnNumber}` : '';
      const formattedPath = `./${r.path}${locationInfo}`;
      
      let highlightedLine = r.line;
      if (r.matchKind === 'fuzzy') {
        const fuzzyMatch = fuzzysort.single(searchString, r.line);
        if (fuzzyMatch) {
          highlightedLine = this.highlightFuzzyMatch(fuzzyMatch, '|', '|');
        }
      } else {
        const regex = new RegExp(this.escapeRegExp(searchString), 'gi');
        highlightedLine = r.line.replace(regex, '|$&|');
      }
      
      return `${formattedPath} | ${highlightedLine}`;
    });
  }
  
  highlightFuzzyMatch(result, highlightOpen, highlightClose) {
    if (!result || !result.target) return result.target;
    let highlighted = '';
    let lastIndex = 0;
    for (const index of result.indexes) {
      highlighted += result.target.slice(lastIndex, index) + highlightOpen + result.target[index] + highlightClose;
      lastIndex = index + 1;
    }
    highlighted += result.target.slice(lastIndex);
    return highlighted;
  }
}