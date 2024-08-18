import React, { useState, useEffect } from 'react';
import { Table, TableHead, TableBody, TableRow, TableCell, TableContainer, Paper, Typography } from '@mui/material';

const ParallelTranslations = ({ executionGroup }) => {
  const [translations, setTranslations] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch(`http://localhost:33333/translations/${executionGroup}`)
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then(data => setTranslations(data[0].translations))
      .catch(error => {
        console.error('Error fetching translations:', error);
        setError('Failed to fetch translations. Please check the console for more details.');
      });
  }, [executionGroup]);

  if (error) return <Typography color="error">{error}</Typography>;
  if (translations.length === 0) return <Typography>Loading...</Typography>;

  const models = Object.keys(translations[0].translations);

  return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Verse</TableCell>
            {models.map(model => (
              <TableCell key={model}>{model}</TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {translations.map((verse) => (
            <TableRow key={verse.verse}>
              <TableCell>{verse.verse}</TableCell>
              {models.map(model => (
                <TableCell key={model}>{verse.translations[model]}</TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default ParallelTranslations;