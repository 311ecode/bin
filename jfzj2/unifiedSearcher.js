// jfzj2/unifiedSearcher.js
import { GitSearcher } from './gitSearcher.js';
import { FilesystemSearcher } from './filesystemSearcher.js';

export class UnifiedSearcher {
  constructor(isGitMode = false) {
    this.searcher = isGitMode ? new GitSearcher() : new FilesystemSearcher();
  }

  async search(searchString, options = {}) {
    const results = await this.searcher.search(searchString, options);
    return this.searcher.formatResults(results, searchString);
  }

  formatResults(results, searchString) {
    return this.searcher.formatResults(results, searchString);
  }
}