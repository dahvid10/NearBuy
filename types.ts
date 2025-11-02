export interface Item {
  name: string;
  price: number;
}

export interface Store {
  type: 'store';
  name: string;
  address: string;
  distance: string;
  reviews: string;
  url: string | null;
  items: Item[];
  subtotal: number;
}

export interface GasPrice {
  grade: 'Regular' | 'Mid-grade' | 'Premium' | 'Diesel' | string;
  price: number;
}

export interface GasStation {
  type: 'gas';
  name: string;
  address: string;
  distance: string;
  reviews: string;
  url: string | null;
  prices: GasPrice[];
}

export type SearchResult = Store | GasStation;

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export type SortOption = 'subtotal' | 'distance' | 'reviews' | 'gas_price';

export interface RouteStop {
  storeName: string;
  itemsToBuy: string[];
}

export interface OptimalRoute {
  stops: RouteStop[];
  totalCost: number;
  totalDistance: string;
  isModified?: boolean;
}

export interface SavedList {
  id: string;
  name: string;
  content: string;
}

export interface SavedSearch {
  id: string;
  name: string;
  shoppingList: string;
  results: SearchResult[];
  searchType: 'shopping' | 'gas';
  createdAt: number;
}
