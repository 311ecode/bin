import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Paper, Typography, Grid, IconButton, TextField } from '@mui/material';
import { MessageSquare, Edit, AlertTriangle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

const VerseItem = React.memo(({ verse, index, style, visibleModels, setRowHeight, isTargeted, onUpdateExtraData }) => {
  const ref = useRef(null);
  const commentRef = useRef(null);
  const [isEditing, setIsEditing] = useState(false);
  const [localComment, setLocalComment] = useState('');
  const [localHasProblem, setLocalHasProblem] = useState(false);

  useEffect(() => {
    if (verse.extraData?.basictranslation_extraData) {
      setLocalComment(verse.extraData.basictranslation_extraData.comment || '');
      setLocalHasProblem(verse.extraData.basictranslation_extraData.hasProblem || false);
    }
  }, [verse.extraData]);

  useEffect(() => {
    if (ref.current) {
      setRowHeight(index, ref.current.getBoundingClientRect().height);
    }
  }, [setRowHeight, index, isEditing, localComment]);

  const handleCommentChange = useCallback((event) => {
    setLocalComment(event.target.value);
  }, []);

  const handleCommentSubmit = useCallback(() => {
    const trimmedComment = localComment.trim();
    const commentToSave = trimmedComment === '' ? null : trimmedComment;
    onUpdateExtraData(verse.verse, { comment: commentToSave, hasProblem: localHasProblem });
    setIsEditing(false);
  }, [localComment, localHasProblem, onUpdateExtraData, verse.verse]);

  const handleKeyPress = useCallback((event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleCommentSubmit();
    }
  }, [handleCommentSubmit]);

  const handleKeyDown = useCallback((event) => {
    if (event.key === 'Escape') {
      setIsEditing(false);
    }
  }, []);

  const toggleEditing = useCallback(() => {
    setIsEditing((prev) => !prev);
  }, []);

  const toggleProblem = useCallback(() => {
    setLocalHasProblem((prev) => {
      const newProblemState = !prev;
      onUpdateExtraData(verse.verse, { hasProblem: newProblemState || null });
      return newProblemState;
    });
  }, [onUpdateExtraData, verse.verse]);

  if (!verse) {
    return <div style={style}>Loading verse {index + 1}...</div>;
  }

  const models = Object.keys(visibleModels).filter(model => visibleModels[model]);

  return (
    <div style={{ ...style, height: 'auto' }} ref={ref}>
      <Paper 
        elevation={3} 
        sx={{ 
          p: 2, 
          backgroundColor: isTargeted ? 'action.selected' : (index % 2 ? '#f5f5f5' : 'inherit'),
          width: '100%',
          border: isTargeted ? '2px solid' : 'none',
          borderColor: 'primary.main',
        }}
      >
        <Typography variant="h6" gutterBottom>
          Verse {verse.verse}
          <IconButton onClick={toggleProblem} size="small" sx={{ ml: 1 }}>
            <AlertTriangle size={16} color={localHasProblem ? 'red' : 'gray'} />
          </IconButton>
          <IconButton onClick={toggleEditing} size="small" sx={{ ml: 1 }}>
            {localComment ? <Edit size={16} /> : <MessageSquare size={16} />}
          </IconButton>
        </Typography>
        
        {isEditing ? (
          <TextField
            fullWidth
            multiline
            variant="outlined"
            value={localComment}
            onChange={handleCommentChange}
            onKeyPress={handleKeyPress}
            onKeyDown={handleKeyDown}
            placeholder="Add a comment (Markdown supported)..."
            sx={{ mb: 2 }}
          />
        ) : localComment ? (
          <Paper ref={commentRef} elevation={0} sx={{ p: 1, mb: 2, backgroundColor: 'rgba(0, 0, 0, 0.03)' }}>
            <ReactMarkdown>{localComment}</ReactMarkdown>
          </Paper>
        ) : null}
        
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
      </Paper>
    </div>
  );
});

export default VerseItem;