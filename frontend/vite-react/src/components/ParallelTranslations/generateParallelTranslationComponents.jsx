import React, { useCallback, useMemo } from 'react';
import VerseItem from '../VerseItem/VerseItem';
import ModelVisibilityControls from '../ModelVisibilityControls';
import VerseNavigation from '../VerseNavigation';

export function generateParallelTranslationComponents(setVisibleModels, listRef, rowHeights, updateExtraData, translations, visibleModels, targetVerse, navigateToVerse, totalItems) {
  const handleModelToggle = useCallback((model) => {
    setVisibleModels(prev => {
      const newVisibleModels = { ...prev, [model]: !prev[model] };
      if (listRef.current) {
        listRef.current.resetAfterIndex(0);
      }
      return newVisibleModels;
    });
  }, []);

  const setRowHeight = useCallback((index, size) => {
    rowHeights.current[index] = size;
    if (listRef.current) {
      listRef.current.resetAfterIndex(index);
    }
  }, []);

  const getItemSize = useCallback((index) => rowHeights.current[index] || 100, []);

  const handleUpdateExtraData = useCallback((verseNumber, extraData) => {
    updateExtraData(verseNumber, extraData);
    if (listRef.current) {
      const index = translations.findIndex(t => t.verse === verseNumber);
      if (index !== -1) {
        listRef.current.resetAfterIndex(index);
      }
    }
  }, [updateExtraData, translations]);

  const renderVerse = useCallback(({ index, style }) => (
    <VerseItem
      key={`verse-${translations[index].verse}`}
      verse={translations[index]}
      index={index}
      style={style}
      visibleModels={visibleModels}
      setRowHeight={setRowHeight}
      isTargeted={index === targetVerse - 1}
      onUpdateExtraData={handleUpdateExtraData} />
  ), [translations, visibleModels, setRowHeight, targetVerse, handleUpdateExtraData]);

  const memoizedModelVisibilityControls = useMemo(() => (
    <ModelVisibilityControls visibleModels={visibleModels} onModelToggle={handleModelToggle} />
  ), [visibleModels, handleModelToggle]);

  const memoizedVerseNavigation = useMemo(() => (
    <VerseNavigation onNavigate={navigateToVerse} totalVerses={totalItems} />
  ), [navigateToVerse, totalItems]);
  return { memoizedModelVisibilityControls, memoizedVerseNavigation, getItemSize, renderVerse };
}


