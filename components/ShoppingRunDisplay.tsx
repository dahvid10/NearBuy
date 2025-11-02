import React, { useMemo } from 'react';
import type { OptimalRoute, Store } from '../types';
import { ChecklistIcon, CheckCircleIcon, MapPinIcon, XIcon, ExternalLinkIcon, TrophyIcon } from './icons';

interface ShoppingRunDisplayProps {
  route: OptimalRoute;
  allStores: Store[];
  checkedItems: Record<string, Set<string>>;
  onToggleItem: (storeName: string, itemName: string) => void;
  onClearRoute: () => void;
}

export const ShoppingRunDisplay: React.FC<ShoppingRunDisplayProps> = ({ route, allStores, checkedItems, onToggleItem, onClearRoute }) => {

  const totalItems = useMemo(() => route.stops.reduce((sum, stop) => sum + stop.itemsToBuy.length, 0), [route]);
  const totalItemsChecked = useMemo(() => {
    // FIX: Explicitly type the accumulator `sum` as its type was not being inferred correctly.
    return Object.values(checkedItems).reduce((sum: number, itemSet: Set<string>) => sum + itemSet.size, 0);
  }, [checkedItems]);

  const progressPercentage = totalItems > 0 ? (totalItemsChecked / totalItems) * 100 : 0;
  const isRunComplete = totalItems > 0 && totalItemsChecked === totalItems;

  return (
    <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-6 shadow-lg animate-fade-in-up">
      <div className="flex flex-col sm:flex-row justify-between items-start mb-6">
        <div>
          <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-500 to-blue-500 flex items-center">
            <ChecklistIcon />
            <span className="ml-2">Shopping Run</span>
          </h2>
          <p className="text-gray-500 dark:text-gray-400">Track your items as you go.</p>
        </div>
        <button
          onClick={onClearRoute}
          className="mt-3 sm:mt-0 flex items-center justify-center bg-red-600 hover:bg-red-700 disabled:bg-gray-500 text-white font-bold py-2 px-4 rounded-lg transition duration-300"
        >
          <XIcon />
          <span className="ml-2">End Shopping Run</span>
        </button>
      </div>

      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex justify-between mb-1">
          <span className="text-base font-medium text-blue-700 dark:text-white">Overall Progress</span>
          <span className="text-sm font-medium text-blue-700 dark:text-white">{totalItemsChecked} of {totalItems} items</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-4 dark:bg-gray-700">
          <div
            className="bg-blue-600 h-4 rounded-full transition-all duration-500"
            style={{ width: `${progressPercentage}%` }}
          ></div>
        </div>
      </div>

      {isRunComplete ? (
        <div className="text-center bg-green-50 dark:bg-green-900/50 border-2 border-dashed border-green-400 rounded-lg p-8 animate-fade-in-up flex flex-col items-center">
            <TrophyIcon />
            <h3 className="text-3xl font-bold text-green-700 dark:text-green-300 mt-4">Shopping Complete!</h3>
            <p className="text-gray-600 dark:text-gray-400 mt-2">You've checked off all your items. Great job!</p>
            <div className="mt-6 text-lg bg-white dark:bg-gray-800 p-4 rounded-lg">
                <span className="text-gray-700 dark:text-gray-300">Final Cost:</span>
                <span className="ml-2 font-bold text-xl text-green-600 dark:text-green-400">${route.totalCost.toFixed(2)}</span>
            </div>
        </div>
      ) : (
        <div className="space-y-6">
          {route.stops.map((stop, index) => {
            const storeDetails = allStores.find(s => s.name === stop.storeName);
            const itemsForStore = stop.itemsToBuy;
            const checkedItemsForStore = checkedItems[stop.storeName] || new Set();
            const isStoreComplete = itemsForStore.length > 0 && itemsForStore.length === checkedItemsForStore.size;

            return (
              <div key={index} className={`bg-white dark:bg-gray-800 border-l-4 rounded-r-lg p-6 shadow-md transition-all ${isStoreComplete ? 'border-green-500 opacity-70' : 'border-blue-500'}`}>
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center">
                    <span className={`flex items-center justify-center h-8 w-8 rounded-full text-white font-bold mr-3 ${isStoreComplete ? 'bg-green-500' : 'bg-blue-600'}`}>
                      {isStoreComplete ? <CheckCircleIcon className="h-5 w-5" /> : index + 1}
                    </span>
                    <div>
                      <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200">{stop.storeName}</h3>
                      {storeDetails && (
                        <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mt-1">
                          <MapPinIcon />
                          <span className="ml-2">{storeDetails.address}</span>
                          {storeDetails.url && (
                              <a href={storeDetails.url} target="_blank" rel="noopener noreferrer" className="ml-2 p-1 hover:text-blue-500" title="View on map">
                                  <ExternalLinkIcon />
                              </a>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-sm font-semibold text-gray-600 dark:text-gray-300">
                    {checkedItemsForStore.size} / {itemsForStore.length}
                  </div>
                </div>

                <ul className="space-y-3">
                  {itemsForStore.map(item => {
                    const isChecked = checkedItemsForStore.has(item);
                    return (
                      <li key={item}>
                        <label className="flex items-center cursor-pointer p-2 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => onToggleItem(stop.storeName, item)}
                            className="h-6 w-6 rounded bg-gray-100 dark:bg-gray-900 border-gray-300 dark:border-gray-600 text-green-500 focus:ring-green-500 dark:focus:ring-green-600 mr-4 flex-shrink-0"
                          />
                          <span className={`text-lg text-gray-800 dark:text-gray-300 transition-all ${isChecked ? 'line-through text-gray-500 dark:text-gray-500' : ''}`}>
                            {item}
                          </span>
                        </label>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};