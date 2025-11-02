import { useState, useEffect } from 'react';
import type { SavedSearch, SearchResult } from '../types';

const STORAGE_KEY = 'near-buy-searches';

interface SearchData {
    shoppingList: string;
    results: SearchResult[];
    searchType: 'shopping' | 'gas';
}

export const useSavedSearches = () => {
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>(() => {
    try {
      const items = window.localStorage.getItem(STORAGE_KEY);
      return items ? JSON.parse(items) : [];
    } catch (error) {
      console.error("Error reading saved searches from localStorage", error);
      return [];
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(savedSearches));
    } catch (error) {
      console.error("Error writing saved searches to localStorage", error);
    }
  }, [savedSearches]);

  const saveSearch = (name: string, data: SearchData) => {
    if (!name.trim() || data.results.length === 0) return;
    const newSearch: SavedSearch = {
      id: Date.now().toString(),
      name,
      shoppingList: data.shoppingList,
      results: data.results,
      searchType: data.searchType,
      createdAt: Date.now(),
    };
    setSavedSearches(prevSearches => [...prevSearches, newSearch].sort((a, b) => b.createdAt - a.createdAt));
  };

  const deleteSearch = (id: string) => {
    setSavedSearches(prevSearches => prevSearches.filter(search => search.id !== id));
  };

  return { savedSearches, saveSearch, deleteSearch };
};
