import { useState, useEffect } from 'react';
import type { SavedList } from '../types';

const STORAGE_KEY = 'near-buy-lists';

export const useSavedLists = () => {
  const [savedLists, setSavedLists] = useState<SavedList[]>(() => {
    try {
      const items = window.localStorage.getItem(STORAGE_KEY);
      return items ? JSON.parse(items) : [];
    } catch (error) {
      console.error("Error reading from localStorage", error);
      return [];
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(savedLists));
    } catch (error) {
      console.error("Error writing to localStorage", error);
    }
  }, [savedLists]);

  const saveList = (name: string, content: string) => {
    if (!name.trim() || !content.trim()) return;
    const newList: SavedList = {
      id: Date.now().toString(),
      name,
      content,
    };
    setSavedLists(prevLists => [...prevLists, newList]);
  };

  const deleteList = (id: string) => {
    setSavedLists(prevLists => prevLists.filter(list => list.id !== id));
  };

  return { savedLists, saveList, deleteList };
};