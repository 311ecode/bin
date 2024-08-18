import React, { useState, useEffect } from 'react';
import {
  Table, TableHead, TableBody, TableRow, TableCell, TableContainer, Paper, Typography,
  AppBar, Toolbar, FormGroup, FormControlLabel, Checkbox, Box
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
          <FormGroup row>
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
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Verse</TableCell>
              {models.filter(model => visibleModels[model]).map(model => (
                <TableCell key={model}>{model}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {translations.map((verse, index) => (
              <TableRow key={verse.verse} sx={{ backgroundColor: index % 2 ? '#f5f5f5' : 'inherit' }}>
                <TableCell>{verse.verse}</TableCell>
                {models.filter(model => visibleModels[model]).map(model => (
                  <TableCell key={model}>{verse.translations[model]}</TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default ParallelTranslations;