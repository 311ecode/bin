import React, { useEffect, useCallback, useState, useRef } from 'react';
import { Eye } from 'lucide-react';

const VerseVisibilityTracker = () => {
  const [currentVerse, setCurrentVerse] = useState(null);
  const timeoutRef = useRef(null);
  const lastSavedVerseRef = useRef(null);

  const saveVerseToLocalStorage = useCallback((verse) => {
    if (verse !== lastSavedVerseRef.current) {
      localStorage.setItem('lastVisibleVerse', verse.toString());
      lastSavedVerseRef.current = verse;
      console.log(`Saved verse ${verse} to localStorage`);
    }
  }, []);

  const handleVisibleVerseChange = useCallback((newVerse) => {
    setCurrentVerse(newVerse);
    
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    // Set a new timeout
    timeoutRef.current = setTimeout(() => {
      saveVerseToLocalStorage(newVerse);
    }, 60000); // 60000 ms = 1 minute
  }, [saveVerseToLocalStorage]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    handleVisibleVerseChange,
    renderer: (
      <div className="fixed bottom-4 right-4 bg-white p-2 rounded-full shadow-lg">
        <Eye className="text-blue-500" size={24} />
        {currentVerse && <span className="ml-2">Verse {currentVerse}</span>}
      </div>
    )
  };
};

export default VerseVisibilityTracker;