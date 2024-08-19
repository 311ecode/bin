import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Typography, AppBar, Toolbar, Box, useMediaQuery, useTheme, CircularProgress } from '@mui/material';
import { VariableSizeList as List } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';
import InfiniteLoader from 'react-window-infinite-loader';
import VerseItem from './VerseItem';
import ModelVisibilityControls from './ModelVisibilityControls';
import VerseNavigation from './VerseNavigation';
import useTranslations from '../hooks/useTranslations';
import { useVerseNavigation } from '../hooks/useVerseNavigation';

const ParallelTranslations = ({ executionGroup }) => {
  const [visibleModels, setVisibleModels] = useState({});
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

  const { targetVerse, navigateToVerse, isNavigating } = useVerseNavigation(
    listRef,
    translations,
    isItemLoaded,
    loadMoreItems,
    totalItems
  );

  useEffect(() => {
    if (translations.length > 0 && Object.keys(visibleModels).length === 0) {
      const initialVisibleModels = Object.keys(translations[0].translations)
        .reduce((acc, model) => ({ ...acc, [model]: true }), {});
      setVisibleModels(initialVisibleModels);
    }
  }, [translations]);

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
        <Toolbar sx={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <ModelVisibilityControls visibleModels={visibleModels} onModelToggle={handleModelToggle} />
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {isNavigating && <CircularProgress size={24} />}
            <VerseNavigation onNavigate={navigateToVerse} totalVerses={totalItems} />
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