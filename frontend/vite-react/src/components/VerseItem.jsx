import React, { useState, useEffect, useRef } from 'react';
import { Paper, Typography, Grid, IconButton, TextField } from '@mui/material';
import { MessageSquare, Edit } from 'lucide-react';

const VerseItem = ({ verse, index, style, visibleModels, setRowHeight, isTargeted, onUpdateExtraData }) => {
  const ref = useRef(null);
  const [isEditing, setIsEditing] = useState(false);
  const [comment, setComment] = useState('');

  useEffect(() => {
    if (ref.current) {
      setRowHeight(index, ref.current.getBoundingClientRect().height);
    }
  }, [setRowHeight, index, verse, visibleModels, isEditing]);

  useEffect(() => {
    if (verse.extraData?.basictranslation_extraData?.comment) {
      setComment(verse.extraData.basictranslation_extraData.comment);
    }
  }, [verse.extraData]);

  const handleCommentChange = (event) => {
    setComment(event.target.value);
  };

  const handleCommentSubmit = () => {
    onUpdateExtraData(verse.verse, { comment });
    setIsEditing(false);
  };

  const toggleEditing = () => {
    setIsEditing(!isEditing);
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
          <IconButton onClick={toggleEditing} size="small" sx={{ ml: 1 }}>
            {comment ? <Edit size={16} /> : <MessageSquare size={16} />}
          </IconButton>
        </Typography>
        
        {isEditing && (
          <TextField
            fullWidth
            variant="outlined"
            value={comment}
            onChange={handleCommentChange}
            onKeyPress={(e) => e.key === 'Enter' && handleCommentSubmit()}
            placeholder="Add a comment..."
            sx={{ mb: 2 }}
          />
        )}
        
        {!isEditing && comment && (
          <Typography variant="body2" sx={{ mb: 2, fontStyle: 'italic' }}>
            Comment: {comment}
          </Typography>
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