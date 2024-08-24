import React from 'react';
import { Typography, IconButton } from '@mui/material';
import { MessageSquare, Edit, AlertTriangle, CheckSquare } from 'lucide-react';

export const VerseHeader = ({ verse, localHasProblem, localComment, localFinalSuggestion, toggleProblem, toggleEditingComment, toggleEditingFinalSuggestion }) => (
  <Typography variant="h6" gutterBottom>
    Verse {verse.verse}
    <IconButton onClick={toggleProblem} size="small" sx={{ ml: 1 }}>
      <AlertTriangle size={16} color={localHasProblem ? 'red' : 'gray'} />
    </IconButton>
    <IconButton onClick={toggleEditingComment} size="small" sx={{ ml: 1 }}>
      {localComment ? (
        <Edit size={16} color="blue" />
      ) : (
        <MessageSquare size={16} color="gray" />
      )}
    </IconButton>
    <IconButton onClick={toggleEditingFinalSuggestion} size="small" sx={{ ml: 1 }}>
      <CheckSquare size={16} color={localFinalSuggestion ? 'green' : 'gray'} />
    </IconButton>
  </Typography>
);