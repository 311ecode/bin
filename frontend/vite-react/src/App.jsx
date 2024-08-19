import React from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import ParallelTranslations from './components/ParallelTranslations';

const theme = createTheme();

console.log("FUUU");


function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Container maxWidth={false} disableGutters>
        <Box sx={{ my: 4, px: 2 }}>
          <Typography variant="h3" component="h1" gutterBottom align="center">
            Parallel Translations
          </Typography>
          <ParallelTranslations executionGroup="basictranslation" />
        </Box>
      </Container>
    </ThemeProvider>
  );
}

export default App;