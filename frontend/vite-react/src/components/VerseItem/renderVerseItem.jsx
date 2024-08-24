import React from 'react';
import { Box } from '@mui/material';
import { CommentSection } from './CommentSection';
import { FinalSuggestionSection } from './FinalSuggestionSection';

export function renderVerseItem(
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
) {
  return (
    <Box sx={{ flexGrow: 1, overflowY: 'auto', mb: 2 }}>
      <CommentSection
        isEditing={isEditingComment}
        localComment={localComment}
        handleChange={handleCommentChange}
        handleKeyPress={handleKeyPress}
        handleKeyDown={handleKeyDown}
        textFieldRef={textFieldRef}
        commentRef={commentRef}
        handleDoubleClick={handleDoubleClickSave}
      />

      <FinalSuggestionSection
        isEditing={isEditingFinalSuggestion}
        localFinalSuggestion={localFinalSuggestion}
        handleChange={handleFinalSuggestionChange}
        handleKeyPress={handleKeyPress}
        handleKeyDown={handleKeyDown}
        finalSuggestionRef={finalSuggestionRef}
        handleDoubleClick={handleDoubleClickSave}
      />
    </Box>
  );
}
