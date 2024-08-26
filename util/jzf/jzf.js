// jfzj2.js
import { UnifiedSearcher } from './jfzj2/unifiedSearcher.js';
import { createInterface } from './jfzj2/userInterface.js';

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

const main = () => {
  const isGitMode = process.argv.includes('-g');
  const searcher = new UnifiedSearcher(isGitMode);

  if (process.argv[2] && process.argv[2] !== '-g') {
    searcher.search(process.argv[2]).then(results => {
      results.forEach(result => console.log(result));
    });
  } else {
    const debouncedSearch = debounce(searcher.search.bind(searcher), 450);
    const { screen, debug } = createInterface(debouncedSearch, console.log);
    debug(`Interface created in ${isGitMode ? 'Git' : 'Filesystem'} mode`);
  }
};

main();