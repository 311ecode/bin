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
  const [targetVerse, setTargetVerse] = useState(null);
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
      setTargetVerse(verse);
    }
  }, []);

  useEffect(() => {
    if (translations.length > 0 && Object.keys(visibleModels).length === 0) {
      const initialVisibleModels = Object.keys(translations[0].translations)
        .reduce((acc, model) => ({ ...acc, [model]: true }), {});
      setVisibleModels(initialVisibleModels);
    }
  }, [translations]);

  const scrollToVerseWithContext = useCallback((verseIndex) => {
    if (listRef.current) {
      const list = listRef.current;
      const totalHeight = list.props.height;
      let accumulatedHeight = 0;
      let targetOffset = 0;

      for (let i = 0; i < verseIndex; i++) {
        accumulatedHeight += rowHeights.current[i] || 100;
      }
      targetOffset = accumulatedHeight - (totalHeight / 2) + ((rowHeights.current[verseIndex] || 100) / 2);
      targetOffset = Math.max(0, Math.min(targetOffset, list.props.itemCount * 100 - totalHeight));

      list.scrollTo(targetOffset);
      return true;
    }
    return false;
  }, []);

  useEffect(() => {
    if (targetVerse !== null && translations.length > 0) {
      const verseIndex = targetVerse - 1;
      let attempts = 0;
      const maxAttempts = 50; // Adjust as needed

      const attemptScroll = () => {
        if (attempts >= maxAttempts) {
          console.error('Failed to scroll to verse after maximum attempts');
          return;
        }

        if (isItemLoaded(verseIndex)) {
          const success = scrollToVerseWithContext(verseIndex);
          if (success) {
            return;
          }
        } else {
          loadMoreItems(verseIndex, verseIndex + 20);
        }

        attempts++;
        setTimeout(attemptScroll, 100);
      };

      attemptScroll();
    }
  }, [targetVerse, translations, isItemLoaded, loadMoreItems, scrollToVerseWithContext]);

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
    if (rowHeights.current[index] !== size) {
      rowHeights.current[index] = size;
      if (listRef.current) {
        listRef.current.resetAfterIndex(index);
      }
    }
  }, []);

  const handleVerseNavigation = useCallback((verse) => {
    setTargetVerse(verse);
  }, []);

  const renderVerse = useCallback(({ index, style }) => (
    <VerseItem
      verse={translations[index]}
      index={index}
      style={style}
      visibleModels={visibleModels}
      setRowHeight={setRowHeight}
      isTargeted={index === targetVerse - 1}
    />
  ), [translations, visibleModels, setRowHeight, targetVerse]);

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
                  itemSize={(index) => rowHeights.current[index] || 100}
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