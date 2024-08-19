import React, { useEffect, useRef } from 'react';
import { Paper, Typography, Grid, Divider, useMediaQuery, useTheme } from '@mui/material';

const VerseItem = ({ verse, index, style, visibleModels, setRowHeight, isTargeted }) => {
  const ref = useRef(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  useEffect(() => {
    if (ref.current) {
      setRowHeight(index, ref.current.getBoundingClientRect().height);
    }
  }, [setRowHeight, index, verse, visibleModels, isMobile]);

  if (!verse) {
    return <div style={style}>Loading verse {index + 1}...</div>;
  }

  const models = Object.keys(visibleModels).filter(model => visibleModels[model]);

  return (
    <div style={{ ...style, height: 'auto' }} ref={ref}>
      <Paper 
        elevation={3} 
        sx={{ 
          p: 2, 
          backgroundColor: isTargeted ? theme.palette.action.selected : (index % 2 ? '#f5f5f5' : 'inherit'),
          width: '100%',
          border: isTargeted ? `2px solid ${theme.palette.primary.main}` : 'none',
        }}
      >
        <Typography variant="h6" gutterBottom>Verse {verse.verse}</Typography>
        <Grid container spacing={2}>
          {models.map(model => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={model}>
              <Paper elevation={1} sx={{ p: 1, height: '100%' }}>
                <Typography variant="subtitle2" color="primary" gutterBottom>{model}</Typography>
                <Typography variant="body2">{verse.translations[model]}</Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Paper>
    </div>
  );
};

export default VerseItem;