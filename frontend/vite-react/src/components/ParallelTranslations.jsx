import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Typography, AppBar, Toolbar, Box, useMediaQuery, useTheme } from '@mui/material';
import { VariableSizeList as List } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';
import InfiniteLoader from 'react-window-infinite-loader';
import VerseItem from './VerseItem';
import ModelVisibilityControls from './ModelVisibilityControls';
import VerseNavigation from './VerseNavigation';
import useTranslations from '../hooks/useTranslations';

const ParallelTranslations = ({ executionGroup }) => {
  const [visibleModels, setVisibleModels] = useState({});
  const [initialVerse, setInitialVerse] = useState(null);
  const listRef = useRef();
  const rowHeights = useRef({});
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const { 
    translations, 
    error, 
    totalItems, 
    isLoading, 
    loadMoreItems, 
    isItemLoaded 
  } = useTranslations(executionGroup);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const verse = parseInt(urlParams.get('verse'));
    if (!isNaN(verse) && verse > 0) {
      setInitialVerse(verse - 1); // Adjust for zero-based index
    }
  }, []);

  useEffect(() => {
    if (translations.length > 0 && Object.keys(visibleModels).length === 0) {
      const initialVisibleModels = Object.keys(translations[0].translations)
        .reduce((acc, model) => ({ ...acc, [model]: true }), {});
      setVisibleModels(initialVisibleModels);
    }
  }, [translations, visibleModels]);

  useEffect(() => {
    if (initialVerse !== null && listRef.current) {
      scrollToVerseWithContext(initialVerse);
    }
  }, [initialVerse, translations]);

  const handleModelToggle = (model) => {
    setVisibleModels(prev => {
      const newVisibleModels = { ...prev, [model]: !prev[model] };
      setTimeout(() => {
        if (listRef.current) {
          listRef.current.resetAfterIndex(0);
        }
      }, 0);
      return newVisibleModels;
    });
  };

  const getItemSize = index => rowHeights.current[index] || 100;

  const setRowHeight = useCallback((index, size) => {
    if (rowHeights.current[index] !== size) {
      rowHeights.current[index] = size;
      if (listRef.current) {
        listRef.current.resetAfterIndex(index);
      }
    }
  }, []);

  const renderVerse = useCallback(({ index, style }) => (
    <VerseItem
      verse={translations[index]}
      index={index}
      style={style}
      visibleModels={visibleModels}
      setRowHeight={setRowHeight}
    />
  ), [translations, visibleModels, setRowHeight]);

  const scrollToVerseWithContext = useCallback((verseIndex) => {
    if (listRef.current) {
      const list = listRef.current;
      const totalHeight = list.props.height;
      let accumulatedHeight = 0;
      let targetOffset = 0;

      // Calculate the offset to center the target verse
      for (let i = 0; i < verseIndex; i++) {
        accumulatedHeight += getItemSize(i);
      }
      targetOffset = accumulatedHeight - (totalHeight / 2) + (getItemSize(verseIndex) / 2);

      // Ensure we don't scroll past the start or end of the list
      targetOffset = Math.max(0, Math.min(targetOffset, list.props.itemCount * getItemSize(0) - totalHeight));

      list.scrollTo(targetOffset);
    }
  }, [getItemSize]);

  const handleVerseNavigation = useCallback((verse) => {
    const verseIndex = verse - 1; // Convert to 0-based index
    scrollToVerseWithContext(verseIndex);
  }, [scrollToVerseWithContext]);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.resetAfterIndex(0);
    }
  }, [isMobile]);

  if (error) return <Typography color="error">{error}</Typography>;
  if (isLoading && translations.length === 0) return <Typography>Loading...</Typography>;

  return (
    <Box sx={{ height: '100vh', width: '100vw', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <AppBar position="sticky" color="default">
        <Toolbar sx={{ width: '100%', display: 'flex', justifyContent: 'space-between' }}>
          <ModelVisibilityControls visibleModels={visibleModels} onModelToggle={handleModelToggle} />
          <VerseNavigation onNavigate={handleVerseNavigation} totalVerses={totalItems} />
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
                  onItemsRendered={onItemsRendered}
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
    </Box>
  );
};

export default ParallelTranslations;