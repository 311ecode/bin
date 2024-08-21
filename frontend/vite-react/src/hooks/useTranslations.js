import { useState, useEffect, useCallback } from 'react';

const CHUNK_SIZE = 5000;

const useTranslations = (executionGroup) => {
  const [translations, setTranslations] = useState([]);
  const [error, setError] = useState(null);
  const [totalItems, setTotalItems] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const loadMoreItems = useCallback((startIndex, stopIndex) => {
    setIsLoading(true);
    console.log('Fetching translations:', startIndex, stopIndex);
    return fetch(`${import.meta.env.VITE_API_URL}/translations/${executionGroup}?start=${startIndex}&end=${stopIndex}`)
      .then(response => {
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return response.json();
      })
      .then(data => {
        if (data && data.length > 0 && data[0].translations) {
          setTranslations(prevTranslations => {
            const newTranslations = [...prevTranslations];
            data[0].translations.forEach((item, index) => {
              newTranslations[startIndex + index] = item;
            });
            return newTranslations;
          });
          if (totalItems === 0) {
            setTotalItems(data[0].totalVerses || data[0].translations.length);
          }
        } else {
          setError('Received unexpected data structure from the server');
        }
        setIsLoading(false);
      })
      .catch(error => {
        console.error('Error fetching translations:', error);
        setError(`Failed to fetch translations: ${error.message}`);
        setIsLoading(false);
      });
  }, [executionGroup, totalItems]);

  useEffect(() => {
    loadMoreItems(0, CHUNK_SIZE - 1);
  }, [loadMoreItems]);

  const isItemLoaded = useCallback(index => !!translations[index], [translations]);

  return {
    translations,
    error,
    totalItems,
    isLoading,
    loadMoreItems,
    isItemLoaded
  };
};

export default useTranslations;