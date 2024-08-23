import React, { useState, useEffect, useRef } from 'react';
import { Paper, Typography, Grid, IconButton, TextField } from '@mui/material';
import { MessageSquare, Edit, AlertTriangle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

const VerseItem = ({ verse, index, style, visibleModels, setRowHeight, isTargeted, onUpdateExtraData }) => {
  const ref = useRef(null);
  const [isEditing, setIsEditing] = useState(false);
  const [comment, setComment] = useState('');
  const [editingComment, setEditingComment] = useState('');
  const [hasProblem, setHasProblem] = useState(false);

  useEffect(() => {
    if (ref.current) {
      setRowHeight(index, ref.current.getBoundingClientRect().height);
    }
  }, [setRowHeight, index, verse, visibleModels, isEditing]);

  useEffect(() => {
    if (verse.extraData?.basictranslation_extraData) {
      setComment(verse.extraData.basictranslation_extraData.comment || '');
      setHasProblem(verse.extraData.basictranslation_extraData.hasProblem || false);
    }
  }, [verse.extraData]);

  const handleCommentChange = (event) => {
    setEditingComment(event.target.value);
  };

  const handleCommentSubmit = () => {
    const trimmedComment = editingComment.trim();
    const commentToSave = trimmedComment === '' ? null : trimmedComment;
    onUpdateExtraData(verse.verse, { comment: commentToSave });
    setComment(trimmedComment);
    setIsEditing(false);
  };

  const handleKeyPress = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleCommentSubmit();
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Escape') {
      setEditingComment(comment);
      setIsEditing(false);
    }
  };

  const toggleEditing = () => {
    setEditingComment(comment);
    setIsEditing(!isEditing);
  };

  const toggleProblem = () => {
    const newProblemState = !hasProblem;
    setHasProblem(newProblemState);
    onUpdateExtraData(verse.verse, { hasProblem: newProblemState || null });
  };

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
            <AlertTriangle size={16} color={hasProblem ? 'red' : 'gray'} />
          </IconButton>
          <IconButton onClick={toggleEditing} size="small" sx={{ ml: 1 }}>
            {comment ? <Edit size={16} /> : <MessageSquare size={16} />}
          </IconButton>
        </Typography>
        
        {isEditing && (
          <TextField
            fullWidth
            multiline
            variant="outlined"
            value={editingComment}
            onChange={handleCommentChange}
            onKeyPress={handleKeyPress}
            onKeyDown={handleKeyDown}
            placeholder="Add a comment (Markdown supported)..."
            sx={{ mb: 2 }}
          />
        )}
        
        {!isEditing && comment && (
          <Paper elevation={0} sx={{ p: 1, mb: 2, backgroundColor: 'rgba(0, 0, 0, 0.03)' }}>
            <ReactMarkdown>{comment}</ReactMarkdown>
          </Paper>
        )}
        
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
};

export default VerseItem;