import React from 'react';
import { Paper, Typography, Grid} from '@mui/material';

export const TranslationGrid = React.memo(({ models, verse }) => (
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
));
