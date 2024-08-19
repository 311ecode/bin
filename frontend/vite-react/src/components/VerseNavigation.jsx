import React, { useState } from 'react';
import { TextField, Button, Box } from '@mui/material';

const VerseNavigation = ({ onNavigate, totalVerses }) => {
  const [verseInput, setVerseInput] = useState('');

  const handleNavigate = () => {
    const verse = parseInt(verseInput);
    if (!isNaN(verse) && verse > 0 && verse <= totalVerses) {
      onNavigate(verse);
      setVerseInput('');
    }
  };

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
      <TextField
        label="Go to verse"
        variant="outlined"
        size="small"
        value={verseInput}
        onChange={(e) => setVerseInput(e.target.value)}
        onKeyPress={(e) => e.key === 'Enter' && handleNavigate()}
      />
      <Button variant="contained" onClick={handleNavigate}>
        Go
      </Button>
    </Box>
  );
};

export default VerseNavigation;