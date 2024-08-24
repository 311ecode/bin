import { useEffect } from "react";

export function initializeVerseItem(verse, setLocalComment, setLocalHasProblem, setLocalFinalSuggestion, ref, setRowHeight, index, isEditingComment, isEditingFinalSuggestion, localComment, localFinalSuggestion, textFieldRef, finalSuggestionRef) {
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
}
