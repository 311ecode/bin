import { useEffect, useMemo } from "react";
import { debounce } from "./ParallelTranslations";

export function initializeVerseNavigation(translations, visibleModels, setVisibleModels, navigateToVerse, listRef) {
  useEffect(() => {
    if (translations.length > 0 && Object.keys(visibleModels).length === 0) {
      const initialVisibleModels = Object.keys(translations[0].translations)
        .reduce((acc, model) => ({ ...acc, [model]: true }), {});
      setVisibleModels(initialVisibleModels);
    }
  }, [translations]);

  const debouncedHandleScroll = useMemo(() => debounce(() => {
    const currentParams = new URLSearchParams(window.location.search);
    if (currentParams.has('verse')) {
      console.log('Debounced scroll detected, verse param exists');
      currentParams.delete('verse');
      const newUrl = `${window.location.pathname}?${currentParams.toString()}`;
      window.history.replaceState({}, '', newUrl);
      console.log('Removed verse parameter from URL after 5 seconds of inactivity');
    }
  }, 5000),
    []
  );

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const verseParam = urlParams.get('verse');
    if (verseParam) {
      navigateToVerse(parseInt(verseParam, 10));
    }

    const listContainer = listRef.current?._outerRef;
    if (listContainer) {
      listContainer.addEventListener('scroll', debouncedHandleScroll);
    }

    return () => {
      if (listContainer) {
        listContainer.removeEventListener('scroll', debouncedHandleScroll);
      }
    };
  }, [navigateToVerse, debouncedHandleScroll]);
}
