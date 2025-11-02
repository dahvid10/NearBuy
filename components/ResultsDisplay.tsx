import React, { useMemo, useState, useEffect } from 'react';
import type { Store, SortOption, OptimalRoute, Item, RouteStop, SearchResult, SavedSearch } from '../types';
import { StoreCard } from './StoreCard';
import { GasStationCard } from './GasStationCard';
import { SkeletonLoader } from './SkeletonLoader';
import { OptimalRouteDisplay } from './OptimalRouteDisplay';
import { RouteIcon, DollarSignIcon, ChevronsUpIcon, ChevronsDownIcon, BookmarkIcon, FolderOpenIcon, TrashIcon, WarningIcon } from './icons';

interface ResultsDisplayProps {
  results: SearchResult[];
  allStores: Store[];
  searchType: 'shopping' | 'gas';
  onItemSwap: (fromStoreName: string, toStore: Store, item: Item) => void;
  isLoading: boolean;
  error: string | null;
  sortOption: SortOption;
  setSortOption: (option: SortOption) => void;
  hasSearched: boolean;
  onGenerateRoute: () => void;
  isRouteLoading: boolean;
  optimalRoute: OptimalRoute | null;
  clearRoute: () => void;
  onRouteStoreSwap: (originalStoreName: string, newStore: Store, itemsToBuy: string[]) => void;
  isOnline: boolean;
  onRemoveStore: (storeName: string) => void;
  isBuildingCustomRoute: boolean;
  onStartCustomRoute: () => void;
  onCancelCustomRoute: () => void;
  onFinalizeCustomRoute: () => void;
  onToggleItemInCustomRoute: (storeName: string, item: Item) => void;
  onToggleAllItemsInCustomRoute: (storeName: string, items: Item[]) => void;
  customRouteStops: RouteStop[];
  customRouteTotalCost: number;
  savedSearches: SavedSearch[];
  onSaveSearch: (name: string) => void;
  onLoadSearch: (search: SavedSearch) => void;
  onDeleteSearch: (id: string) => void;
  missingItems: string[];
}

