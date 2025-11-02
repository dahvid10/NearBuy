import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { ShoppingListInput } from './components/ShoppingListInput';
import { ResultsDisplay } from './components/ResultsDisplay';
import { ShoppingRunDisplay } from './components/ShoppingRunDisplay';
import { FeedbackModal } from './components/FeedbackModal';
import { findShoppingOptionsStream, generateOptimalRoute, findGasPricesStream } from './services/geminiService';
import { useLocation } from './hooks/useLocation';
import { useSavedLists } from './hooks/useSavedLists';
import { useSavedSearches } from './hooks/useSavedSearches';
import { useOnlineStatus } from './hooks/useOnlineStatus';
import { useTheme } from './hooks/useTheme';
import type { Store, SortOption, OptimalRoute, Item, Coordinates, RouteStop, SearchResult, GasStation, SavedSearch } from './types';
import { LogoIcon, WarningIcon, SunIcon, MoonIcon, ChecklistIcon } from './components/icons';

interface LocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (location: string) => void;
}

const LocationModal: React.FC<LocationModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [location, setLocation] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (location.trim()) {
      onSubmit(location);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50 transition-opacity" role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md mx-4 border border-gray-300 dark:border-gray-700 animate-fade-in-up">
        <div className="flex justify-between items-center mb-4">
          <h2 id="modal-title" className="text-2xl font-bold text-green-600 dark:text-green-400">Enter Your Location</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-800 dark:hover:text-white text-2xl leading-none">&times;</button>
        </div>
        <p className="text-gray-600 dark:text-gray-400 mb-4">To find local stores, please provide your city, state, or zip code.</p>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="e.g., San Francisco, CA, 94103, or 'Coit Tower'"
            className="w-full bg-gray-100 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-md p-3 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition duration-200"
            autoFocus
          />
          <div className="mt-6 flex justify-end space-x-3">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-300 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition">
              Cancel
            </button>
            <button type="submit" disabled={!location.trim()} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-500 dark:disabled:bg-gray-600 disabled:cursor-not-allowed transition">
              Search
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};


const LocationPermissionBanner: React.FC = () => {
  return (
    <div className="bg-yellow-100 dark:bg-yellow-800 border-l-4 border-yellow-500 dark:border-yellow-500 text-yellow-800 dark:text-yellow-100 p-4 my-6 rounded-r-lg shadow-lg flex" role="alert">
      <div className="py-1">
        <WarningIcon />
      </div>
      <div className="ml-3">
        <p className="font-bold">Location Access Denied</p>
        <p className="text-sm">To find local stores, please enable location permissions in your browser settings, or enter your location manually when you search.</p>
      </div>
    </div>
  );
};


