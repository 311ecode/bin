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
      setIsNavigating(true);
      const verseIndex = targetVerse - 1;
      
      const attemptScroll = () => {
        if (scrollToVerse(verseIndex)) {
          setIsNavigating(false);
        } else {
          // Load all verses up to the target verse
          loadMoreItems(0, verseIndex + 1).then(() => {
            setTimeout(attemptScroll, 100); // Retry after a short delay
          });
        }
      };

      attemptScroll();
    }
  }, [targetVerse, scrollToVerse, loadMoreItems]);

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