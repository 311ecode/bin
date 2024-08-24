import React, { useEffect, useCallback } from 'react';
import { Eye } from 'lucide-react';

const VerseVisibilityTracker = ({ onVisibleRangeChange }) => {
  const handleVisibleRangeChange = useCallback((startIndex, stopIndex) => {
    const middleIndex = Math.floor((startIndex + stopIndex) / 2);
    onVisibleRangeChange(middleIndex + 1); // +1 because verse numbers are 1-indexed
    console.log(`Verse ${middleIndex + 1} is now visible`);
    
    localStorage.setItem('lastVisibleVerse', (middleIndex + 1).toString());
  }, [onVisibleRangeChange]);

  useEffect(() => {
    return () => {
      // Clean up logic if needed
    };
  }, []);

  return (
    <div className="fixed bottom-4 right-4 bg-white p-2 rounded-full shadow-lg">
      <Eye className="text-blue-500" size={24} />
    </div>
  );
};

export default VerseVisibilityTracker;