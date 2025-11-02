import React, { useMemo, useState } from 'react';
import type { OptimalRoute, Store } from '../types';
import { ChecklistIcon, CheckCircleIcon, MapPinIcon, XIcon, ExternalLinkIcon, TrophyIcon, MapIcon, ShareIcon } from './icons';

interface MapSelectionModalProps {
    isOpen: boolean;
    onClose: () => void;
    route: OptimalRoute;
    allStores: Store[];
}

const MapSelectionModal: React.FC<MapSelectionModalProps> = ({ isOpen, onClose, route, allStores }) => {
    if (!isOpen) return null;

    const addresses = useMemo(() => {
        return route.stops
        .map(stop => {
            const store = allStores.find(s => s.name === stop.storeName);
            return store ? encodeURIComponent(store.address) : null;
        })
        .filter((address): address is string => address !== null);
    }, [route.stops, allStores]);
    
    const firstStopName = useMemo(() => {
        if (route.stops.length > 0 && addresses.length > 0) {
            return route.stops[0].storeName;
        }
        return 'your first stop';
    }, [route.stops, addresses]);

    const handleOpen = (mapService: 'google' | 'apple' | 'waze') => {
        if (addresses.length === 0) return;
    
        let url = '';
        switch(mapService) {
            case 'google':
                url = `https://www.google.com/maps/dir/${addresses.join('/')}`;
                break;
            case 'apple':
                // Apple Maps URL scheme uses `daddr` for destination. `q` is a general query.
                url = `https://maps.apple.com/?daddr=${addresses[0]}`;
                break;
            case 'waze':
                url = `https://www.waze.com/ul?q=${addresses[0]}&navigate=yes`;
                break;
        }
    
        if (url) {
            window.open(url, '_blank', 'noopener,noreferrer');
        }
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-start justify-center z-50 transition-opacity pt-24" role="dialog" aria-modal="true" aria-labelledby="map-modal-title">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md mx-4 border border-gray-300 dark:border-gray-700 animate-fade-in-up">
                <div className="flex justify-between items-center mb-4">
                    <h2 id="map-modal-title" className="text-2xl font-bold text-blue-600 dark:text-blue-400">Visualize Route</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-800 dark:hover:text-white text-2xl leading-none" aria-label="Close">&times;</button>
                </div>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                    Only Google Maps supports the full multi-stop route. Other apps will navigate you directly to your first stop: <strong className="text-gray-700 dark:text-gray-300">{firstStopName}</strong>.
                </p>
                <div className="space-y-3">
                    <button onClick={() => handleOpen('google')} className="w-full text-lg text-white font-semibold bg-blue-600 hover:bg-blue-700 rounded-lg py-3 transition-colors">
                        Open Full Route in Google Maps
                    </button>
                    <button onClick={() => handleOpen('apple')} className="w-full text-lg text-white font-semibold bg-gray-700 hover:bg-gray-600 rounded-lg py-3 transition-colors">
                        Navigate with Apple Maps
                    </button>
                    <button onClick={() => handleOpen('waze')} className="w-full text-lg text-white font-semibold bg-cyan-500 hover:bg-cyan-600 rounded-lg py-3 transition-colors">
                        Navigate with Waze
                    </button>
                </div>
                <div className="mt-6 flex justify-end">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-300 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition">
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
};


interface ShoppingRunDisplayProps {
  route: OptimalRoute;
  allStores: Store[];
  checkedItems: Record<string, Set<string>>;
  onToggleItem: (storeName: string, itemName: string) => void;
  onClearRoute: () => void;
}

export const ShoppingRunDisplay: React.FC<ShoppingRunDisplayProps> = ({ route, allStores, checkedItems, onToggleItem, onClearRoute }) => {
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const totalItems = useMemo(() => route.stops.reduce((sum, stop) => sum + stop.itemsToBuy.length, 0), [route]);
  const totalItemsChecked = useMemo(() => {
    // FIX: Explicitly type the accumulator `sum` as its type was not being inferred correctly.
    return Object.values(checkedItems).reduce((sum: number, itemSet: Set<string>) => sum + itemSet.size, 0);
  }, [checkedItems]);

  const progressPercentage = totalItems > 0 ? (totalItemsChecked / totalItems) * 100 : 0;
  const isRunComplete = totalItems > 0 && totalItemsChecked === totalItems;

  const handleShare = async () => {
    const routeText = `My Shopping Route:\n\nTotal Estimated Cost: $${route.totalCost.toFixed(2)}\nEstimated Distance: ${route.totalDistance}\n\n${route.stops.map((stop, index) => {
      const storeDetails = allStores.find(s => s.name === stop.storeName);
      const addressLine = storeDetails ? `${storeDetails.address}\n` : '';
      return `Stop ${index + 1}: ${stop.storeName}\n${addressLine}- ` + stop.itemsToBuy.join('\n- ');
    }).join('\n\n')}`;
    
    if (navigator.share) {
        try {
            await navigator.share({
                title: 'My Shopping Route from Near Buy',
                text: routeText,
            });
        } catch (error) {
            console.error('Error sharing:', error);
        }
    } else {
        try {
            await navigator.clipboard.writeText(routeText);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000); // Reset after 2 seconds
        } catch (error) {
            console.error('Error copying to clipboard:', error);
            alert('Failed to copy route to clipboard.');
        }
    }
  };

  return (
    <div className="animate-fade-in-up">
      <div className="flex flex-col sm:flex-row justify-between items-start mb-6">
        <div className="flex items-center">
          <div className="flex-shrink-0 text-green-500 dark:text-green-400">
            <ChecklistIcon className="h-10 w-10" />
          </div>
          <div className="ml-3">
            <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-500 to-blue-500">
              Your Shopping Run
            </h2>
            <p className="text-gray-500 dark:text-gray-400">Track your items as you go.</p>
          </div>
        </div>
        <div className="flex items-center space-x-2 mt-3 sm:mt-0 self-end sm:self-auto">
            <button
                onClick={() => setIsMapModalOpen(true)}
                className="flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition duration-300"
                aria-label="Visualize route on map"
                title="Visualize Route"
            >
                <MapIcon />
                <span className="ml-2">Visualize</span>
            </button>
            <button
                onClick={handleShare}
                className="flex items-center justify-center bg-teal-500 hover:bg-teal-600 text-white font-bold py-2 px-4 rounded-lg transition duration-300"
                aria-label="Share route"
                title="Share Route"
            >
                <ShareIcon />
                <span className="ml-2">{copied ? 'Copied!' : 'Share'}</span>
            </button>
            <button
            onClick={onClearRoute}
            className="flex items-center justify-center bg-red-600 hover:bg-red-700 disabled:bg-gray-500 text-white font-bold py-2 px-4 rounded-lg transition duration-300"
            >
            <XIcon />
            <span className="ml-2">End Run</span>
            </button>
        </div>
      </div>
      
      <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-6 shadow-lg">
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
                  <span className="text-gray-700 dark:text-gray-300">Final Estimated Cost:</span>
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

       <MapSelectionModal 
        isOpen={isMapModalOpen}
        onClose={() => setIsMapModalOpen(false)}
        route={route}
        allStores={allStores}
      />
    </div>
  );
};