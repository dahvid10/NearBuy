import React, { useMemo } from 'react';
import type { Store, Item, RouteStop } from '../types';
import { MapPinIcon, ExternalLinkIcon, StarIcon, XIcon, ChevronDownIcon } from './icons';
import { ItemRow } from './ItemRow';

interface StoreCardProps {
  store: Store;
  allStores: Store[];
  onItemSwap: (fromStoreName: string, toStore: Store, item: Item) => void;
  onRemove: (storeName: string) => void;
  isBuildingCustomRoute: boolean;
  onToggleItemInCustomRoute: (storeName: string, item: Item) => void;
  onToggleAllItemsInCustomRoute: (storeName: string, items: Item[]) => void;
  customRouteStops: RouteStop[];
  isExpanded: boolean;
  onToggleExpand: () => void;
}

export const StoreCard: React.FC<StoreCardProps> = ({ store, allStores, onItemSwap, onRemove, isBuildingCustomRoute, onToggleItemInCustomRoute, onToggleAllItemsInCustomRoute, customRouteStops, isExpanded, onToggleExpand }) => {

  const isStoreInCustomRoute = useMemo(() =>
    customRouteStops.some(stop => stop.storeName === store.name),
    [customRouteStops, store.name]
  );
  
  const areAllItemsSelected = useMemo(() => {
    if (store.items.length === 0) return false;
    const storeStop = customRouteStops.find(stop => stop.storeName === store.name);
    if (!storeStop) return false;

    const allItemNamesLower = new Set(store.items.map(item => item.name.toLowerCase()));
    const selectedItemsLower = new Set(storeStop.itemsToBuy.map((i: string) => i.toLowerCase()));

    if (allItemNamesLower.size !== selectedItemsLower.size) return false;

    for (const item of allItemNamesLower) {
        if (!selectedItemsLower.has(item)) {
            return false;
        }
    }
    return true;
  }, [customRouteStops, store.items, store.name]);

  const cardId = useMemo(() => `store-card-items-${store.name.replace(/\s+/g, '-')}`, [store.name]);

  return (
    <div className={`bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 shadow-md transition-all duration-300 hover:border-blue-500 relative ${!isBuildingCustomRoute ? 'hover:scale-105' : ''} ${isStoreInCustomRoute ? 'border-green-500 scale-105' : ''}`}>
      {!isBuildingCustomRoute && (
          <button onClick={() => onRemove(store.name)} className="absolute top-2 right-2 p-1 text-gray-400 dark:text-gray-500 hover:text-red-500 transition-colors z-10" title="Remove this store">
              <XIcon />
          </button>
      )}
      
      <button 
        className="flex justify-between items-start w-full text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-gray-800 rounded-md -m-2 p-2"
        onClick={onToggleExpand}
        aria-expanded={isExpanded}
        aria-controls={cardId}
      >
        <div className="flex-grow">
          <h3 className="text-xl font-bold text-green-600 dark:text-green-400">{store.name}</h3>
          <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mt-1">
            <MapPinIcon />
            <span className="ml-2">{store.address} - <span className="font-semibold">{store.distance}</span></span>
          </div>
          <div className="flex items-center text-sm text-yellow-500 dark:text-yellow-400 mt-1">
            <StarIcon />
            <span className="ml-2 font-semibold">{store.reviews}</span>
          </div>
        </div>
        <div className="flex items-center text-right flex-shrink-0 pl-4">
          <div>
            <p className="text-gray-500 dark:text-gray-400 text-sm">Subtotal</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">${store.subtotal.toFixed(2)}</p>
          </div>
          <ChevronDownIcon className={`ml-2 h-6 w-6 text-gray-400 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
        </div>
      </button>

      <div 
        id={cardId}
        className={`transition-all duration-500 ease-in-out overflow-hidden ${isExpanded ? 'max-h-[1000px] opacity-100 pt-4' : 'max-h-0 opacity-0'}`}
      >
        <div className="border-t border-gray-200 dark:border-gray-700"></div>
        <div className="pt-4">
          <div className="flex justify-between items-center mb-2">
            <h4 className="font-semibold text-gray-700 dark:text-gray-300">Items Found:</h4>
            {isBuildingCustomRoute && store.items.length > 0 && (
                <button
                    onClick={() => onToggleAllItemsInCustomRoute(store.name, store.items)}
                    className="text-sm font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 transition-colors px-2 py-1 rounded"
                    aria-label={areAllItemsSelected ? `Deselect all items from ${store.name}` : `Select all items from ${store.name}`}
                >
                    {areAllItemsSelected ? 'Deselect All' : 'Select All'}
                </button>
            )}
          </div>
          <ul className="space-y-1 max-h-56 overflow-y-auto pr-2">
            {store.items.map((item, index) => {
               const alternatives = allStores
                .filter(s =>
                  s.name !== store.name &&
                  s.items.some(i => i.name.toLowerCase() === item.name.toLowerCase() && i.price < item.price)
                )
                .map(s => {
                  const alternativeItem = s.items.find(i => i.name.toLowerCase() === item.name.toLowerCase())!;
                  return { storeName: s.name, price: alternativeItem.price, store: s };
                })
                .sort((a, b) => a.price - b.price)
                .slice(0, 3);

              return (
                <ItemRow
                  key={`${item.name}-${index}`}
                  item={item}
                  alternatives={alternatives}
                  fromStoreName={store.name}
                  onItemSwap={onItemSwap}
                  isBuilding={isBuildingCustomRoute}
                  onToggle={() => onToggleItemInCustomRoute(store.name, item)}
                  isChecked={customRouteStops.some(s => s.storeName === store.name && s.itemsToBuy.some(i => i.toLowerCase() === item.name.toLowerCase()))}
                />
              );
            })}
          </ul>
        </div>
      </div>
      {store.url && (
         <div className="mt-6 text-right">
            <a
            href={store.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition duration-300"
            >
            <ExternalLinkIcon />
            <span className="ml-2">Order Online</span>
            </a>
        </div>
      )}
    </div>
  );
};