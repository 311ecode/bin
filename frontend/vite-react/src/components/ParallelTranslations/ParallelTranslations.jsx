import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Typography, AppBar, Toolbar, Box, CircularProgress } from '@mui/material';
import { VariableSizeList as List } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';
import InfiniteLoader from 'react-window-infinite-loader';
import useTranslations from '../../hooks/useTranslations';
import { useVerseNavigation } from '../../hooks/useVerseNavigation';
import { initializeVerseNavigation } from './initializeVerseNavigation';
import { generateParallelTranslationComponents } from './generateParallelTranslationComponents';
import VerseVisibilityTracker from '../VerseVisibilityTracker';

export const debounce = (func, delay) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

const ParallelTranslations = ({ executionGroup }) => {
  const [visibleModels, setVisibleModels] = useState({});
  const listRef = useRef();
  const rowHeights = useRef({});

  const { 
    translations, 
    error, 
    totalItems, 
    isLoading, 
    loadMoreItems, 
    isItemLoaded,
    updateExtraData 
  } = useTranslations(executionGroup);

  const { targetVerse, navigateToVerse, isNavigating } = useVerseNavigation(
    listRef,
    translations,
    isItemLoaded,
    loadMoreItems,
    totalItems
  );

  const handleVisibleVerseChange = useCallback((verseNumber) => {
    console.log(`Verse ${verseNumber} is now visible`);
    // Add any additional logic here if needed
  }, []);

  // useEffect(() => {
  //   const lastVisibleVerse = localStorage.getItem('lastVisibleVerse');
  //   if (lastVisibleVerse) {
  //     navigateToVerse(parseInt(lastVisibleVerse, 10));
  //   }
  // }, [navigateToVerse]);

  initializeVerseNavigation(translations, visibleModels, setVisibleModels, navigateToVerse, listRef);

  const { memoizedModelVisibilityControls, memoizedVerseNavigation, getItemSize, renderVerse } = 
    generateParallelTranslationComponents(setVisibleModels, listRef, rowHeights, updateExtraData, translations, visibleModels, targetVerse, navigateToVerse, totalItems);

  const handleItemsRendered = useCallback(({ visibleStartIndex, visibleStopIndex }) => {
    handleVisibleVerseChange(Math.floor((visibleStartIndex + visibleStopIndex) / 2) + 1);
  }, [handleVisibleVerseChange]);

  if (error) return <Typography color="error">{error}</Typography>;
  if (isLoading && translations.length === 0) return <Typography>Loading...</Typography>;

  return (
    <Box sx={{ height: '100vh', width: '100vw', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <AppBar position="sticky" color="default">
        <Toolbar sx={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {memoizedModelVisibilityControls}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {isNavigating && <CircularProgress size={24} />}
            {memoizedVerseNavigation}
          </Box>
        </Toolbar>
      </AppBar>
      <Box sx={{ flexGrow: 1, width: '100%', overflow: 'hidden', paddingRight: '20px' }}>
        <AutoSizer>
          {({ height, width }) => (
            <InfiniteLoader
              isItemLoaded={isItemLoaded}
              itemCount={totalItems}
              loadMoreItems={loadMoreItems}
            >
              {({ onItemsRendered, ref }) => (
                <List
                  height={height}
                  itemCount={totalItems}
                  itemSize={getItemSize}
                  onItemsRendered={(props) => {
                    onItemsRendered(props);
                    handleItemsRendered(props);
                  }}
                  ref={(list) => {
                    ref(list);
                    listRef.current = list;
                  }}
                  width={width - 20}
                  overscanCount={5}
                >
                  {renderVerse}
                </List>
              )}
            </InfiniteLoader>
          )}
        </AutoSizer>
      </Box>
      <VerseVisibilityTracker onVisibleRangeChange={handleVisibleVerseChange} />
    </Box>
  );
};

export default ParallelTranslations;