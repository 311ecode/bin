import { useState, useEffect, useCallback } from 'react';

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
      const url = new URL(window.location);
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