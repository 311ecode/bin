import { useState, useEffect, useCallback } from 'react';

/**
 * @typedef {import('@api/configurationProcessor/apiRoutes/translationsByExecutionGroupsRoute.mjs').VerseTranslation} VerseTranslation
 */

/**
 * @typedef {(startIndex: number, stopIndex: number) => Promise<void>} LoadMoreItemsFunction
 */

/**
 * Custom hook for verse navigation
 * @param {React.RefObject<any>} listRef - Reference to the list component
 * @param {VerseTranslation[]} translations - Array of verse translations
 * @param {(index: number) => boolean} isItemLoaded - Function to check if an item is loaded
 * @param {LoadMoreItemsFunction} loadMoreItems - Function to load more items
 * @param {number} totalItems - Total number of items
 * @returns {Object} An object containing verse navigation state and functions
 */
export const useVerseNavigation = (listRef, translations, isItemLoaded, loadMoreItems, totalItems) => {
  const [targetVerse, setTargetVerse] = useState(null);
  const [isNavigating, setIsNavigating] = useState(false);

  const scrollToVerse = useCallback((verseIndex) => {
    if (listRef.current && isItemLoaded(verseIndex)) {
      listRef.current.scrollToItem(verseIndex, 'center');
      return true;
    }
    return false;
  }, [listRef, isItemLoaded]);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const verse = parseInt(urlParams.get('verse'));
    if (!isNaN(verse) && verse > 0 && verse <= totalItems) {
      setTargetVerse(verse);
    }
  }, [totalItems]);

  useEffect(() => {
    if (targetVerse !== null) {
      console.log(`Attempting to navigate to verse ${targetVerse}`);
      setIsNavigating(true);
      const verseIndex = targetVerse - 1;
      
      const attemptScroll = () => {
        console.log(`Attempting to scroll to verse index ${verseIndex}`);
        if (scrollToVerse(verseIndex)) {
          console.log(`Successfully scrolled to verse ${targetVerse}`);
          setIsNavigating(false);
        } else {
          console.log(`Verse ${targetVerse} not loaded, loading more items`);
          const chunkSize = Math.max(100, translations.length);
          const startIndex = Math.floor(verseIndex / chunkSize) * chunkSize;
          const endIndex = Math.min(startIndex + chunkSize, totalItems);

          console.log(`Loading verses from ${startIndex} to ${endIndex}`);
          loadMoreItems(startIndex, endIndex).then(() => {
            if (isItemLoaded(verseIndex)) {
              console.log(`Verse ${targetVerse} now loaded, scrolling`);
              scrollToVerse(verseIndex);
              setIsNavigating(false);
            } else {
              console.log(`Verse ${targetVerse} still not loaded, retrying`);
              setTimeout(attemptScroll, 100);
            }
          });
        }
      };

      attemptScroll();
    }
  }, [targetVerse, scrollToVerse, loadMoreItems, isItemLoaded, translations, totalItems]);

  const navigateToVerse = useCallback((verse) => {
    if (verse !== targetVerse && verse > 0 && verse <= totalItems) {
      setTargetVerse(verse);
      const url = new URL(window.location.href);
      url.searchParams.set('verse', verse);
      window.history.pushState({}, '', url);
    }
  }, [targetVerse, totalItems]);

  return {
    targetVerse,
    navigateToVerse,
    isNavigating
  };
};