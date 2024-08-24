// src/components/ParallelTranslations/initializeVerseNavigation.jsx

import { useEffect } from "react";

export function initializeVerseNavigation(translations, visibleModels, setVisibleModels, navigateToVerse) {
  useEffect(() => {
    if (translations.length > 0 && Object.keys(visibleModels).length === 0) {
      const initialVisibleModels = Object.keys(translations[0].translations)
        .reduce((acc, model) => ({ ...acc, [model]: true }), {});
      setVisibleModels(initialVisibleModels);
    }
  }, [translations, visibleModels, setVisibleModels]);

  useEffect(() => {
    const lastVisibleVerse = localStorage.getItem('lastVisibleVerse');
    if (lastVisibleVerse) {
      navigateToVerse(parseInt(lastVisibleVerse, 10));
    }
  }, [navigateToVerse]);
}