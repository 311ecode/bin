import React, { useState, useEffect, useRef } from 'react';
import { Eye, EyeOff } from 'lucide-react';

export const VerseVisibilityTracker = ({ verses, onWatchedChange }) => {
  const [watchedVerses, setWatchedVerses] = useState({});
  const observers = useRef({});

  useEffect(() => {
    verses.forEach((verse) => {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const startTime = Date.now();
              const timeoutId = setTimeout(() => {
                setWatchedVerses((prev) => ({ ...prev, [verse.id]: true }));
                onWatchedChange(verse.id, true);
                observer.unobserve(entry.target);
              }, 10000); // 10 seconds

              observers.current[verse.id] = { observer, timeoutId };
            } else {
              if (observers.current[verse.id]) {
                clearTimeout(observers.current[verse.id].timeoutId);
              }
            }
          });
        },
        { threshold: 0.5 } // 50% of the verse must be visible
      );

      observers.current[verse.id] = { observer };
    });

    return () => {
      Object.values(observers.current).forEach(({ observer, timeoutId }) => {
        if (observer) observer.disconnect();
        if (timeoutId) clearTimeout(timeoutId);
      });
    };
  }, [verses, onWatchedChange]);

  return (
    <div className="space-y-4">
      {verses.map((verse) => (
        <div
          key={verse.id}
          ref={(el) => el && observers.current[verse.id]?.observer.observe(el)}
          className="p-4 border rounded-lg flex items-start space-x-4"
        >
          <div className="flex-grow">
            <h3 className="font-bold">Verse {verse.id}</h3>
            <p>{verse.text}</p>
          </div>
          <div className="flex-shrink-0">
            {watchedVerses[verse.id] ? (
              <Eye className="text-blue-500" />
            ) : (
              <EyeOff className="text-gray-400" />
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default VerseVisibilityTracker;