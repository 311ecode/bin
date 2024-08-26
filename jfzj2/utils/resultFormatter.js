// New file: jfzj2/utils/resultFormatter.js

import fuzzysort from 'fuzzysort';

export function formatSearchResults(results, searchString) {
  return results.map(r => {
    let formattedPath;
    if (r.matchType === 'commit') {
      formattedPath = r.path; // This is already the short hash
    } else {
      const locationInfo = r.lineNumber ? `:${r.lineNumber}:${r.columnNumber}` : '';
      formattedPath = `${r.path}${locationInfo}`;
    }
    
    let highlightedLine = r.line;
    if (r.matchKind === 'fuzzy') {
      const fuzzyMatch = fuzzysort.single(searchString, r.line);
      if (fuzzyMatch) {
        highlightedLine = highlightFuzzyMatch(fuzzyMatch, '|', '|');
      }
    } else {
      const regex = new RegExp(escapeRegExp(searchString), 'gi');
      highlightedLine = r.line.replace(regex, '|$&|');
    }
    
    const matchKindLabel = `+${r.matchKind}+`;
    
    return `${formattedPath} | ${matchKindLabel} ${highlightedLine}`;
  });
}

function highlightFuzzyMatch(result, highlightOpen, highlightClose) {
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

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}