const App: React.FC = () => {
  const [shoppingList, setShoppingList] = useState<string>('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [sortOption, setSortOption] = useState<SortOption>('subtotal');
  const [hasSearched, setHasSearched] = useState<boolean>(false);
  const [optimalRoute, setOptimalRoute] = useState<OptimalRoute | null>(null);
  const [isRouteLoading, setIsRouteLoading] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'list' | 'options' | 'run'>('list');
  const [isLocationModalOpen, setIsLocationModalOpen] = useState<boolean>(false);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState<boolean>(false);
  const [isBuildingCustomRoute, setIsBuildingCustomRoute] = useState<boolean>(false);
  const [customRouteStops, setCustomRouteStops] = useState<RouteStop[]>([]);
  const [startLocation, setStartLocation] = useState<string>('');
  const [searchType, setSearchType] = useState<'shopping' | 'gas'>('shopping');
  const [checkedItems, setCheckedItems] = useState<Record<string, Set<string>>>({});
  const [missingItems, setMissingItems] = useState<string[]>([]);

  const [theme, toggleTheme] = useTheme();
  const { location, error: locationError, getLocation, permissionState } = useLocation();
  const { savedLists, saveList, deleteList } = useSavedLists();
  const { savedSearches, saveSearch, deleteSearch } = useSavedSearches();
  const isOnline = useOnlineStatus();

  const executeSearch = useCallback(async (searchLocation: Coordinates | string) => {
    if (!isOnline) {
      setError("You must be online to search for stores.");
      setIsLoading(false);
      return;
    }

    try {
      const onResultFound = (result: SearchResult) => {
        setResults(prevResults => [...prevResults, result]);
      };

      const onStreamEnd = (groundingChunks: any[]) => {
        setResults(prevResults => {
            let finalResults = [...prevResults];
            if (groundingChunks.length > 0) {
              finalResults = prevResults.map(result => {
                const matchedChunk = groundingChunks.find(chunk =>
                  chunk.maps?.title && result.name.toLowerCase().includes(chunk.maps.title.toLowerCase())
                );
                if (matchedChunk?.maps?.uri) {
                  return { ...result, url: matchedChunk.maps.uri };
                }
                return { ...result, url: result.url || null };
              });
            }

            const allFoundItems = new Set<string>();
            finalResults.forEach(result => {
                if (result.type === 'store') {
                    result.items.forEach(item => {
                        const lowerCaseItemName = item.name.toLowerCase().trim();
                        allFoundItems.add(lowerCaseItemName);
                    });
                }
            });
            
            const originalListItems = shoppingList
                .split('\n')
                .map(line => line.replace(/^(-\s*|\*\s*|\d+\.\s*)/, '').trim().toLowerCase())
                .filter(line => line.length > 0);
            
            const notFound = originalListItems.filter(item => {
                const itemWords = item.split(/\s+/);
                return ![...allFoundItems].some(foundItem => 
                    itemWords.every(word => foundItem.includes(word))
                );
            });

            setMissingItems(notFound);

            return finalResults;
        });
      };
      
      await findShoppingOptionsStream(shoppingList, searchLocation, onResultFound, onStreamEnd);

    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(`An error occurred: ${err.message}`);
      } else {
        setError('An unknown error occurred.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [shoppingList, isOnline]);
  
  const executeGasSearch = useCallback(async (searchLocation: Coordinates | string) => {
    if (!isOnline) {
      setError("You must be online to search for gas stations.");
      setIsLoading(false);
      return;
    }

    try {
      const onResultFound = (result: SearchResult) => {
        setResults(prevResults => [...prevResults, result]);
      };

      const onStreamEnd = (groundingChunks: any[]) => {
        if (groundingChunks.length > 0) {
          setResults(prevResults => {
            return prevResults.map(result => {
              const matchedChunk = groundingChunks.find(chunk =>
                chunk.maps?.title && result.name.toLowerCase().includes(chunk.maps.title.toLowerCase())
              );
              if (matchedChunk?.maps?.uri) {
                return { ...result, url: matchedChunk.maps.uri };
              }
              return { ...result, url: result.url || null };
            });
          });
        }
      };
      
      await findGasPricesStream(searchLocation, onResultFound, onStreamEnd);

    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(`An error occurred: ${err.message}`);
      } else {
        setError('An unknown error occurred.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [isOnline]);

  const handleSearch = useCallback(async () => {
    if (!isOnline) {
        setError("You must be online to search for stores.");
        return;
    }
    
    setSearchType('shopping');
    setSortOption('subtotal');
    setIsLoading(true);
    setError(null);
    setHasSearched(true);
    setResults([]);
    setOptimalRoute(null);
    setMissingItems([]);
    setActiveTab('options');

    if (startLocation.trim()) {
      executeSearch(startLocation.trim());
      return;
    }

    try {
        const currentLoc = await getLocation();
        if (currentLoc) {
            executeSearch(currentLoc);
        } else {
            // This case should theoretically not be hit if getLocation rejects on failure.
            setError("Your location could not be determined. Please enter one manually.");
            setIsLoading(false);
            setActiveTab('options');
        }
    } catch (err) {
        // This is the primary path for location errors.
        const errorMessage = (err instanceof Error) ? err.message : "Could not get your location. Please enter one manually.";
        setError(errorMessage);
        setIsLoading(false);
        setActiveTab('options');
    }
  }, [isOnline, getLocation, executeSearch, startLocation]);
  
    const handleGasSearch = useCallback(async () => {
    if (!isOnline) {
      setError("You must be online to search for gas stations.");
      return;
    }
    
    setSearchType('gas');
    setSortOption('gas_price');
    setIsLoading(true);
    setError(null);
    setHasSearched(true);
    setResults([]);
    setOptimalRoute(null);
    setMissingItems([]);
    setActiveTab('options');

    if (startLocation.trim()) {
      executeGasSearch(startLocation.trim());
      return;
    }

    try {
      const currentLoc = await getLocation();
      if (currentLoc) {
        executeGasSearch(currentLoc);
      } else {
        // This case should theoretically not be hit.
        setError("Your location could not be determined. Please enter one manually.");
        setIsLoading(false);
        setActiveTab('options');
      }
    } catch (err) {
        const errorMessage = (err instanceof Error) ? err.message : "Could not get your location. Please enter one manually.";
        setError(errorMessage);
        setIsLoading(false);
        setActiveTab('options');
    }
  }, [isOnline, getLocation, executeGasSearch, startLocation]);

  const handleModalSearchSubmit = (location: string) => {
    if (location.trim()) {
        setIsLocationModalOpen(false);
        setIsLoading(true);
        setError(null);
        setHasSearched(true);
        setResults([]);
        setOptimalRoute(null);
        setMissingItems([]);
        setActiveTab('options');
        if (searchType === 'gas') {
            executeGasSearch(location);
        } else {
            executeSearch(location);
        }
    }
  };


  const handleGenerateRoute = useCallback(async () => {
    if (!isOnline) {
        setError("You must be online to generate a route.");
        return;
    }
    const stores = results.filter(r => r.type === 'store') as Store[];
    if (stores.length < 2) return;
    setIsRouteLoading(true);
    setError(null);
    try {
      const route = await generateOptimalRoute(stores, shoppingList);
      setOptimalRoute(route);
      setCheckedItems({});
      setActiveTab('run');
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(`Failed to generate route: ${err.message}`);
      } else {
        setError('An unknown error occurred while generating the route.');
      }
    } finally {
      setIsRouteLoading(false);
    }
  }, [results, shoppingList, isOnline]);

  const clearRoute = () => {
    setOptimalRoute(null);
    setActiveTab('options');
    setCheckedItems({});
  };

  const handleToggleCheckedItem = (storeName: string, itemName: string) => {
    setCheckedItems(prev => {
        const newChecked = { ...prev };
        const storeSet = new Set(newChecked[storeName]);

        if (storeSet.has(itemName)) {
            storeSet.delete(itemName);
        } else {
            storeSet.add(itemName);
        }

        newChecked[storeName] = storeSet;
        return newChecked;
    });
  };
  
  const handleItemSwap = useCallback((fromStoreName: string, toStore: Store, item: Item) => {
    const newResults = results.map(result => {
      if (result.type === 'store') {
        if (result.name === toStore.name) {
          const newItems = [...result.items, item];
          const newSubtotal = newItems.reduce((acc, curr) => acc + curr.price, 0);
          return { ...result, items: newItems, subtotal: newSubtotal };
        }
        if (result.name === fromStoreName) {
          const newItems = result.items.filter(i => i.name.toLowerCase() !== item.name.toLowerCase());
          const newSubtotal = newItems.reduce((acc, curr) => acc + curr.price, 0);
          return { ...result, items: newItems, subtotal: newSubtotal };
        }
      }
      return result;
    }).filter(result => result.type === 'gas' || (result.type === 'store' && result.items.length > 0)); 

    setResults(newResults);
    setOptimalRoute(null);
  }, [results]);

  const handleRouteStoreSwap = useCallback((originalStoreName: string, newStore: Store, itemsToBuy: string[]) => {
    if (!optimalRoute) return;

    const newRoute = JSON.parse(JSON.stringify(optimalRoute));
    const stores = results.filter(r => r.type === 'store') as Store[];

    const getStopSubtotal = (store: Store | undefined, items: string[]): number => {
      if (!store) return 0;
      return items.reduce((total, itemName) => {
        const item = store.items.find(i => i.name.toLowerCase() === itemName.toLowerCase());
        return total + (item?.price || 0);
      }, 0);
    };

    const originalStore = stores.find(s => s.name === originalStoreName);
    const originalCost = getStopSubtotal(originalStore, itemsToBuy);
    const newCost = getStopSubtotal(newStore, itemsToBuy);
    const costDifference = newCost - originalCost;

    newRoute.totalCost += costDifference;
    newRoute.stops = newRoute.stops.map((stop: { storeName: string; }) => 
        stop.storeName === originalStoreName 
        ? { ...stop, storeName: newStore.name } 
        : stop
    );
    newRoute.totalDistance = 'Manually Modified';
    newRoute.isModified = true;
    
    setOptimalRoute(newRoute);
  }, [optimalRoute, results]);

  const handleRemoveStore = useCallback((storeNameToRemove: string) => {
    setResults(prevResults => prevResults.filter(result => result.name !== storeNameToRemove));
    setOptimalRoute(null);
  }, []);

  const handleStartCustomRoute = () => {
    setOptimalRoute(null);
    setCustomRouteStops([]);
    setIsBuildingCustomRoute(true);
  };

  const handleCancelCustomRoute = () => {
    setIsBuildingCustomRoute(false);
    setCustomRouteStops([]);
  };

  const handleToggleItemInCustomRoute = useCallback((storeName: string, item: Item) => {
    setCustomRouteStops(prevStops => {
      const newStops = JSON.parse(JSON.stringify(prevStops));
      let storeStop = newStops.find((s: RouteStop) => s.storeName === storeName);

      if (!storeStop) {
        storeStop = { storeName, itemsToBuy: [] };
        newStops.push(storeStop);
      }

      const itemIndex = storeStop.itemsToBuy.findIndex((i: string) => i.toLowerCase() === item.name.toLowerCase());

      if (itemIndex > -1) {
        storeStop.itemsToBuy.splice(itemIndex, 1);
      } else {
        storeStop.itemsToBuy.push(item.name);
      }

      return newStops.filter((s: RouteStop) => s.itemsToBuy.length > 0);
    });
  }, []);
  
  const handleToggleAllItemsInCustomRoute = useCallback((storeName: string, items: Item[]) => {
    setCustomRouteStops(prevStops => {
        const newStops = JSON.parse(JSON.stringify(prevStops));
        const storeStopIndex = newStops.findIndex((s: RouteStop) => s.storeName === storeName);
        
        const allItemNames = items.map(item => item.name);

        const allItemNamesLower = new Set(allItemNames.map(name => name.toLowerCase()));
        const selectedItemsLower = new Set(storeStopIndex > -1 ? newStops[storeStopIndex].itemsToBuy.map((i: string) => i.toLowerCase()) : []);
        
        const allItemsAlreadySelected = 
            allItemNamesLower.size > 0 &&
            allItemNamesLower.size === selectedItemsLower.size &&
            [...allItemNamesLower].every(name => selectedItemsLower.has(name));

        if (allItemsAlreadySelected) {
            if (storeStopIndex > -1) {
                newStops[storeStopIndex].itemsToBuy = [];
            }
        } else {
            if (storeStopIndex > -1) {
                newStops[storeStopIndex].itemsToBuy = allItemNames;
            } else {
                newStops.push({ storeName, itemsToBuy: allItemNames });
            }
        }

        return newStops.filter((s: RouteStop) => s.itemsToBuy.length > 0);
    });
  }, []);

  const customRouteTotalCost = useMemo(() => {
    if (!isBuildingCustomRoute) return 0;
    const stores = results.filter(r => r.type === 'store') as Store[];
    return customRouteStops.reduce((total, stop) => {
      const store = stores.find(s => s.name === stop.storeName);
      if (!store) return total;

      const stopTotal = stop.itemsToBuy.reduce((stopSum, itemName) => {
        const item = store.items.find(i => i.name.toLowerCase() === itemName.toLowerCase());
        return stopSum + (item?.price || 0);
      }, 0);

      return total + stopTotal;
    }, 0);
  }, [customRouteStops, results, isBuildingCustomRoute]);

  const handleFinalizeCustomRoute = () => {
    if (customRouteStops.length === 0) return;
    const finalRoute: OptimalRoute = {
      stops: customRouteStops,
      totalCost: customRouteTotalCost,
      totalDistance: 'Custom Route',
      isModified: true,
    };
    setOptimalRoute(finalRoute);
    setIsBuildingCustomRoute(false);
    setCustomRouteStops([]);
    setCheckedItems({});
    setActiveTab('run');
  };

  const handleSaveSearch = (name: string) => {
    saveSearch(name, {
      shoppingList,
      results,
      searchType,
    });
  };

  const handleLoadSearch = (search: SavedSearch) => {
    setShoppingList(search.shoppingList);
    setResults(search.results);
    setSearchType(search.searchType);
    setSortOption(search.searchType === 'gas' ? 'gas_price' : 'subtotal');
    setHasSearched(true);
    setOptimalRoute(null);
    clearRoute();
    setActiveTab('options');
  };

  const sortedResults = useMemo(() => {
    if (!results) return [];

    const getRegularPrice = (station: GasStation): number => {
        const regular = station.prices.find(p => p.grade.toLowerCase() === 'regular');
        return regular ? regular.price : Infinity;
    };
    
    return [...results].sort((a, b) => {
      if (sortOption === 'subtotal') {
        if (a.type === 'store' && b.type === 'store') return a.subtotal - b.subtotal;
        if (a.type === 'store') return -1;
        if (b.type === 'store') return 1;
        return 0;
      }
      if (sortOption === 'gas_price') {
          if (a.type === 'gas' && b.type === 'gas') return getRegularPrice(a) - getRegularPrice(b);
          if (a.type === 'gas') return -1;
          if (b.type === 'gas') return 1;
          return 0;
      }
      if (sortOption === 'distance') {
        const distA = parseFloat(a.distance.split(' ')[0]);
        const distB = parseFloat(b.distance.split(' ')[0]);
        return distA - distB;
      }
      if (sortOption === 'reviews') {
        const getRating = (reviewString: string) => parseFloat(reviewString.split(' ')[0]);
        const ratingA = getRating(a.reviews);
        const ratingB = getRating(b.reviews);
        return (isNaN(ratingB) ? 0 : ratingB) - (isNaN(ratingA) ? 0 : ratingA);
      }
      return 0;
    });
  }, [results, sortOption]);
  
  const handleFeedback = useCallback(() => {
    setIsFeedbackModalOpen(true);
  }, []);

  const allStoresForDisplay = useMemo(() => results.filter(r => r.type === 'store') as Store[], [results]);

  const tabButtonClasses = (tabName: 'list' | 'options' | 'run') => 
    `px-4 py-2 text-lg font-semibold rounded-t-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-100 dark:focus:ring-offset-gray-900 focus:ring-blue-500`;

  const activeTabClasses = 'bg-gray-100 dark:bg-gray-800 text-green-600 dark:text-green-400';
  const inactiveTabClasses = 'bg-gray-200/50 dark:bg-gray-800/50 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700/80';
  const disabledTabClasses = 'text-gray-400 dark:text-gray-600 bg-gray-200/20 dark:bg-gray-800/20 cursor-not-allowed';

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-sans">
      <style>{`
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fade-out-down {
          from { opacity: 1; transform: translateY(0); }
          to { opacity: 0; transform: translateY(10px); }
        }
        .animate-fade-in-up { animation: fade-in-up 0.3s ease-out forwards; }
        .animate-fade-out-down { animation: fade-out-down 0.3s ease-out forwards; }
      `}</style>
      <LocationModal 
        isOpen={isLocationModalOpen}
        onClose={() => setIsLocationModalOpen(false)}
        onSubmit={handleModalSearchSubmit}
      />
      <FeedbackModal
        isOpen={isFeedbackModalOpen}
        onClose={() => setIsFeedbackModalOpen(false)}
        email="info.nearbuy.app@gmail.com"
      />
      {!isOnline && (
        <div className="bg-yellow-100 dark:bg-yellow-800 border-b border-yellow-300 dark:border-yellow-600 text-yellow-800 dark:text-white text-center p-2 fixed top-0 left-0 right-0 z-50 flex items-center justify-center shadow-lg" role="status">
          <WarningIcon />
          <span className="ml-2 font-semibold">Offline Mode:</span>
          <span className="ml-1">Search and route features are disabled. You can still manage saved lists.</span>
        </div>
      )}
      <div className={`container mx-auto px-4 py-8 ${!isOnline ? 'pt-20' : ''}`}>
        <header className="flex items-center justify-center mb-8 relative">
          <LogoIcon />
          <h1 className="text-4xl sm:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-500 to-blue-600 dark:from-green-400 dark:to-blue-500 ml-3">
            Near Buy
          </h1>
          <button
            onClick={toggleTheme}
            className="absolute right-0 p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            aria-label="Toggle theme"
            title="Toggle theme"
          >
            {theme === 'light' ? <MoonIcon /> : <SunIcon />}
          </button>
        </header>

        {permissionState === 'denied' && <LocationPermissionBanner />}

        <div className="max-w-7xl mx-auto">
          <div className="flex border-b border-gray-300 dark:border-gray-700 mb-6" role="tablist" aria-label="Main navigation">
            <button
              id="tab-list"
              className={`${tabButtonClasses('list')} ${activeTab === 'list' ? activeTabClasses : inactiveTabClasses}`}
              onClick={() => setActiveTab('list')}
              aria-controls="panel-list"
              aria-selected={activeTab === 'list'}
              role="tab"
            >
              List
            </button>
            <button
              id="tab-options"
              className={`${tabButtonClasses('options')} ${hasSearched || results.length > 0 ? (activeTab === 'options' ? activeTabClasses : inactiveTabClasses) : disabledTabClasses}`}
              onClick={() => (hasSearched || results.length > 0) && setActiveTab('options')}
              disabled={!hasSearched && results.length === 0}
              aria-controls="panel-options"
              aria-selected={activeTab === 'options'}
              role="tab"
            >
              Options
            </button>
            {optimalRoute && (
              <button
                id="tab-run"
                className={`${tabButtonClasses('run')} ${activeTab === 'run' ? activeTabClasses : inactiveTabClasses}`}
                onClick={() => setActiveTab('run')}
                aria-controls="panel-run"
                aria-selected={activeTab === 'run'}
                role="tab"
              >
                Run
              </button>
            )}
          </div>

          <div role="tabpanel" id="panel-list" aria-labelledby="tab-list" hidden={activeTab !== 'list'}>
            <ShoppingListInput
              shoppingList={shoppingList}
              setShoppingList={setShoppingList}
              onSearch={handleSearch}
              onGasSearch={handleGasSearch}
              isLoading={isLoading}
              savedLists={savedLists}
              onSave={saveList}
              onDelete={deleteList}
              isOnline={isOnline}
              isLocationDenied={permissionState === 'denied'}
              startLocation={startLocation}
              setStartLocation={setStartLocation}
            />
          </div>

          <div role="tabpanel" id="panel-options" aria-labelledby="tab-options" hidden={activeTab !== 'options'}>
            <ResultsDisplay
              results={sortedResults}
              allStores={allStoresForDisplay}
              searchType={searchType}
              isLoading={isLoading}
              error={error}
              sortOption={sortOption}
              setSortOption={setSortOption}
              hasSearched={hasSearched}
              onGenerateRoute={handleGenerateRoute}
              isRouteLoading={isRouteLoading}
              optimalRoute={optimalRoute}
              clearRoute={clearRoute}
              onItemSwap={handleItemSwap}
              onRouteStoreSwap={handleRouteStoreSwap}
              isOnline={isOnline}
              onRemoveStore={handleRemoveStore}
              isBuildingCustomRoute={isBuildingCustomRoute}
              onStartCustomRoute={handleStartCustomRoute}
              onCancelCustomRoute={handleCancelCustomRoute}
              onFinalizeCustomRoute={handleFinalizeCustomRoute}
              onToggleItemInCustomRoute={handleToggleItemInCustomRoute}
              onToggleAllItemsInCustomRoute={handleToggleAllItemsInCustomRoute}
              customRouteStops={customRouteStops}
              customRouteTotalCost={customRouteTotalCost}
              savedSearches={savedSearches}
              onSaveSearch={handleSaveSearch}
              onLoadSearch={handleLoadSearch}
              onDeleteSearch={deleteSearch}
              missingItems={missingItems}
            />
          </div>

          <div role="tabpanel" id="panel-run" aria-labelledby="tab-run" hidden={activeTab !== 'run'}>
            {optimalRoute && (
              <ShoppingRunDisplay
                route={optimalRoute}
                allStores={allStoresForDisplay}
                checkedItems={checkedItems}
                onToggleItem={handleToggleCheckedItem}
                onClearRoute={clearRoute}
              />
            )}
          </div>
        </div>
        
        <footer className="text-center mt-8 py-4 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400">
          <div className="mb-2">
            <span>Near Buy v1.2.0</span>
            <span className="mx-2" aria-hidden="true">|</span>
            <button onClick={handleFeedback} className="hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 rounded">Send Feedback</button>
          </div>
          <p className="max-w-4xl mx-auto">
            <strong>Disclaimer:</strong> All prices, distances, and store information are AI-generated estimates and are not guaranteed. Information may be inaccurate or outdated. Please verify all details directly with the respective stores before making a trip.
          </p>
        </footer>
      </div>
    </div>
  );
};

export default App;