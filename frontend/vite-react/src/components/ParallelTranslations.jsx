import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Typography, AppBar, Toolbar, FormGroup, FormControlLabel, Checkbox, Box, Paper, Grid
} from '@mui/material';
import { VariableSizeList as List } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';
import InfiniteLoader from 'react-window-infinite-loader';

const ParallelTranslations = ({ executionGroup }) => {
  const [translations, setTranslations] = useState([]);
  const [error, setError] = useState(null);
  const [visibleModels, setVisibleModels] = useState({});
  const [totalItems, setTotalItems] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const listRef = useRef();
  const rowHeights = useRef({});

  const CHUNK_SIZE = 100;

  useEffect(() => {
    loadMoreItems(0, CHUNK_SIZE - 1);
  }, [executionGroup]);

  const loadMoreItems = (startIndex, stopIndex) => {
    setIsLoading(true);
    return fetch(`http://localhost:33333/translations/${executionGroup}?start=${startIndex}&end=${stopIndex}`)
      .then(response => {
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return response.json();
      })
      .then(data => {
        if (data && data.length > 0 && data[0].translations) {
          setTranslations(prevTranslations => {
            const newTranslations = [...prevTranslations];
            data[0].translations.forEach((item, index) => {
              newTranslations[startIndex + index] = item;
            });
            return newTranslations;
          });
          if (totalItems === 0) {
            setTotalItems(data[0].totalVerses || data[0].translations.length);
            const initialVisibleModels = Object.keys(data[0].translations[0].translations)
              .reduce((acc, model) => ({ ...acc, [model]: true }), {});
            setVisibleModels(initialVisibleModels);
          }
          setTimeout(() => {
            if (listRef.current) {
              listRef.current.resetAfterIndex(0);
            }
          }, 0);
        } else {
          setError('Received unexpected data structure from the server');
        }
        setIsLoading(false);
      })
      .catch(error => {
        console.error('Error fetching translations:', error);
        setError(`Failed to fetch translations: ${error.message}`);
        setIsLoading(false);
      });
  };

  const isItemLoaded = index => !!translations[index];

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

  const getItemSize = index => {
    return rowHeights.current[index] || 100; // Default height
  };

  const setRowHeight = useCallback((index, size) => {
    if (rowHeights.current[index] !== size) {
      rowHeights.current[index] = size;
      if (listRef.current) {
        listRef.current.resetAfterIndex(index);
      }
    }
  }, []);

  const renderVerse = useCallback(({ index, style }) => {
    const verse = translations[index];
    if (!verse) {
      return <div style={style}>Loading verse {index + 1}...</div>;
    }

    const models = Object.keys(visibleModels).filter(model => visibleModels[model]);

    return (
      <div style={{ ...style, height: 'auto', width: '100%' }} ref={el => {
        if (el && el.getBoundingClientRect().height > 0) {
          setRowHeight(index, el.getBoundingClientRect().height);
        }
      }}>
        <Paper 
          elevation={3} 
          sx={{ 
            p: 2, 
            backgroundColor: index % 2 ? '#f5f5f5' : 'inherit',
            width: '100%',
          }}
        >
          <Typography variant="h6" gutterBottom>Verse {verse.verse}</Typography>
          <Grid container spacing={2}>
            {models.map(model => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={model}>
                <Typography variant="subtitle1" color="textSecondary">{model}</Typography>
                <Typography variant="body1">{verse.translations[model]}</Typography>
              </Grid>
            ))}
          </Grid>
        </Paper>
      </div>
    );
  }, [translations, visibleModels, setRowHeight]);

  if (error) return <Typography color="error">{error}</Typography>;
  if (isLoading && translations.length === 0) return <Typography>Loading...</Typography>;

  return (
    <Box sx={{ 
      height: '100vh', 
      width: '100vw', 
      display: 'flex', 
      flexDirection: 'column',
      overflow: 'hidden'
    }}>
      <AppBar position="sticky" color="default">
        <Toolbar sx={{ width: '100%' }}>
          <FormGroup row sx={{ flexWrap: 'wrap', justifyContent: 'center', width: '100%' }}>
            {Object.keys(visibleModels).map(model => (
              <FormControlLabel
                key={model}
                control={
                  <Checkbox
                    checked={visibleModels[model]}
                    onChange={() => handleModelToggle(model)}
                    name={model}
                  />
                }
                label={model}
              />
            ))}
          </FormGroup>
        </Toolbar>
      </AppBar>
      <Box sx={{ 
        flexGrow: 1, 
        width: '100%', 
        overflow: 'hidden',
        paddingRight: '20px', // Add padding to accommodate scrollbar
      }}>
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
                  width={width - 20} // Subtract padding to ensure scrollbar is visible
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