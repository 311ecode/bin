// src/components/VerseItem/VerseHeader.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { Typography, IconButton, Tooltip } from '@mui/material';
import { MessageSquare, Edit, AlertTriangle, CheckSquare, Eye } from 'lucide-react';

export const VerseHeader = ({ 
  verse, 
  localHasProblem, 
  localComment, 
  localFinalSuggestion, 
  toggleProblem, 
  toggleEditingComment, 
  toggleEditingFinalSuggestion,
  onWatchedStatusChange
}) => {
  const [isWatched, setIsWatched] = useState(false);
  const [watchedDate, setWatchedDate] = useState(null);

  useEffect(() => {
    const watchedStatus = localStorage.getItem(`verse_${verse.verse}_watched`);
    if (watchedStatus) {
      setIsWatched(true);
      setWatchedDate(new Date(JSON.parse(watchedStatus).date));
    }
  }, [verse.verse]);

  const handleWatchClick = useCallback(() => {
    const newWatchedStatus = !isWatched;
    setIsWatched(newWatchedStatus);
    const currentDate = new Date().toISOString();
    setWatchedDate(new Date(currentDate));
    
    localStorage.setItem(`verse_${verse.verse}_watched`, JSON.stringify({
      watched: newWatchedStatus,
      date: currentDate
    }));

    if (onWatchedStatusChange) {
      onWatchedStatusChange(verse.verse, newWatchedStatus);
    }
  }, [isWatched, verse.verse, onWatchedStatusChange]);

  const handleTripleClick = useCallback(() => {
    for (let i = 1; i <= verse.verse; i++) {
      localStorage.setItem(`verse_${i}_watched`, JSON.stringify({
        watched: true,
        date: new Date().toISOString()
      }));
    }
    setIsWatched(true);
    setWatchedDate(new Date());
    
    if (onWatchedStatusChange) {
      onWatchedStatusChange(verse.verse, true, true);
    }
  }, [verse.verse, onWatchedStatusChange]);

  return (
    <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
      <Tooltip title={watchedDate ? `Watched on ${watchedDate.toLocaleString()}` : 'Mark as watched'}>
        <IconButton 
          onClick={handleWatchClick} 
          onDoubleClick={(e) => { e.preventDefault(); }} // Prevent double-click from triggering
          onMouseDown={(e) => {
            if (e.detail === 3) {
              handleTripleClick();
            }
          }}
          size="small" 
          sx={{ mr: 1 }}
        >
          <Eye size={16} color={isWatched ? 'green' : 'gray'} />
        </IconButton>
      </Tooltip>
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
};