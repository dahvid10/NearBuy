import React, { useState, useMemo } from 'react';
import type { OptimalRoute, Store, Item } from '../types';
import { RouteIcon, DollarSignIcon, MapPinIcon, ChecklistIcon, FlagStartIcon, FlagFinishIcon, CircleIcon, SwapIcon, ShareIcon, MapIcon } from './icons';

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
        <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50 transition-opacity" role="dialog" aria-modal="true" aria-labelledby="map-modal-title">
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


interface OptimalRouteDisplayProps {
  route: OptimalRoute;
  onClear: () => void;
  allStores: Store[];
  onStoreSwap: (originalStoreName: string, newStore: Store, itemsToBuy: string[]) => void;
}

export const OptimalRouteDisplay: React.FC<OptimalRouteDisplayProps> = ({ route, onClear, allStores, onStoreSwap }) => {
  const [swappingStopIndex, setSwappingStopIndex] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);

  const getStopSubtotal = (store: Store, items: string[]): number => {
      return items.reduce((total, itemName) => {
        const item = store.items.find(i => i.name.toLowerCase() === itemName.toLowerCase());
        return total + (item?.price || 0);
      }, 0);
  };
  
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
    <div className="bg-gray-50 dark:bg-gray-900 border-2 border-purple-300 dark:border-purple-500 rounded-lg p-6 shadow-2xl relative">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
        <div>
          <h3 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-pink-600 dark:from-purple-400 dark:to-pink-500 flex items-center">
            <RouteIcon />
            <span className="ml-2">Your Shopping Route</span>
          </h3>
          <p className="text-gray-500 dark:text-gray-400">The most cost-effective plan to get all your items.</p>
        </div>
        <div className="flex items-center space-x-2 mt-3 sm:mt-0 self-end sm:self-auto">
          <button
              onClick={() => setIsMapModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-1 px-3 rounded-lg text-sm transition flex items-center"
              aria-label="Visualize route on map"
              title="Visualize Route"
            >
              <MapIcon />
              <span className="ml-2">Visualize</span>
          </button>
          <button
              onClick={handleShare}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-1 px-3 rounded-lg text-sm transition flex items-center"
              aria-label="Share route"
              title="Share Route"
            >
              <ShareIcon />
              <span className="ml-2">{copied ? 'Copied!' : 'Share'}</span>
          </button>
          <button
            onClick={onClear}
            className="bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-300 font-bold py-1 px-3 rounded-lg text-sm transition"
            aria-label="Clear route"
          >
            &times;
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-100 dark:bg-gray-800/50 p-4 rounded-md mb-6">
        <div className="flex items-center">
          <DollarSignIcon />
          <span className="ml-2 text-gray-700 dark:text-gray-300">Total Estimated Cost:</span>
          <span className="ml-auto font-bold text-xl text-green-600 dark:text-green-400">${route.totalCost.toFixed(2)}</span>
        </div>
        <div className="flex items-center">
          <MapPinIcon />
          <span className="ml-2 text-gray-700 dark:text-gray-300">Estimated Distance:</span>
          <span className={`ml-auto font-bold text-xl ${route.isModified ? 'text-yellow-600 dark:text-yellow-400' : 'text-blue-600 dark:text-blue-400'}`}>{route.totalDistance}</span>
        </div>
      </div>
       {route.isModified && (
        <p className="text-center text-yellow-700 dark:text-yellow-500 text-sm mb-4 bg-yellow-100 dark:bg-yellow-900/50 p-2 rounded-md">
            This route has been manually modified. Distance estimate is no longer applicable.
        </p>
      )}

      <div className="relative pl-6">
        {/* Vertical connecting line */}
        <div className="absolute left-10 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700" aria-hidden="true"></div>

        {route.stops.map((stop, index) => {
          const isFirst = index === 0;
          const isLast = index === route.stops.length - 1;
          
          let Icon;
          if (isFirst) Icon = FlagStartIcon;
          else if (isLast) Icon = FlagFinishIcon;
          else Icon = CircleIcon;

          const currentStore = allStores.find(s => s.name === stop.storeName);
          const currentStopPrice = currentStore ? getStopSubtotal(currentStore, stop.itemsToBuy) : 0;

          const alternatives = allStores.filter(s =>
            s.name !== stop.storeName &&
            stop.itemsToBuy.every(itemToBuy =>
              s.items.some(storeItem => storeItem.name.toLowerCase() === itemToBuy.toLowerCase())
            )
          );

          return (
            <div key={index} className="relative flex items-start mb-8">
              <div className="absolute left-0 top-0 flex items-center justify-center -translate-x-1/2">
                <Icon />
              </div>
              <div className="ml-12 w-full">
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center">
                        <span className="flex items-center justify-center h-8 w-8 rounded-full bg-purple-600 text-white font-bold mr-3">{index + 1}</span>
                        <h4 className="text-lg font-semibold text-purple-700 dark:text-purple-300">{stop.storeName}</h4>
                    </div>
                    <button onClick={() => setSwappingStopIndex(swappingStopIndex === index ? null : index)} className="p-2 text-gray-500 dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 transition" title="Swap this store">
                        <SwapIcon/>
                    </button>
                  </div>
                  <ul className="pl-11 space-y-2">
                    {stop.itemsToBuy.map((item, itemIndex) => (
                      <li key={itemIndex} className="text-gray-800 dark:text-gray-300">
                        - {item}
                      </li>
                    ))}
                  </ul>

                  {swappingStopIndex === index && (
                    <div className="mt-4 pt-3 pl-11 border-t border-gray-200 dark:border-gray-700">
                        <h5 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-2">Swap with:</h5>
                        {alternatives.length > 0 ? (
                        <ul className="space-y-2">
                            {alternatives.map(altStore => {
                                const altPrice = getStopSubtotal(altStore, stop.itemsToBuy);
                                const diff = altPrice - currentStopPrice;
                                return (
                                    <li key={altStore.name} className="flex justify-between items-center p-2 bg-gray-100 dark:bg-gray-900 rounded-md">
                                        <div>
                                            <p className="font-semibold text-blue-600 dark:text-blue-300">{altStore.name}</p>
                                            <p className={`font-mono ${diff > 0 ? 'text-red-500 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                                                ${altPrice.toFixed(2)} ({diff >= 0 ? '+' : ''}${diff.toFixed(2)})
                                            </p>
                                        </div>
                                        <button 
                                            onClick={() => {
                                                onStoreSwap(stop.storeName, altStore, stop.itemsToBuy);
                                                setSwappingStopIndex(null);
                                            }}
                                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-1 px-2 rounded transition"
                                        >
                                            Select
                                        </button>
                                    </li>
                                )
                            })}
                        </ul>
                        ) : (() => {
                            // This calculation finds stores that have SOME but not ALL of the required items.
                            const partialAlternatives = allStores
                                .filter(s => s.name !== stop.storeName) // Exclude the current store.
                                .map(store => {
                                    // Find which items from the shopping list this alternative store has.
                                    const matchedItems = store.items.filter(storeItem => 
                                        stop.itemsToBuy.some(itemToBuy => itemToBuy.toLowerCase() === storeItem.name.toLowerCase())
                                    );
                        
                                    // Ignore stores that have no items, or all items (as they're handled as full alternatives).
                                    if (matchedItems.length === 0 || matchedItems.length === stop.itemsToBuy.length) {
                                        return null;
                                    }
                                    
                                    const subtotal = matchedItems.reduce((acc, item) => acc + item.price, 0);
                        
                                    return { store, matchedItems, subtotal };
                                })
                                .filter((item): item is { store: Store; matchedItems: Item[]; subtotal: number; } => item !== null)
                                .sort((a, b) => b.matchedItems.length - a.matchedItems.length || a.subtotal - b.subtotal) // Sort by most items found, then price.
                                .slice(0, 3); // Show top 3 partial matches.
                        
                            if (partialAlternatives.length > 0) {
                                return (
                                    <div>
                                        <p className="text-gray-400 dark:text-gray-500 text-sm italic mb-2">No single store has all items. Showing partial matches:</p>
                                        <ul className="space-y-2">
                                            {partialAlternatives.map(alt => (
                                                <li key={alt.store.name} className="p-2 bg-gray-100 dark:bg-gray-900 rounded-md text-sm">
                                                    <p className="font-semibold text-blue-600 dark:text-blue-300">{alt.store.name}</p>
                                                    <p className="text-gray-600 dark:text-gray-400">
                                                        Has {alt.matchedItems.length} of {stop.itemsToBuy.length} items:
                                                    </p>
                                                    <ul className="pl-4 space-y-1">
                                                        {alt.matchedItems.map(item => (
                                                            <li key={item.name} className="text-gray-500 dark:text-gray-500">
                                                                - {item.name} (${item.price.toFixed(2)})
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                );
                            } else {
                                return <p className="text-gray-500 dark:text-gray-500 text-sm">No other stores were found with any of these items.</p>;
                            }
                        })()}
                    </div>
                  )}

                </div>
              </div>
            </div>
          );
        })}
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