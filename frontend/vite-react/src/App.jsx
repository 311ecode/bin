import React from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import ParallelTranslations from './components/ParallelTranslations';

const theme = createTheme();

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <div className="App">
        <h1>Parallel Translations</h1>
        <ParallelTranslations executionGroup="basictranslation" />
      </div>
    </ThemeProvider>
  );
}

export default App;