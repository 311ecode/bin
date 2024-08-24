import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Paper, Typography, Grid, IconButton, TextField, Box } from '@mui/material';
import ReactMarkdown from 'react-markdown';
import { VerseHeader } from './VerseHeader';
import { CommentSection } from './CommentSection';
import { FinalSuggestionSection } from './FinalSuggestionSection';
import { TranslationGrid } from './TranslationGrid';


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

  useEffect(() => {
    if (verse.extraData?.basictranslation_extraData) {
      setLocalComment(verse.extraData.basictranslation_extraData.comment || '');
      setLocalHasProblem(verse.extraData.basictranslation_extraData.hasProblem || false);
      setLocalFinalSuggestion(verse.extraData.basictranslation_extraData.finalSuggestion || '');
    }
  }, [verse.extraData]);

  useEffect(() => {
    if (ref.current) {
      setRowHeight(index, ref.current.getBoundingClientRect().height);
    }
  }, [setRowHeight, index, isEditingComment, isEditingFinalSuggestion, localComment, localFinalSuggestion]);

  useEffect(() => {
    if (isEditingComment && textFieldRef.current) {
      textFieldRef.current.focus();
      const length = textFieldRef.current.value.length;
      textFieldRef.current.setSelectionRange(length, length);
    }
  }, [isEditingComment]);

  useEffect(() => {
    if (isEditingFinalSuggestion && finalSuggestionRef.current) {
      finalSuggestionRef.current.focus();
      const length = finalSuggestionRef.current.value.length;
      finalSuggestionRef.current.setSelectionRange(length, length);
    }
  }, [isEditingFinalSuggestion]);

  const handleCommentChange = useCallback((event) => {
    setLocalComment(event.target.value);
  }, []);

  const handleFinalSuggestionChange = useCallback((event) => {
    setLocalFinalSuggestion(event.target.value);
  }, []);

  const handleSubmit = useCallback(() => {
    const trimmedComment = localComment.trim();
    const trimmedFinalSuggestion = localFinalSuggestion.trim();
    const commentToSave = trimmedComment === '' ? null : trimmedComment;
    const finalSuggestionToSave = trimmedFinalSuggestion === '' ? null : trimmedFinalSuggestion;
    onUpdateExtraData(verse.verse, { 
      comment: commentToSave, 
      hasProblem: localHasProblem,
      finalSuggestion: finalSuggestionToSave
    });
    setIsEditingComment(false);
    setIsEditingFinalSuggestion(false);
  }, [localComment, localFinalSuggestion, localHasProblem, onUpdateExtraData, verse.verse]);

  const handleKeyPress = useCallback((event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSubmit();
    }
  }, [handleSubmit]);

  const handleKeyDown = useCallback((event) => {
    if (event.key === 'Escape') {
      setIsEditingComment(false);
      setIsEditingFinalSuggestion(false);
    }
  }, []);

  const toggleEditingComment = useCallback(() => {
    setIsEditingComment((prev) => !prev);
    setIsEditingFinalSuggestion(false);
  }, []);

  const toggleEditingFinalSuggestion = useCallback(() => {
    setIsEditingFinalSuggestion((prev) => !prev);
    setIsEditingComment(false);
  }, []);

  const toggleProblem = useCallback(() => {
    setLocalHasProblem((prev) => {
      const newProblemState = !prev;
      onUpdateExtraData(verse.verse, { 
        hasProblem: newProblemState || null,
        comment: localComment,
        finalSuggestion: localFinalSuggestion
      });
      return newProblemState;
    });
  }, [onUpdateExtraData, verse.verse, localComment, localFinalSuggestion]);

  if (!verse) {
    return <div style={style}>Loading verse {index + 1}...</div>;
  }

  const models = Object.keys(visibleModels).filter(model => visibleModels[model]);

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
        />
        
        <Box sx={{ flexGrow: 1, overflowY: 'auto', mb: 2 }}>
          <CommentSection 
            isEditing={isEditingComment}
            localComment={localComment}
            handleChange={handleCommentChange}
            handleKeyPress={handleKeyPress}
            handleKeyDown={handleKeyDown}
            textFieldRef={textFieldRef}
            commentRef={commentRef}
          />

          <FinalSuggestionSection 
            isEditing={isEditingFinalSuggestion}
            localFinalSuggestion={localFinalSuggestion}
            handleChange={handleFinalSuggestionChange}
            handleKeyPress={handleKeyPress}
            handleKeyDown={handleKeyDown}
            finalSuggestionRef={finalSuggestionRef}
          />
        </Box>
        
        <TranslationGrid models={models} verse={verse} />
      </Paper>
    </div>
  );
});

export default VerseItem;