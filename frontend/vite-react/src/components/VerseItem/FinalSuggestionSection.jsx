// src/components/VerseItem/FinalSuggestionSection.jsx
import React from 'react';
import { Paper, Typography, TextField } from '@mui/material';

export const FinalSuggestionSection = React.memo(({ 
  isEditing, 
  localFinalSuggestion, 
  handleChange, 
  handleKeyPress, 
  handleKeyDown, 
  finalSuggestionRef,
  handleDoubleClick
}) => (
  isEditing ? (
    <TextField
      fullWidth
      multiline
      variant="outlined"
      value={localFinalSuggestion}
      onChange={handleChange}
      onKeyPress={handleKeyPress}
      onKeyDown={handleKeyDown}
      onDoubleClick={handleDoubleClick}
      placeholder="Add a final suggestion..."
      sx={{ mb: 2 }}
      inputRef={finalSuggestionRef}
    />
  ) : localFinalSuggestion ? (
    <Paper elevation={0} sx={{ p: 1, mb: 2, backgroundColor: 'rgba(0, 255, 0, 0.1)' }}>
      <Typography variant="subtitle2" color="primary" gutterBottom>Final Suggestion:</Typography>
      <Typography variant="body2">{localFinalSuggestion}</Typography>
    </Paper>
  ) : null
));