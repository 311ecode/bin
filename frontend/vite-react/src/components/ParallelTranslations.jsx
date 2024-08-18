import React, { useState, useEffect } from 'react';
import {
  Typography, AppBar, Toolbar, FormGroup, FormControlLabel, Checkbox, Box, Grid, Paper
} from '@mui/material';

const ParallelTranslations = ({ executionGroup }) => {
  const [translations, setTranslations] = useState([]);
  const [error, setError] = useState(null);
  const [visibleModels, setVisibleModels] = useState({});

  useEffect(() => {
    fetch(`http://localhost:33333/translations/${executionGroup}`)
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        setTranslations(data[0].translations);
        const initialVisibleModels = Object.keys(data[0].translations[0].translations)
          .reduce((acc, model) => ({ ...acc, [model]: true }), {});
        setVisibleModels(initialVisibleModels);
      })
      .catch(error => {
        console.error('Error fetching translations:', error);
        setError('Failed to fetch translations. Please check the console for more details.');
      });
  }, [executionGroup]);

  if (error) return <Typography color="error">{error}</Typography>;
  if (translations.length === 0) return <Typography>Loading...</Typography>;

  const models = Object.keys(visibleModels);

  const handleModelToggle = (model) => {
    setVisibleModels(prev => ({ ...prev, [model]: !prev[model] }));
  };

  return (
    <Box sx={{ pb: 7 }}>
      <AppBar position="sticky" color="default" sx={{ top: 0, bottom: 'auto' }}>
        <Toolbar>
          <FormGroup row sx={{ flexWrap: 'wrap', justifyContent: 'center' }}>
            {models.map(model => (
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
      <Grid container spacing={2} sx={{ mt: 2 }}>
        {translations.map((verse, index) => (
          <Grid item xs={12} key={verse.verse}>
            <Paper 
              elevation={3} 
              sx={{ 
                p: 2, 
                backgroundColor: index % 2 ? '#f5f5f5' : 'inherit'
              }}
            >
              <Typography variant="h6" gutterBottom>Verse {verse.verse}</Typography>
              <Grid container spacing={2}>
                {models.filter(model => visibleModels[model]).map(model => (
                  <Grid item xs={12} sm={6} md={4} lg={3} key={model}>
                    <Typography variant="subtitle1" color="textSecondary">{model}</Typography>
                    <Typography variant="body1">{verse.translations[model]}</Typography>
                  </Grid>
                ))}
              </Grid>
            </Paper>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default ParallelTranslations;