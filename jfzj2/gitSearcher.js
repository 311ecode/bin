import { exec } from 'child_process';
import { promisify } from 'util';
import fuzzysort from 'fuzzysort';
import path from 'path';
import { formatSearchResults } from './utils/resultFormatter.js';

const execAsync = promisify(exec);

export class GitSearcher {
  constructor() {
    this.priorityExtensions = ['.js', '.mjs', '.ts', '.jsx', '.tsx', '.sh'];
  }

  async search(searchString, options = {}) {
    const { maxResults = 100 } = options;
    const command = `git log --pretty=format:"%H|%h|%an|%ad|%s" --date=short -n ${maxResults * 2}`;
    const { stdout } = await execAsync(command);
    
    const commits = stdout.split('\n').map(line => {
      const [fullHash, shortHash, author, date, subject] = line.split('|');
      return { fullHash, shortHash, author, date, subject };
    });
  
    const exactResults = [];
    const fuzzyResults = [];
    const latestContentLines = new Map();
  
    const isCommitHash = /^[0-9a-f]{4,40}$/.test(searchString);
  
    for (const commit of commits) {
      if (isCommitHash) {
        if (commit.fullHash.startsWith(searchString) || commit.shortHash.startsWith(searchString)) {
          exactResults.push(this.createCommitResult(commit, commits.indexOf(commit), 'exact'));
        }
      } else {
        const matchResult = this.findBestMatch(`${commit.subject} ${commit.author}`, searchString);
        if (matchResult) {
          const result = this.createCommitResult(commit, commits.indexOf(commit), matchResult.kind, matchResult.score);
          
          if (matchResult.kind === 'fuzzy') {
            fuzzyResults.push(result);
          } else {
            exactResults.push(result);
          }
        }
      }
  
      if (!isCommitHash) {
        await this.searchCommitContent(commit, searchString, latestContentLines);
      }
    }
  
    for (const result of latestContentLines.values()) {
      if (result.matchKind === 'fuzzy') {
        fuzzyResults.push(result);
      } else {
        exactResults.push(result);
      }
    }
  
    const allResults = [...exactResults, ...fuzzyResults];
    allResults.sort((a, b) => this.sortResults(a, b));
  
    return allResults.slice(0, maxResults);
  }


  async searchCommitContent(commit, searchString, latestContentLines) {
    try {
      const { stdout: diffOutput } = await execAsync(`git diff-tree -r --no-commit-id --name-only ${commit.fullHash}`);
      const changedFiles = diffOutput.trim().split('\n');

      for (const file of changedFiles) {
        try {
          const { stdout: fileChanges } = await execAsync(`git show ${commit.fullHash} -- ${file}`);
          const lines = fileChanges.split('\n');

          lines.forEach((line, index) => {
            if (line.startsWith('+') && !line.startsWith('+++')) {
              const contentLine = line.slice(1);
              const lineKey = `${file}:${contentLine}`;
              
              const matchResult = this.findBestMatch(contentLine, searchString);
              if (matchResult) {
                const result = {
                  path: `${commit.shortHash}:${file}`,
                  lineNumber: index + 1,
                  columnNumber: matchResult.index + 1,
                  line: contentLine.trim(),
                  depth: 0,
                  matchType: 'content',
                  matchKind: matchResult.kind,
                  matchScore: matchResult.score
                };
                latestContentLines.set(lineKey, result);
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

  createCommitResult(commit, depth, matchKind, matchScore = 1000) {
    return {
      path: commit.shortHash,
      lineNumber: 0,
      columnNumber: 0,
      line: `commit: ${commit.subject}`,
      depth: depth,
      matchType: 'commit',
      matchKind: matchKind,
      matchScore: matchScore,
      commitDetails: `${commit.date} - ${commit.author}: ${commit.subject}`
    };
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


  sortResults(a, b) {
    // Priority 0: Match kind (exact > word > subword > fuzzy)
    const matchKindOrder = { exact: 0, word: 1, subword: 2, fuzzy: 3 };
    if (a.matchKind !== b.matchKind) {
      return matchKindOrder[a.matchKind] - matchKindOrder[b.matchKind];
    }

    // Priority 1: Match score
    if (a.matchScore !== b.matchScore) {
      return b.matchScore - a.matchScore;
    }

    // Priority 2: Commit depth (more recent commits first)
    if (a.depth !== b.depth) return a.depth - b.depth;

    // Priority 3: File extension (priority extensions first)
    if (a.path && b.path) {
      const extA = path.extname(a.path);
      const extB = path.extname(b.path);
      const isPriorityA = this.priorityExtensions.includes(extA);
      const isPriorityB = this.priorityExtensions.includes(extB);
      if (isPriorityA !== isPriorityB) {
        return isPriorityA ? -1 : 1;
      }
    }

    // Priority 4: Content matches over commit matches
    if (a.matchType !== b.matchType) {
      return a.matchType === 'content' ? -1 : 1;
    }

    // Priority 5: Position within file (for content matches)
    if (a.lineNumber !== b.lineNumber) return a.lineNumber - b.lineNumber;
    if (a.columnNumber !== b.columnNumber) return a.columnNumber - b.columnNumber;

    // If all else is equal, sort alphabetically by path
    return (a.path || '').localeCompare(b.path || '');
  }

  formatResults(results, searchString) {
    return formatSearchResults(results, searchString);
  }

  // ... [keep other methods unchanged]
}