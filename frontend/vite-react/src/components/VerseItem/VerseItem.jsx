// src/components/VerseItem/VerseItem.jsx
import React, { useState, useRef, useCallback } from 'react';
import { Paper } from '@mui/material';
import { VerseHeader } from './VerseHeader';
import { TranslationGrid } from './TranslationGrid';
import { handleVerseItemActions } from './handleVerseItemActions';
import { initializeVerseItem } from './initializeVerseItem';
import { renderVerseItem } from './renderVerseItem';

const VerseItem = React.memo(({ verse, index, style, visibleModels, setRowHeight, isTargeted, onUpdateExtraData }) => {
  const ref = useRef(null);
  const commentRef = useRef(null);
  const textFieldRef = useRef(null);
  const finalSuggestionRef = useRef(null);
  const [isEditingComment, setIsEditingComment] = useState(false);
  const [isEditingFinalSuggestion, setIsEditingFinalSuggestion] = useState(false);
  const [localComment, setLocalComment] = useState('');
  const [localHasProblem, setLocalHasProblem] = useState(false);
  const [localFinalSuggestion, setLocalFinalSuggestion] = useState('');

  initializeVerseItem(verse, setLocalComment, setLocalHasProblem, setLocalFinalSuggestion, ref, setRowHeight, index, isEditingComment, isEditingFinalSuggestion, localComment, localFinalSuggestion, textFieldRef, finalSuggestionRef);

  const { 
    toggleProblem, 
    toggleEditingComment, 
    toggleEditingFinalSuggestion, 
    handleCommentChange, 
    handleKeyPress, 
    handleKeyDown, 
    handleFinalSuggestionChange,
    // handleSubmit,
    handleDoubleClick,
    handleDoubleClickSave
  } = handleVerseItemActions(
    setLocalComment, 
    setLocalFinalSuggestion, 
    localComment, 
    localFinalSuggestion, 
    onUpdateExtraData, 
    verse, 
    localHasProblem, 
    setIsEditingComment, 
    setIsEditingFinalSuggestion, 
    setLocalHasProblem,
    isEditingFinalSuggestion, 
    finalSuggestionRef,
    isEditingComment
  );


  // const handleDoubleClickSave = useCallback(() => {
  //   if (isEditingComment || isEditingFinalSuggestion) {
  //     handleSubmit();
  //   }
  // }, [isEditingComment, isEditingFinalSuggestion, handleSubmit]);

  if (!verse) {
    return <div style={style}>Loading verse {index + 1}...</div>;
  }

  const models = Object.keys(visibleModels).filter(model => visibleModels[model]);

  const handleWatchedStatusChange = useCallback((verseNumber, isWatched, updatePrevious = false) => {
    if (updatePrevious) {
      for (let i = 1; i <= verseNumber; i++) {
        onUpdateExtraData(i, { watched: true, watchedDate: new Date().toISOString() });
      }
    } else {
      onUpdateExtraData(verseNumber, { 
        watched: isWatched, 
        watchedDate: isWatched ? new Date().toISOString() : null 
      });
    }
  }, [onUpdateExtraData]);

  return (
    <div style={{ ...style, height: 'auto', minHeight: '200px', marginBottom: '20px' }} ref={ref}>
      <Paper 
        elevation={3} 
        sx={{ 
          p: 2, 
          backgroundColor: isTargeted ? 'action.selected' : (index % 2 ? '#f5f5f5' : 'inherit'),
          width: '100%',
          height: '100%',
          border: isTargeted ? '2px solid' : 'none',
          borderColor: 'primary.main',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <VerseHeader 
          verse={verse}
          localHasProblem={localHasProblem}
          localComment={localComment}
          localFinalSuggestion={localFinalSuggestion}
          toggleProblem={toggleProblem}
          toggleEditingComment={toggleEditingComment}
          toggleEditingFinalSuggestion={toggleEditingFinalSuggestion}
          onWatchedStatusChange={handleWatchedStatusChange}
        />
        
        {renderVerseItem(
          isEditingComment, 
          localComment, 
          handleCommentChange, 
          handleKeyPress, 
          handleKeyDown, 
          textFieldRef, 
          commentRef, 
          isEditingFinalSuggestion, 
          localFinalSuggestion, 
          handleFinalSuggestionChange, 
          finalSuggestionRef,
          handleDoubleClickSave
        )}
        
        <TranslationGrid 
          models={models} 
          verse={verse} 
          onDoubleClick={handleDoubleClick} 
          isEditingFinalSuggestion={isEditingFinalSuggestion} 
        />
      </Paper>
    </div>
  );
});

export default VerseItem;