import React from 'react';
import { Paper, TextField, Typography } from '@mui/material';
import ReactMarkdown from 'react-markdown';

export const CommentSection = React.memo(({ isEditing, localComment, handleChange, handleKeyPress, handleKeyDown, textFieldRef, commentRef }) => (
  isEditing ? (
    <TextField
      fullWidth
      multiline
      variant="outlined"
      value={localComment}
      onChange={handleChange}
      onKeyPress={handleKeyPress}
      onKeyDown={handleKeyDown}
      placeholder="Add a comment (Markdown supported)..."
      sx={{ mb: 2 }}
      inputRef={textFieldRef}
    />
  ) : localComment ? (
    <Paper ref={commentRef} elevation={0} sx={{ p: 1, mb: 2, backgroundColor: 'rgba(0, 0, 255, 0.1)' }}>
      <Typography variant="subtitle2" color="primary" gutterBottom>Comment:</Typography>
      <ReactMarkdown>{localComment}</ReactMarkdown>
    </Paper>
  ) : null
));