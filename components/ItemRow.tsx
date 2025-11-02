import React, { useState } from 'react';
import type { Item, Store } from '../types';
import { SwapIcon } from './icons';

interface Alternative {
  storeName: string;
  price: number;
  store: Store;
}

interface ItemRowProps {
  item: Item;
  alternatives: Alternative[];
  fromStoreName: string;
  onItemSwap: (fromStoreName: string, toStore: Store, item: Item) => void;
  isBuilding: boolean;
  isChecked: boolean;
  onToggle: () => void;
}

export const ItemRow: React.FC<ItemRowProps> = ({ item, alternatives, fromStoreName, onItemSwap, isBuilding, isChecked, onToggle }) => {
  const [showAlternatives, setShowAlternatives] = useState(false);

  return (
    <>
      <li className={`flex items-center justify-between p-2 rounded-md group transition-colors ${isBuilding ? 'hover:bg-gray-50 dark:hover:bg-gray-700/50' : ''}`}>
        <label className="flex-grow pr-2 flex items-center cursor-pointer">
          {isBuilding && (
            <input
              type="checkbox"
              checked={isChecked}
              onChange={onToggle}
              className="h-5 w-5 rounded bg-gray-100 dark:bg-gray-900 border-gray-300 dark:border-gray-600 text-green-500 focus:ring-green-500 dark:focus:ring-green-600 mr-3 cursor-pointer"
            />
          )}
          <span className="text-gray-800 dark:text-gray-200">{item.name}</span>
        </label>
        <div className="flex items-center">
          <span className="text-gray-500 dark:text-gray-400 mr-4 w-16 text-right">${item.price.toFixed(2)}</span>
          {alternatives.length > 0 && !isBuilding && (
            <button
              onClick={() => setShowAlternatives(!showAlternatives)}
              className="p-1 text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 rounded-full transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
              title="Find cheaper alternatives"
              aria-label="Find cheaper alternatives for this item"
              aria-expanded={showAlternatives}
            >
              <SwapIcon />
            </button>
          )}
        </div>
      </li>
      {showAlternatives && alternatives.length > 0 && !isBuilding && (
        <li className="pl-6 pr-2 pb-2">
          <div className="bg-gray-100 dark:bg-gray-900/70 p-3 rounded-md border border-gray-200 dark:border-gray-700">
            <h5 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-2">Cheaper at:</h5>
            <ul className="space-y-2">
              {alternatives.map((alt, index) => (
                <li key={index} className="flex justify-between items-center">
                  <div>
                    <span className="font-semibold text-blue-600 dark:text-blue-300">{alt.storeName}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-green-600 dark:text-green-400">${alt.price.toFixed(2)}</span>
                    <button
                      onClick={() => {
                        onItemSwap(fromStoreName, alt.store, item);
                        setShowAlternatives(false);
                      }}
                      className="ml-4 bg-blue-600 hover:bg-blue-700 text-white font-bold py-1 px-2 rounded transition"
                    >
                      Select
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </li>
      )}
    </>
  );
};
