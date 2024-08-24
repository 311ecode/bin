import { useState, useEffect, useCallback } from 'react';

// * @typedef {import('@api/configurationProcessor/apiRoutes/translationsByExecutionGroupsRoute').TranslationResults} 

/**
 * @typedef {import('@api/configurationProcessor/apiRoutes/translationsByExecutionGroupsRoute.mjs').TranslationResults} TranslationResults
 * @typedef {import('@api/configurationProcessor/apiRoutes/translationsByExecutionGroupsRoute.mjs').VerseTranslation} VerseTranslation
 */

const CHUNK_SIZE = 5000;

/**
 * Custom hook for managing translations
 * @param {string} executionGroup - The execution group identifier
 * @returns {Object} An object containing translation-related state and functions
 */
const useTranslations = (executionGroup) => {
  const [translations, setTranslations] = useState([]);
  const [error, setError] = useState(null);
  const [totalItems, setTotalItems] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  /**
   * Fetches more translation items from the server
   * @param {number} startIndex - The starting index of the items to fetch
   * @param {number} stopIndex - The ending index of the items to fetch
   * @returns {Promise<void>} A promise that resolves when the fetch is complete
   */
  const loadMoreItems = useCallback((startIndex, stopIndex) => {
    setIsLoading(true);
    console.log('Fetching translations:', startIndex, stopIndex);
    return fetch(`${import.meta.env.VITE_API_URL}/api/translations/${executionGroup}?start=${startIndex}&end=${stopIndex}`)
      .then(response => {
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return response.json();
      })
      /**
       * @param {TranslationResults} data - The fetched translation results
       */
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

  /**
   * Checks if an item at a given index is loaded
   * @param {number} index - The index to check
   * @returns {boolean} True if the item is loaded, false otherwise
   */
  const isItemLoaded = useCallback(index => !!translations[index], [translations]);

  /**
   * Updates extra data for a specific verse
   * @param {number} verseNumber - The verse number to update
   * @param {Object} extraData - The extra data to add
   */
  const updateExtraData = useCallback((verseNumber, extraData) => {
    fetch(`${import.meta.env.VITE_API_URL}/api/addExtraDataToVerse`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        executionGroup,
        verseNumber,
        extraData: {
          ...extraData,
        },
      }),
    })
    .then(response => {
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      return response.json();
    })
    .then(updatedExtraData => {
      setTranslations(prevTranslations => {
        const newTranslations = [...prevTranslations];
        const verseIndex = newTranslations.findIndex(t => t.verse === verseNumber);
        if (verseIndex !== -1) {
          newTranslations[verseIndex] = {
            ...newTranslations[verseIndex],
            extraData: {
              ...newTranslations[verseIndex].extraData,
              [`${executionGroup}_extraData`]: updatedExtraData,
            },
          };
        }
        return newTranslations;
      });
    })
    .catch(error => {
      console.error('Error updating extra data:', error);
      setError(`Failed to update extra data: ${error.message}`);
    });
  }, [executionGroup]);

  return {
    translations,
    error,
    totalItems,
    isLoading,
    loadMoreItems,
    isItemLoaded,
    updateExtraData
  };
};

export default useTranslations;