export const ResultsDisplay: React.FC<ResultsDisplayProps> = ({
  results,
  allStores,
  searchType,
  onItemSwap,
  isLoading,
  error,
  sortOption,
  setSortOption,
  hasSearched,
  onGenerateRoute,
  isRouteLoading,
  optimalRoute,
  clearRoute,
  onRouteStoreSwap,
  isOnline,
  onRemoveStore,
  isBuildingCustomRoute,
  onStartCustomRoute,
  onCancelCustomRoute,
  onFinalizeCustomRoute,
  onToggleItemInCustomRoute,
  onToggleAllItemsInCustomRoute,
  customRouteStops,
  customRouteTotalCost,
  savedSearches,
  onSaveSearch,
  onLoadSearch,
  onDeleteSearch,
  missingItems
}) => {
  const [expandedStores, setExpandedStores] = useState<Set<string>>(new Set());
  const [searchName, setSearchName] = useState('');

  useEffect(() => {
    // When results change (new search, sorting), expand all cards.
    setExpandedStores(new Set(results.map(result => result.name)));
  }, [results]);

  const handleToggleExpand = (storeName: string) => {
    setExpandedStores(prev => {
        const newSet = new Set(prev);
        if (newSet.has(storeName)) {
            newSet.delete(storeName);
        } else {
            newSet.add(storeName);
        }
        return newSet;
    });
  };

  const handleExpandAll = () => {
      setExpandedStores(new Set(results.map(r => r.name)));
  };

  const handleCollapseAll = () => {
      setExpandedStores(new Set());
  };
  
  const handleSaveSearch = () => {
    if (searchName.trim()) {
        onSaveSearch(searchName);
        setSearchName('');
    }
  };

  const allShoppingListItems = useMemo(() => {
    const itemSet = new Set<string>();
    allStores.forEach(store => store.items.forEach(item => itemSet.add(item.name.toLowerCase())));
    return Array.from(itemSet);
  }, [allStores]);

  const customRouteMissingItems = useMemo(() => {
      if (!isBuildingCustomRoute) return [];
      const selectedItems = new Set(customRouteStops.flatMap(stop => stop.itemsToBuy.map(i => i.toLowerCase())));
      return allShoppingListItems.filter(item => !selectedItems.has(item));
  }, [customRouteStops, allShoppingListItems, isBuildingCustomRoute]);
  
  const renderContent = () => {
    if (isLoading && results.length === 0) { // Show skeleton only on initial load
      return <SkeletonLoader />;
    }
    if (error && !optimalRoute) { // Don't show minor errors if route is already displayed
      return <div className="bg-red-100 dark:bg-red-900/50 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg" role="alert">{error}</div>;
    }
    if (hasSearched && results.length === 0 && !isLoading) {
      return (
        <div className="text-center py-10 px-6 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <p className="text-gray-500 dark:text-gray-400">
            No results found. Please try modifying your shopping list or specifying a different location.
          </p>
        </div>
      );
    }
    if (!hasSearched) {
      return <div className="text-center py-10 px-6 bg-gray-50 dark:bg-gray-800 rounded-lg"><p className="text-gray-500 dark:text-gray-400">Perform a search on the 'Shopping List' tab to see results.</p></div>;
    }
    return (
      <div className={`space-y-6 ${isBuildingCustomRoute ? 'pb-24' : ''}`}>
        {results.map((result, index) => {
          if (result.type === 'gas') {
            return <GasStationCard key={`${result.name}-${index}`} station={result} />;
          }
          return (
            <StoreCard 
              key={`${result.name}-${index}`} 
              store={result} 
              allStores={allStores}
              onItemSwap={onItemSwap}
              onRemove={onRemoveStore}
              isBuildingCustomRoute={isBuildingCustomRoute}
              onToggleItemInCustomRoute={onToggleItemInCustomRoute}
              onToggleAllItemsInCustomRoute={onToggleAllItemsInCustomRoute}
              customRouteStops={customRouteStops}
              isExpanded={expandedStores.has(result.name)}
              onToggleExpand={() => handleToggleExpand(result.name)}
            />
          );
        })}
        {isLoading && <SkeletonLoader />}
      </div>
    );
  };

  return (
    <div>
      <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
        <h2 className="text-2xl font-semibold text-blue-600 dark:text-blue-400">Shopping Options</h2>
        <div className="flex flex-wrap items-center gap-2">
            {results.length > 1 && !isLoading && !optimalRoute && !isBuildingCustomRoute && searchType === 'shopping' && (
            <div className="flex flex-wrap gap-2">
                <button
                onClick={onGenerateRoute}
                disabled={isRouteLoading || !isOnline}
                title={!isOnline ? "You must be online to generate a route." : "Generate an optimal shopping route"}
                className="flex items-center justify-center bg-purple-600 hover:bg-purple-700 disabled:bg-gray-500 dark:disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-2 px-4 rounded-lg transition duration-300"
                >
                {isRouteLoading ? (
                    <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Generating...
                    </>
                ) : (
                    <>
                    <RouteIcon />
                    <span className="ml-2">Generate Optimal Route</span>
                    </>
                )}
                </button>
                <button
                    onClick={onStartCustomRoute}
                    disabled={!isOnline}
                    title={!isOnline ? "You must be online." : "Create your own shopping route"}
                    className="flex items-center justify-center bg-green-600 hover:bg-green-700 disabled:bg-gray-500 dark:disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-2 px-4 rounded-lg transition duration-300"
                >
                    <RouteIcon />
                    <span className="ml-2">Create Custom Route</span>
                </button>
            </div>
            )}
            {results.length > 0 && (
                <div className="flex items-center gap-2">
                    <div className="flex items-center space-x-1 bg-gray-100 dark:bg-gray-900 p-1 rounded-lg">
                        <button
                            onClick={handleExpandAll}
                            className="p-2 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md transition-colors"
                            title="Expand All"
                        >
                            <ChevronsDownIcon />
                        </button>
                        <button
                            onClick={handleCollapseAll}
                            className="p-2 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md transition-colors"
                            title="Collapse All"
                        >
                            <ChevronsUpIcon />
                        </button>
                    </div>
                    <div className="flex items-center space-x-2 bg-gray-100 dark:bg-gray-900 p-1 rounded-lg">
                        {searchType === 'shopping' && (
                            <button
                                onClick={() => setSortOption('subtotal')}
                                className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${sortOption === 'subtotal' ? 'bg-blue-600 text-white' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
                            >
                                Sort by Price
                            </button>
                        )}
                        {searchType === 'gas' && (
                            <button
                                onClick={() => setSortOption('gas_price')}
                                className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${sortOption === 'gas_price' ? 'bg-blue-600 text-white' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
                            >
                                Sort by Gas Price
                            </button>
                        )}
                        <button
                        onClick={() => setSortOption('distance')}
                        className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${sortOption === 'distance' ? 'bg-blue-600 text-white' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
                        >
                        Sort by Distance
                        </button>
                        <button
                        onClick={() => setSortOption('reviews')}
                        className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${sortOption === 'reviews' ? 'bg-blue-600 text-white' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
                        >
                        Sort by Reviews
                        </button>
                    </div>
                </div>
            )}
        </div>
      </div>
      
      {hasSearched && results.length > 0 && !optimalRoute && !isBuildingCustomRoute && (
        <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-lg">
            <h3 className="text-lg font-semibold mb-3 text-purple-600 dark:text-purple-400">Manage Search Results</h3>
            <div className="flex space-x-2 mb-4">
            <input
                type="text"
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
                placeholder="Name current results to save..."
                className="flex-grow bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-md p-2 text-gray-900 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={isLoading}
            />
            <button
                onClick={handleSaveSearch}
                disabled={isLoading || !searchName.trim()}
                className="flex-shrink-0 flex items-center justify-center bg-blue-600 hover:bg-blue-700 disabled:bg-gray-500 dark:disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-2 px-4 rounded-lg transition duration-300"
                title="Save search results"
            >
                <BookmarkIcon />
            </button>
            </div>
            <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
            {savedSearches.length > 0 ? (
                <ul className="space-y-2 max-h-40 overflow-y-auto pr-2">
                {savedSearches.map((search) => (
                    <li key={search.id} className="flex items-center justify-between bg-white dark:bg-gray-900 p-2 rounded-md group hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                    <span className="text-gray-800 dark:text-gray-300 truncate pr-2">{search.name}</span>
                    <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                        <button
                        onClick={() => onLoadSearch(search)}
                        className="p-2 text-gray-500 dark:text-gray-400 hover:text-green-500 dark:hover:text-green-400 transition"
                        aria-label={`Load search results for ${search.name}`}
                        title="Load Results"
                        >
                        <FolderOpenIcon />
                        </button>
                        <button
                        onClick={() => onDeleteSearch(search.id)}
                        className="p-2 text-gray-500 dark:text-gray-400 hover:text-red-500 transition"
                        aria-label={`Delete search results for ${search.name}`}
                        title="Delete Results"
                        >
                        <TrashIcon />
                        </button>
                    </div>
                    </li>
                ))}
                </ul>
            ) : (
                <p className="text-gray-500 dark:text-gray-500 text-sm text-center py-2">You have no saved search results.</p>
            )}
            </div>
        </div>
      )}

      {missingItems.length > 0 && !isLoading && !optimalRoute && (
          <div className="bg-yellow-100 dark:bg-yellow-800 border-l-4 border-yellow-500 text-yellow-800 dark:text-yellow-100 p-4 mb-6 rounded-r-lg shadow-lg" role="alert">
              <div className="flex">
                  <div className="py-1"><WarningIcon /></div>
                  <div className="ml-3">
                      <p className="font-bold">Items Not Found</p>
                      <p className="text-sm">The following items from your list could not be found at the queried stores:</p>
                      <ul className="list-disc list-inside mt-2 text-sm">
                          {missingItems.map((item, index) => <li key={index}>{item}</li>)}
                      </ul>
                  </div>
              </div>
          </div>
      )}
      
      {optimalRoute && (
        <div className="mb-6">
          <OptimalRouteDisplay
            route={optimalRoute}
            onClear={clearRoute}
            allStores={allStores}
            onStoreSwap={onRouteStoreSwap}
          />
        </div>
      )}
      {error && optimalRoute && <div className="bg-red-100 dark:bg-red-900/50 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg mb-6" role="alert">{error}</div>}

      {renderContent()}

       {isBuildingCustomRoute && (
        <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t-2 border-green-500 shadow-lg p-4 z-40 animate-slide-up">
            <div className="container mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex-grow">
                    <h3 className="text-lg font-bold text-green-600 dark:text-green-400">Custom Route Builder</h3>
                    {customRouteMissingItems.length > 0 ? (
                        <p className="text-yellow-600 dark:text-yellow-400 text-xs">Missing {customRouteMissingItems.length} items from your list.</p>
                    ) : (
                        <p className="text-green-600 dark:text-green-400 text-xs">You've selected all items!</p>
                    )}
                </div>
                <div className="flex items-center space-x-2 text-lg">
                    <DollarSignIcon />
                    <span className="font-bold text-gray-900 dark:text-white">Total: ${customRouteTotalCost.toFixed(2)}</span>
                </div>
                <div className="flex space-x-3">
                    <button onClick={onCancelCustomRoute} className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-300 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition">Cancel</button>
                    <button onClick={onFinalizeCustomRoute} disabled={customRouteStops.length === 0} className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-500 dark:disabled:bg-gray-600 transition">Finalize Route</button>
                </div>
            </div>
            <style>{`
              @keyframes slide-up {
                from { transform: translateY(100%); }
                to { transform: translateY(0); }
              }
              .animate-slide-up { animation: slide-up 0.3s ease-out forwards; }
            `}</style>
        </div>
      )}

    </div>
  );
};