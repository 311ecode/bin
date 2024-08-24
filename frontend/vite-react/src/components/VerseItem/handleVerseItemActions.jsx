// src/components/VerseItem/handleVerseItemActions.jsx
import { useCallback } from "react";

export function handleVerseItemActions(setLocalComment, setLocalFinalSuggestion, localComment, localFinalSuggestion, onUpdateExtraData, verse, localHasProblem, setIsEditingComment, setIsEditingFinalSuggestion, setLocalHasProblem) {
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
  }, [localComment, localFinalSuggestion, localHasProblem, onUpdateExtraData, verse.verse, setIsEditingComment, setIsEditingFinalSuggestion]);

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

  return { 
    toggleProblem, 
    toggleEditingComment, 
    toggleEditingFinalSuggestion, 
    handleCommentChange, 
    handleKeyPress, 
    handleKeyDown, 
    handleFinalSuggestionChange,
    handleSubmit  // Add this line to include handleSubmit in the returned object
  };
}